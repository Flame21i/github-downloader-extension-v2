"use strict";

const RELEASE_ENDPOINT = /^\/repos\/[^/]+\/[^/]+\/releases\/(?:latest|tags\/[^/]+)$/;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "gfd:fetch-release-json") return;

  let url;
  try {
    const senderUrl = new URL(sender.url);
    url = new URL(message.url);
    if (senderUrl.origin !== "https://github.com" ||
        url.origin !== "https://api.github.com" ||
        !RELEASE_ENDPOINT.test(url.pathname)) {
      sendResponse({ ok: false, error: "Invalid release API request" });
      return;
    }
  } catch (_) {
    sendResponse({ ok: false, error: "Invalid release API request" });
    return;
  }

  fetch(url.href, {
    headers: { Accept: "application/vnd.github+json" }
  }).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then(data => {
    sendResponse({ ok: true, data });
  }).catch(error => {
    sendResponse({ ok: false, error: error.message });
  });

  return true;
});
