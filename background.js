"use strict";

const RELEASE_ENDPOINT = /^\/repos\/[^/]+\/[^/]+\/releases\/(?:latest|tags\/[^/]+)$/;

/* =========================================================================
 * 1. API PROXY (For Popup & Content Script)
 * ========================================================================= */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "gfd:fetch-release-json") return;

  let url;
  try {
    url = new URL(message.url);

    const isFromGithub =
      sender.url &&
      new URL(sender.url).origin === "https://github.com";
    const isFromExtension =
      !sender.url || sender.url.startsWith("chrome-extension://") || sender.id === chrome.runtime.id;

    if (!isFromGithub && !isFromExtension) {
      sendResponse({ ok: false, error: "Invalid sender" });
      return;
    }

    if (
      url.origin !== "https://api.github.com" ||
      !RELEASE_ENDPOINT.test(url.pathname)
    ) {
      sendResponse({ ok: false, error: "Invalid release API request" });
      return;
    }
  } catch (_) {
    sendResponse({ ok: false, error: "Invalid release API request" });
    return;
  }

  fetch(url.href, {
    headers: { Accept: "application/vnd.github+json" }
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      sendResponse({ ok: true, data });
    })
    .catch(error => {
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});

/* =========================================================================
 * 2. INJECTION LOGIC (Restores elements when clicking the extension icon)
 * ========================================================================= */

// Helper to trigger the injection on a specific tab
async function injectContentScript(tabId) {
  if (!tabId) return;
  try {
    // Check if the tab is actually a GitHub page before trying to inject
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || !tab.url.startsWith("https://github.com/")) return;

    // Execute content.js in the page context
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content.js"]
    });
  } catch (err) {
    // Silently ignore errors for restricted pages (like chrome:// or the Web Store)
    console.debug("GFD: Could not inject content script", err);
  }
}

// 2a. Inject when the user clicks the extension toolbar icon
chrome.action.onClicked.addListener((tab) => {
  injectContentScript(tab.id);
});

// 2b. Inject whenever the user switches tabs or navigates to a new page
// This ensures the buttons are always present if the content script missed the initial load
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.startsWith("https://github.com/")) {
    injectContentScript(tabId);
  }
});