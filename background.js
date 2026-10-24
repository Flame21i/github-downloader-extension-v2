"use strict";

const RELEASE_ENDPOINT = /^\/repos\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/releases\/(?:latest|tags\/[^/]+)$/;
const FETCH_TIMEOUT_MS = 10000;

function isTrustedPageUrl(url) {
  if (typeof url !== "string") return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "github.com" || parsed.hostname === "www.github.com")
    );
  } catch {
    return false;
  }
}

function isTrustedReleaseUrl(url) {
  if (typeof url !== "string") return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "api.github.com" &&
      parsed.search === "" &&
      RELEASE_ENDPOINT.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "gfd:fetch-release-json") return;

  if (typeof message.url !== "string") {
    sendResponse({ ok: false, error: "Missing or invalid release URL" });
    return false;
  }

  handleFetchRequest(message, sender)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    });

  return true;
});

async function handleFetchRequest(message, sender) {
  if (!isTrustedPageUrl(sender?.url)) {
    throw new Error("Unauthorized sender origin");
  }

  if (!isTrustedReleaseUrl(message.url)) {
    throw new Error("Unauthorized release API request origin or path");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(message.url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "github-downloader-extension"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error("GitHub API rate limit exceeded");
      }
      throw new Error(`GitHub API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
