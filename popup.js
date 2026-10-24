"use strict";

/* =========================================================================
 * GitHub Downloader v2 — Popup UI
 * Reuses the same asset parsing / OS detection / scoring logic as content.js,
 * but renders into the extension popup instead of the GitHub page DOM.
 * ========================================================================= */

const MESSAGES = {
  all: "All files",
  installers: "Installers",
  portable: "Portable",
  cli: "CLI",
  gui: "GUI",
  source: "Source code",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  android: "Android",
  other: "Other",
  download: "Download",
  latest: "Latest release",
  sizeUnknown: "Size unavailable",
  assetsCount: "assets",
  recommendedSystem: "Recommended for your system",
  showMore: "Show all assets",
  showFewer: "Show fewer assets",
  sourceCode: "Source code",
  compatVerified: "Verified compatible with",
  compatUnavailable: "No assets compatible with your OS"
};

const ICONS = {
  download: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 11.5v2A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-2M8 1v9m-3.5-3.5L8 10l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  package: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1 6 3.2v7.6L8 15l-6-3.2V4.2L8 1Zm-6 3.2L8 7.5l6-3.3M8 7.5V15M5 2.6l6 3.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  windows: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M1 2.2 7 1.4v6H1V2.2Zm7-.9 7-1v7.1H8V1.3ZM1 8.5h6v6.1l-6-.8V8.5Zm7 0h7v7.1l-7-1V8.5Z"/></svg>',
  apple: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M11.8 8.5c0-1.8 1.5-2.7 1.6-2.8a3.5 3.5 0 0 0-2.7-1.4c-1.1-.1-2.2.7-2.8.7s-1.5-.7-2.5-.7a3.7 3.7 0 0 0-3.1 1.9c-1.3 2.2-.3 5.5 1 7.3.6.9 1.3 1.8 2.2 1.7.9 0 1.2-.6 2.3-.6s1.4.6 2.3.6 1.5-.8 2.1-1.7a8 8 0 0 0 1-2 3.2 3.2 0 0 1-1.4-3ZM9.9 3.1A3.4 3.4 0 0 0 10.7.5a3.5 3.5 0 0 0-2.3 1.2 3.2 3.2 0 0 0-.8 2.5 2.9 2.9 0 0 0 2.3-1.1Z"/></svg>',
  linux: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1.1c-2.2 0-3.4 1.8-3.4 4.1 0 1.1.3 2.1.7 2.8L3 10.3c-.5.7-.4 1.5.2 1.9.5.4 1.2.2 1.6-.4l1.1-1.6c.7.3 1.4.4 2.1.4s1.4-.1 2.1-.4l1.1 1.6c.4.6 1.1.8 1.6.4.6-.4.7-1.2.2-1.9l-2.3-2.3c.4-.7.7-1.7.7-2.8C11.4 2.9 10.2 1.1 8 1.1ZM6.3 5a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Zm3.4 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4ZM6 7.1h4v1H6v-1Z"/></svg>',
  android: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M3.2 5.3 2 3.2l.8-.4L4 4.9a7.2 7.2 0 0 1 8 0l1.2-2.1.8.4-1.2 2.1c.8.8 1.2 1.8 1.2 3H2c0-1.2.4-2.2 1.2-3ZM5 6.5a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2Zm6 0a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2ZM2 9.2h12v3.1a1 1 0 0 1-1 1h-1v1.2h-1.3v-1.2H5.3v1.2H4v-1.2H3a1 1 0 0 1-1-1V9.2Z"/></svg>',
  file: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5h6l4 4v9H3zM9 1.5v4h4M5 9h6M5 11.5h6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>'
};

/* ---------- small helpers ---------- */
function t(key) { return MESSAGES[key] || key; }

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function formatBytes(bytes) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) < 0) return t("sizeUnknown");
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = n / 1024, i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[i]}`;
}

function formatAssetSize(bytes) {
  return bytes == null ? t("sizeUnknown") : formatBytes(bytes);
}

/* ---------- OS / arch detection (same as content.js) ---------- */
let cachedUserOS = null;

function detectUserOS() {
  if (cachedUserOS) return cachedUserOS;
  const ua = `${navigator.userAgent || ""} ${navigator.platform || ""}`.toLowerCase();
  let os = "other";
  let method = "User-Agent";

  if (navigator.userAgentData?.platform) {
    const p = navigator.userAgentData.platform.toLowerCase();
    if (p.includes("win")) os = "windows";
    else if (p.includes("mac")) os = "macos";
    else if (p.includes("linux")) os = "linux";
    else if (p.includes("android")) os = "android";
    method = "Client Hints";
  }
  if (os === "other") {
    if (/android/.test(ua)) os = "android";
    else if (/windows|win32|win64/.test(ua)) os = "windows";
    else if (/macintosh|mac os|macintel|darwin/.test(ua)) os = "macos";
    else if (/linux|x11/.test(ua)) os = "linux";
  }

  let arch = "unknown";
  if (/arm64|aarch64/.test(ua)) arch = "arm64";
  else if (/x86_64|win64|x64|amd64|wow64/.test(ua)) arch = "x64";
  else if (/i686|i386|x86/.test(ua)) arch = "x86";

  if (os === "macos" && arch === "unknown") {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (/apple/i.test(renderer) && !/apple software/i.test(renderer)) {
            arch = "arm64";
          } else {
            arch = "x64";
          }
        }
      }
    } catch (_) { arch = "x64"; }
  }

  cachedUserOS = { os, arch, method };
  return cachedUserOS;
}

function formatOSName(os) {
  return ({ windows: "Windows", macos: "macOS", linux: "Linux", android: "Android" })[os] || "your system";
}

/* ---------- file-name parsing (same as content.js) ---------- */
function parseFileInfo(name) {
  const n = String(name || "").toLowerCase();
  let os = "other";
  if (/(android|\.apk\b|\.aab\b)/.test(n)) os = "android";
  else if (/(windows|\bwin\b|[-_.]win[-_.]|win32|win64|win-?x64|win-?x86|\.exe\b|\.msi\b|\.msix\b|\.appx\b)/.test(n)) os = "windows";
  else if (/(macos|mac-os|macosx|darwin|osx|\.dmg\b|\.pkg\b|\bmac\b|[-_.]mac[-_.])/i.test(n)) os = "macos";
  else if (/(linux|\.appimage\b|\.deb\b|\.rpm\b|\.flatpak\b|\.snap\b|[-_.]linux[-_.])/i.test(n)) os = "linux";
  else if (/(universal|all-platforms|cross-platform)/.test(n)) os = "all";

  let arch = "unknown";
  if (/(aarch64|arm64|armv8)/.test(n)) arch = "arm64";
  else if (/(armv7|armhf|\barm\b)/.test(n)) arch = "arm";
  else if (/(x86_64|x86-64|x64|amd64|64-bit|win64)/.test(n)) arch = "x64";
  else if (/(i386|i686|x86|32-bit|win32)/.test(n)) arch = "x86";
  else if (/(universal|universal2)/.test(n)) arch = "universal";

  const isSource = /(^|[-_.])(source|src|sources|sourcecode)([-_.]|$)/.test(n) ||
    /(^|\/)(source code|source archive)$/.test(n);
  const isArchive = /\.(zip|tar|tgz|tar\.gz|tar\.xz|7z|rar|bz2|gz|xz)$/i.test(n);
  const isInstaller = /\.(exe|msi|msix|appx|dmg|pkg|deb|rpm|apk|aab|flatpak|snap)$/i.test(n) ||
    /(installer|setup|install|\.appimage\b)/.test(n);
  const isPortable = /(portable|no-install|noinstall|standalone|\.appimage\b)/.test(n);
  const isCLI = /(^|[-_.])(cli|command[-_]?line|terminal)([-_.]|$)/.test(n);
  const isGUI = /(^|[-_.])(gui|desktop)([-_.]|$)/.test(n);

  let type = "other";
  if (isSource || /^(source code|source archive)$/i.test(name)) type = "source";
  else if (isInstaller && !isPortable) type = "installer";
  else if (isPortable) type = "portable";
  else if (isCLI) type = "cli";
  else if (isGUI) type = "gui";
  else if (isInstaller) type = "installer";
  else if (isArchive) type = "portable";

  return { os, arch, type, isSource, isInstaller, isPortable, isCLI, isGUI };
}

/* ---------- URL helpers ---------- */
function repoUrl(owner, repo) {
  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}
function latestReleaseUrl(owner, repo) {
  return `${repoUrl(owner, repo)}/releases/latest`;
}
function tagReleaseUrl(owner, repo, tag) {
  return `${repoUrl(owner, repo)}/releases/tag/${encodeURIComponent(tag)}`;
}
function releasesUrl(owner, repo) {
  return `${repoUrl(owner, repo)}/releases`;
}

function sourceArchiveUrls(owner, repo, tag) {
  const ref = encodeURIComponent(tag || "main");
  const isBranch = !tag || /^(main|master|develop|dev|trunk)$/i.test(tag);
  const basePath = isBranch
    ? `${repoUrl(owner, repo)}/archive/refs/heads/${ref}`
    : `${repoUrl(owner, repo)}/archive/refs/tags/${ref}`;
  return { zipUrl: `${basePath}.zip`, tarUrl: `${basePath}.tar.gz` };
}

/* ---------- repository detection from a URL ---------- */
function detectRepoFromUrl(href) {
  let u;
  try { u = new URL(href); } catch (_) { return null; }
  if (u.origin !== "https://github.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");
  const reserved = ["settings", "marketplace", "topics", "collections", "sponsors", "orgs", "login", "join", "features", "enterprise", "apps", "organizations"];
  if (reserved.includes(owner.toLowerCase())) return null;
  if (!owner || !repo || owner.startsWith("!") || repo.startsWith("!")) return null;

  let tag = null;
  if (parts.length >= 5 && parts[2] === "releases" && parts[3] === "tag") {
    tag = decodeURIComponent(parts.slice(4).join("/"));
  }
  return { owner, repo, tag };
}

/* ---------- API fetch (uses background proxy for safety) ---------- */
function fetchReleaseJSON(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "gfd:fetch-release-json", url }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || "Release API request failed"));
        return;
      }
      resolve(response.data);
    });
  });
}

async function fetchReleaseData(repo) {
  const { owner, repo: name, tag } = repo;
  const apiUrl = tag
    ? `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/releases/tags/${encodeURIComponent(tag)}`
    : `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/releases/latest`;

  const release = await fetchReleaseJSON(apiUrl);
  const assets = (Array.isArray(release?.assets) ? release.assets : []).map(a => ({
    id: a.id,
    name: a.name,
    size: Number.isFinite(a.size) ? a.size : null,
    download_count: a.download_count ?? null,
    browser_download_url: a.browser_download_url,
    ...parseFileInfo(a.name)
  })).filter(a => a.browser_download_url && /^https:\/\/github\.com\//i.test(a.browser_download_url));

  return { release, assets };
}

/* ---------- scoring / grouping (same as content.js) ---------- */
function scoreAsset(asset, device) {
  const n = asset.name.toLowerCase();
  let score = 0;
  if (asset.os === device.os) score += 100;
  else if (asset.os === "all") score += 65;
  else if (asset.os === "other") score += 0;
  else score -= 100;

  if (asset.arch === device.arch) score += 30;
  else if (asset.arch === "universal") score += 25;
  else if (asset.arch === "unknown") score += 5;
  else if (asset.arch === "arm" && device.arch === "arm64") score += 15;
  else if (asset.arch !== "unknown" && device.arch !== "unknown") score -= 30;

  if (asset.type === "installer") score += 20;
  if (asset.type === "gui") score += 10;
  if (asset.type === "portable") score += 5;
  if (asset.type === "cli") score -= 4;
  if (asset.type === "source" || asset.isSource) score -= 300;

  if (/debug|symbols|\.pdb\b|checksum|sha256|sha512|\.sig\b|\.asc\b|\.txt\b|\.json\b|sbom/.test(n)) score -= 150;
  if (/arm64|aarch64/.test(n) && device.arch !== "arm64" && device.arch !== "unknown") score -= 25;

  return score;
}

function getBestAsset(assets) {
  const device = detectUserOS();
  const viable = assets.filter(a => a.type !== "source" && !a.isSource &&
    !/\.(sha256|sha512|sha1|sig|asc|md5|sbom|intoto\.jsonl)$/i.test(a.name) &&
    !/checksums|sbom/i.test(a.name));
  const sorted = [...viable].sort((a, b) => scoreAsset(b, device) - scoreAsset(a, device));
  if (!sorted.length || scoreAsset(sorted[0], device) < 20) return null;
  return sorted[0];
}

function groupAssets(assets) {
  const groups = [
    { key: "windows", title: t("windows"), assets: [] },
    { key: "macos", title: t("macos"), assets: [] },
    { key: "linux", title: t("linux"), assets: [] },
    { key: "android", title: t("android"), assets: [] },
    { key: "all", title: t("all"), assets: [] },
    { key: "other", title: t("other"), assets: [] }
  ];
  for (const asset of assets) {
    if (asset.type === "source") continue;
    const group = groups.find(g => g.key === asset.os) || groups[groups.length - 1];
    group.assets.push(asset);
  }
  const userOS = detectUserOS().os;
  groups.sort((a, b) => {
    if (a.key === userOS) return -1;
    if (b.key === userOS) return 1;
    const order = ["windows", "macos", "linux", "android", "all", "other"];
    return order.indexOf(a.key) - order.indexOf(b.key);
  });
  for (const g of groups) {
    g.assets.sort((a, b) => {
      const order = { installer: 0, gui: 1, portable: 2, cli: 3, other: 4, source: 5 };
      return (order[a.type] ?? 4) - (order[b.type] ?? 4) || a.name.localeCompare(b.name);
    });
  }
  return groups.filter(g => g.assets.length);
}

function typeLabel(type) {
  return ({ installer: t("installers"), portable: t("portable"), cli: t("cli"), gui: t("gui"), source: t("source"), other: t("other") })[type] || t("other");
}

function iconForOS(os) {
  return ({ windows: ICONS.windows, macos: ICONS.apple, linux: ICONS.linux, android: ICONS.android, all: ICONS.package })[os] || ICONS.file;
}

/* ---------- rendering helpers ---------- */
function renderAssetCard(asset) {
  const url = asset.browser_download_url;
  const size = formatAssetSize(asset.size);
  const tags = [typeLabel(asset.type), asset.arch !== "unknown" ? asset.arch : null].filter(Boolean);

  return `<article class="gfd-card" data-gfd-name="${escapeHTML(asset.name.toLowerCase())}" data-gfd-type="${escapeHTML(asset.type)}">
    <div class="gfd-card-top">
      <span class="gfd-icon">${iconForOS(asset.os)}</span>
      <div class="gfd-file-info">
        <a class="gfd-file-name" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" title="${escapeHTML(asset.name)}">${escapeHTML(asset.name)}</a>
        <div class="gfd-meta"><span>${escapeHTML(size)}</span>${asset.download_count != null ? `<span>↓ ${Number(asset.download_count).toLocaleString()}</span>` : ""}</div>
      </div>
    </div>
    <div class="gfd-card-bottom">
      <span>${tags.map(tag => `<span class="gfd-tag">${escapeHTML(tag)}</span>`).join(" ")}</span>
      <a class="gfd-download-secondary" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${ICONS.download}<span>${escapeHTML(t("download"))}</span></a>
    </div>
  </article>`;
}

/* ---------- DOM references ---------- */
const el = {
  repoName: document.getElementById("gfd-repo-name"),
  repoTag: document.getElementById("gfd-repo-tag"),
  refresh: document.getElementById("gfd-refresh"),
  stateNotRepo: document.getElementById("gfd-state-not-repo"),
  stateLoading: document.getElementById("gfd-state-loading"),
  stateContent: document.getElementById("gfd-state-content"),
  stateError: document.getElementById("gfd-state-error"),
  stateNoAssets: document.getElementById("gfd-state-no-assets"),
  errorText: document.getElementById("gfd-error-text"),
  retry: document.getElementById("gfd-retry"),
  loadingText: document.getElementById("gfd-loading-text"),

  hero: document.getElementById("gfd-hero"),
  heroIcon: document.getElementById("gfd-hero-icon"),
  heroName: document.getElementById("gfd-hero-name"),
  heroMeta: document.getElementById("gfd-hero-meta"),
  heroDownload: document.getElementById("gfd-hero-download"),
  heroDownloadText: document.getElementById("gfd-hero-download-text"),
  heroBannerText: document.getElementById("gfd-hero-banner-text"),

  noCompat: document.getElementById("gfd-no-compat"),
  sourceZip: document.getElementById("gfd-source-zip"),
  sourceTar: document.getElementById("gfd-source-tar"),

  toggleMore: document.getElementById("gfd-toggle-more"),
  toggleMoreText: document.getElementById("gfd-toggle-more-text"),
  otherBox: document.getElementById("gfd-other-box"),
  tabs: document.getElementById("gfd-tabs"),
  otherList: document.getElementById("gfd-other-list"),

  viewRelease: document.getElementById("gfd-view-release"),
  footMeta: document.getElementById("gfd-foot-meta")
};

/* ---------- state ---------- */
let currentRepo = null;
let currentData = null;

/* ---------- state switching ---------- */
function showState(name) {
  // Hide all states explicitly
  el.stateNotRepo.hidden = (name !== "not-repo");
  el.stateLoading.hidden = (name !== "loading");
  el.stateContent.hidden = (name !== "content");
  el.stateError.hidden = (name !== "error");
  
  // Ensure child components are hidden appropriately when not in content state
  if (name !== "content") {
    el.hero.hidden = true;
    el.noCompat.hidden = true;
    el.toggleMore.hidden = true;
    el.otherBox.hidden = true;
    el.stateNoAssets.hidden = true;
  }
}

/* ---------- main render ---------- */
function render(data) {
  const { release, assets } = data;
  const userDevice = detectUserOS();
  const osName = formatOSName(userDevice.os);
  const archName = userDevice.arch !== "unknown" ? userDevice.arch : "64-bit";

  const recommended = getBestAsset(assets);
  const nonSourceAssets = assets.filter(a => a.type !== "source");
  const otherAssets = recommended ? nonSourceAssets.filter(a => a.id !== recommended.id) : nonSourceAssets;
  const groupedOther = groupAssets(otherAssets);

  // Header
  el.repoName.textContent = `${currentRepo.owner}/${currentRepo.repo}`;
  el.repoTag.textContent = release?.name || release?.tag_name || (currentRepo.tag || t("latest"));

  // Source archive links
  const currentTag = currentRepo.tag || release?.tag_name || "main";
  const { zipUrl, tarUrl } = sourceArchiveUrls(currentRepo.owner, currentRepo.repo, currentTag);
  el.sourceZip.href = zipUrl;
  el.sourceTar.href = tarUrl;

  // Footer
  const releaseURL = release?.html_url || (currentRepo.tag
    ? tagReleaseUrl(currentRepo.owner, currentRepo.repo, currentRepo.tag)
    : latestReleaseUrl(currentRepo.owner, currentRepo.repo));
  el.viewRelease.href = releaseURL;
  el.footMeta.textContent = `${assets.length} ${t("assetsCount")}`;

  // Hero
  if (recommended) {
    el.hero.hidden = false;
    el.noCompat.hidden = true;
    el.heroIcon.innerHTML = iconForOS(recommended.os);
    el.heroName.textContent = recommended.name;
    el.heroName.href = recommended.browser_download_url;

    const recSize = formatAssetSize(recommended.size);
    const tags = [typeLabel(recommended.type), recommended.arch !== "unknown" ? recommended.arch : null].filter(Boolean);
    el.heroMeta.innerHTML = `
      <span>${escapeHTML(recSize)}</span>
      ${recommended.download_count != null ? `<span>↓ ${Number(recommended.download_count).toLocaleString()}</span>` : ""}
      ${tags.map(tag => `<span class="gfd-tag">${escapeHTML(tag)}</span>`).join(" ")}
    `;
    el.heroDownload.href = recommended.browser_download_url;
    el.heroDownloadText.textContent = `${t("download")} (${recSize})`;
    el.heroBannerText.innerHTML = `${escapeHTML(t("compatVerified"))} <strong>${escapeHTML(osName)} (${escapeHTML(archName)})</strong>`;
  } else {
    el.hero.hidden = true;
    el.noCompat.hidden = false;
  }

  // Empty assets state
  if (assets.length === 0) {
    el.stateNoAssets.hidden = false;
    el.otherBox.hidden = true;
    el.toggleMore.hidden = true;
  } else {
    el.stateNoAssets.hidden = true;
  }

  // Other assets toggle
  if (otherAssets.length > 0) {
    el.toggleMore.hidden = false;
    el.toggleMore.setAttribute("aria-expanded", "false");
    el.toggleMoreText.textContent = `${t("showMore")} (${otherAssets.length})`;
    el.otherBox.hidden = true;
    buildTabs(otherAssets);
    buildOtherList(groupedOther);
  } else {
    el.toggleMore.hidden = true;
    el.otherBox.hidden = true;
  }

  showState("content");
}

function buildTabs(otherAssets) {
  el.tabs.innerHTML = "";
  const counts = {
    all: otherAssets.length,
    installer: otherAssets.filter(a => a.type === "installer").length,
    portable: otherAssets.filter(a => a.type === "portable").length,
    cli: otherAssets.filter(a => a.type === "cli").length,
    gui: otherAssets.filter(a => a.type === "gui").length
  };

  const addTab = (key, label) => {
    if (!counts[key]) return;
    const btn = document.createElement("button");
    btn.className = "gfd-tab";
    btn.type = "button";
    btn.dataset.filter = key;
    btn.setAttribute("aria-pressed", key === "all" ? "true" : "false");
    btn.textContent = `${label} (${counts[key]})`;
    btn.addEventListener("click", () => {
      el.tabs.querySelectorAll(".gfd-tab").forEach(b =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      applyFilter();
    });
    el.tabs.appendChild(btn);
  };

  addTab("all", t("all"));
  addTab("installer", t("installers"));
  addTab("portable", t("portable"));
  addTab("cli", t("cli"));
  addTab("gui", t("gui"));
}

function buildOtherList(groupedOther) {
  el.otherList.innerHTML = groupedOther.map(group => `
    <section data-section="${escapeHTML(group.key)}">
      <h3 class="gfd-section-head">
        ${iconForOS(group.key)} ${escapeHTML(group.title)} <span class="gfd-count">(${group.assets.length})</span>
      </h3>
      <div class="gfd-assets-list">
        ${group.assets.map(a => renderAssetCard(a)).join("")}
      </div>
    </section>
  `).join("");
}

function applyFilter() {
  const active = el.tabs.querySelector('[data-filter][aria-pressed="true"]')?.dataset.filter || "all";
  el.otherList.querySelectorAll(".gfd-card").forEach(card => {
    const matches = active === "all" || card.dataset.gfdType === active;
    card.style.display = matches ? "" : "none";
  });
  el.otherList.querySelectorAll("section[data-section]").forEach(section => {
    const anyVisible = [...section.querySelectorAll(".gfd-card")].some(c => c.style.display !== "none");
    section.style.display = anyVisible ? "" : "none";
  });
}

/* ---------- "Show all" toggle ---------- */
el.toggleMore.addEventListener("click", () => {
  const isHidden = el.otherBox.hidden;
  el.otherBox.hidden = !isHidden;
  el.toggleMore.setAttribute("aria-expanded", String(isHidden));
  const count = el.otherList.querySelectorAll(".gfd-card").length;
  el.toggleMoreText.textContent = isHidden ? t("showFewer") : `${t("showMore")} (${count})`;
});

/* ---------- main flow ---------- */
async function loadForTab(tab) {
  showState("loading");
  el.loadingText.textContent = "Checking releases…";

  const href = tab?.url || "";
  const repo = detectRepoFromUrl(href);
  if (!repo) {
    currentRepo = null;
    currentData = null;
    el.repoName.textContent = "—";
    el.repoTag.textContent = "Latest release";
    showState("not-repo");
    return;
  }

  currentRepo = repo;
  el.repoName.textContent = `${repo.owner}/${repo.repo}`;
  el.repoTag.textContent = repo.tag || "Latest release";

  try {
    const data = await fetchReleaseData(repo);
    currentData = data;

    if (!data.release && data.assets.length === 0) {
      showState("error");
      el.errorText.textContent = "This repository has no published releases.";
      return;
    }

    render(data);
  } catch (err) {
    showState("error");
    el.errorText.textContent = err?.message || "Could not load release information.";
  }
}

async function reload() {
  el.refresh.classList.add("spinning");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await loadForTab(tab);
  } finally {
    el.refresh.classList.remove("spinning");
  }
}

el.refresh.addEventListener("click", reload);
el.retry.addEventListener("click", reload);

/* boot */
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await loadForTab(tab);
  } catch (_) {
    showState("error");
    el.errorText.textContent = "Could not read the active tab.";
  }
})();