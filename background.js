"use strict";

// Modern MV3 Service Worker for GitHub Release fetching

// Regex to strictly match GitHub release API paths
const RELEASE_ENDPOINT = /^\/repos\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/releases\/(?:latest|tags\/[^/]+)$/;
const FETCH_TIMEOUT_MS = 10000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only process our specific message type
  if (message?.type !== "gfd:fetch-release-json") return;

  // We must return true synchronously to indicate we will send a response asynchronously
  handleFetchRequest(message, sender)
    .then(sendResponse)
    .catch(error => sendResponse({ ok: false, error: error.message }));

  return true;
});

async function handleFetchRequest(message, sender) {
  // 1. Validate the sender (must be a content script running on github.com)
  if (!sender.url) throw new Error("Missing sender URL");
  
  let senderUrl, targetUrl;
  try {
    senderUrl = new URL(sender.url);
    targetUrl = new URL(message.url);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Strict origin matching prevents malicious extensions or sites from spoofing requests
  const isSenderTrusted = senderUrl.protocol === "https:" && 
    (senderUrl.hostname === "github.com" || senderUrl.hostname === "www.github.com");
  
  const isTargetTrusted = targetUrl.protocol === "https:" && 
    targetUrl.hostname === "api.github.com" && 
    RELEASE_ENDPOINT.test(targetUrl.pathname);

  if (!isSenderTrusted || !isTargetTrusted) {
    throw new Error("Unauthorized release API request origin or path");
  }

  // 2. Setup AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // 3. Fetch with proper GitHub API headers
    const response = await fetch(targetUrl.href, {
      method: "GET",
      headers: {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      // Provide useful error codes for rate limits
      if (response.status === 403 || response.status === 429) {
        throw new Error("GitHub API rate limit exceeded");
      }
      throw new Error(`GitHub API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return { ok: true, data };

  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    // 4. Always clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
}
