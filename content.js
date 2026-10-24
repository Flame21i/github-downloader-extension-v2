(() => {
  "use strict";

  /*
   * GitHub Downloader v2
   * Chrome MV3 extension. No external libraries, remote code, or inline event handlers.
   */
  const EXT = "gfd";
  const STYLE_ID = "gfd-extension-styles";
  const GRID_ID = "gfd-release-grid";
  const BUTTON_ID = "gfd-home-download";
  const CACHE_TTL = 5 * 60 * 1000;
  const cache = new Map();
  const pending = new Map();

  let observer = null;
  let rafScheduleId = null;
  let lastRouteKey = "";
  let renderToken = 0;
  let isUpdatingDOM = false;
  let cachedUserOS = null;

  const MESSAGES = {
    title: "Release assets",
    subtitle: "Downloads organized by platform and type",
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
    loading: "Checking releases…",
    noRelease: "This repository has no published releases.",
    noCompatibleOS: "This repository has no releases compatible with your OS.",
    noAssets: "This release has no downloadable assets.",
    apiFallback: "Some details could not be loaded; showing available page data.",
    viewRelease: "View release",
    viewReleases: "View releases",
    error: "Could not load release information.",
    sourceArchive: "Source archive",
    sizeUnknown: "Size unavailable",
    assetsCount: "assets",
    bestMatch: "Best match",
    recommendedSystem: "Recommended for your system",
    showMore: "Show all assets",
    showFewer: "Show fewer assets",
    search: "Filter assets…",
    sourceCode: "Source code",
    compatVerified: "Verified compatible with",
    compatUnavailable: "No assets compatible with your OS",
    archDetected: "Architecture verified"
  };

  const ICONS = {
    download: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 11.5v2A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-2M8 1v9m-3.5-3.5L8 10l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    downloadLg: '<svg viewBox="0 0 16 16" aria-hidden="true" style="width:18px;height:18px"><path d="M2 11.5v2A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-2M8 1v9m-3.5-3.5L8 10l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    package: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1 6 3.2v7.6L8 15l-6-3.2V4.2L8 1Zm-6 3.2L8 7.5l6-3.3M8 7.5V15M5 2.6l6 3.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    windows: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M1 2.2 7 1.4v6H1V2.2Zm7-.9 7-1v7.1H8V1.3ZM1 8.5h6v6.1l-6-.8V8.5Zm7 0h7v7.1l-7-1V8.5Z"/></svg>',
    apple: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M11.8 8.5c0-1.8 1.5-2.7 1.6-2.8a3.5 3.5 0 0 0-2.7-1.4c-1.1-.1-2.2.7-2.8.7s-1.5-.7-2.5-.7a3.7 3.7 0 0 0-3.1 1.9c-1.3 2.2-.3 5.5 1 7.3.6.9 1.3 1.8 2.2 1.7.9 0 1.2-.6 2.3-.6s1.4.6 2.3.6 1.5-.8 2.1-1.7a8 8 0 0 0 1-2 3.2 3.2 0 0 1-1.4-3ZM9.9 3.1A3.4 3.4 0 0 0 10.7.5a3.5 3.5 0 0 0-2.3 1.2 3.2 3.2 0 0 0-.8 2.5 2.9 2.9 0 0 0 2.3-1.1Z"/></svg>',
    linux: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1.1c-2.2 0-3.4 1.8-3.4 4.1 0 1.1.3 2.1.7 2.8L3 10.3c-.5.7-.4 1.5.2 1.9.5.4 1.2.2 1.6-.4l1.1-1.6c.7.3 1.4.4 2.1.4s1.4-.1 2.1-.4l1.1 1.6c.4.6 1.1.8 1.6.4.6-.4.7-1.2.2-1.9l-2.3-2.3c.4-.7.7-1.7.7-2.8C11.4 2.9 10.2 1.1 8 1.1ZM6.3 5a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Zm3.4 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4ZM6 7.1h4v1H6v-1Z"/></svg>',
    android: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M3.2 5.3 2 3.2l.8-.4L4 4.9a7.2 7.2 0 0 1 8 0l1.2-2.1.8.4-1.2 2.1c.8.8 1.2 1.8 1.2 3H2c0-1.2.4-2.2 1.2-3ZM5 6.5a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2Zm6 0a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2ZM2 9.2h12v3.1a1 1 0 0 1-1 1h-1v1.2h-1.3v-1.2H5.3v1.2H4v-1.2H3a1 1 0 0 1-1-1V9.2Z"/></svg>',
    file: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5h6l4 4v9H3zM9 1.5v4h4M5 9h6M5 11.5h6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    code: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M4.72 3.22a.75.75 0 0 1 1.06 1.06L2.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06L.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25zm6.56 0a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L14.94 8l-3.66-3.72z" fill="currentColor"/></svg>',
    chevronDown: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M12.78 6.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 7.28a.75.75 0 0 1 1.06-1.06L8 9.94l3.72-3.72a.75.75 0 0 1 1.06 0z" fill="currentColor"/></svg>',
    slash: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 13.5l7-11M13.5 8a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
    checkShield: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M8 0c-.26 0-.5.1-.68.28L1.47 6.13c-.3.3-.47.7-.47 1.13 0 4.1 2.94 7.74 6.8 8.68.13.04.27.06.4.06s.27-.02.4-.06C12.46 15 15.4 11.36 15.4 7.26c0-.43-.17-.83-.47-1.13L9.08.28A.96.96 0 0 0 8 0zm2.78 5.72a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 1 1 1.06-1.06L7 9.44l2.97-2.97a.75.75 0 0 1 1.06 0z" fill="currentColor"/></svg>',
    alertTriangle: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047zM8 5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 5zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor"/></svg>'
  };

  const CSS = `
    /* HORIZONTAL MARGIN: Matches GitHub's main navbar padding (32px) so it never touches screen edge */
    #${GRID_ID} {
      --gfd-bg: var(--bgColor-default, #0d1117);
      --gfd-panel: var(--bgColor-muted, #161b22);
      --gfd-border: var(--borderColor-default, #30363d);
      --gfd-fg: var(--fgColor-default, #c9d1d9);
      --gfd-muted: var(--fgColor-muted, #8b949e);
      color: var(--gfd-fg);
      margin: 20px 32px 24px 32px !important;
      max-width: min(1280px, calc(100% - 64px)) !important;
      padding: 20px 24px !important;
      border: 1px solid var(--gfd-border) !important;
      border-radius: 8px !important;
      background: var(--gfd-bg) !important;
      font: inherit;
      box-sizing: border-box !important;
      box-shadow: 0 1px 4px rgba(0,0,0,0.18) !important;
    }
    @media(max-width: 768px) {
      #${GRID_ID} {
        margin: 12px 16px !important;
        max-width: calc(100% - 32px) !important;
        padding: 14px !important;
      }
    }
    #${GRID_ID} * { box-sizing: border-box; }
    #${GRID_ID} .gfd-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin: 0 0 16px 0;
      flex-wrap: wrap;
    }
    #${GRID_ID} .gfd-title {
      font-size: 18px;
      font-weight: 600;
      line-height: 1.3;
      margin: 0;
      color: var(--gfd-fg);
    }
    #${GRID_ID} .gfd-subtitle {
      font-size: 12px;
      color: var(--gfd-muted);
      margin-top: 4px;
    }
    #${GRID_ID} .gfd-tools {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    #${GRID_ID} .gfd-search {
      min-width: 150px;
      max-width: 220px;
      border: 1px solid var(--gfd-border);
      border-radius: 6px;
      padding: 6px 10px;
      background: var(--gfd-panel);
      color: inherit;
      font: inherit;
      font-size: 12px;
    }
    #${GRID_ID} .gfd-search:focus {
      outline: none;
      border-color: #58a6ff;
    }

    /* RECOMMENDED HERO CARD: ONLY VISIBLE BY DEFAULT */
    #${GRID_ID} .gfd-hero-card {
      border: 1.5px solid #da3633;
      border-radius: 8px;
      padding: 18px 20px;
      background: var(--gfd-panel);
      margin-bottom: 14px;
      box-shadow: 0 2px 8px rgba(218,54,51,0.12);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    #${GRID_ID} .gfd-hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    #${GRID_ID} .gfd-rec-label {
      font-size: 11px;
      font-weight: 700;
      color: #f85149;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    #${GRID_ID} .gfd-rec-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #da3633;
      display: inline-block;
      box-shadow: 0 0 0 3px rgba(218,54,51,0.25);
    }

    /* Modern Compatibility Check Banner */
    #${GRID_ID} .gfd-compat-banner {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #3fb950;
      background: rgba(63,185,80,0.1);
      border: 1px solid rgba(63,185,80,0.3);
      padding: 3px 10px;
      border-radius: 99px;
      font-weight: 500;
    }
    #${GRID_ID} .gfd-compat-banner svg {
      width: 14px;
      height: 14px;
      flex: 0 0 14px;
    }
    #${GRID_ID} .gfd-compat-banner.warning {
      color: #d29922;
      background: rgba(210,153,34,0.1);
      border-color: rgba(210,153,34,0.3);
    }

    #${GRID_ID} .gfd-hero-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      flex-wrap: wrap;
    }
    #${GRID_ID} .gfd-hero-details {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      flex: 1;
      min-width: 260px;
    }
    #${GRID_ID} .gfd-hero-icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      flex: 0 0 44px;
      border-radius: 8px;
      background: var(--gfd-bg);
      border: 1px solid var(--gfd-border);
      color: var(--gfd-fg);
    }
    #${GRID_ID} .gfd-hero-icon svg { width: 24px; height: 24px; }
    #${GRID_ID} .gfd-hero-name {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.35;
      overflow-wrap: anywhere;
      color: #58a6ff;
      text-decoration: none;
    }
    #${GRID_ID} .gfd-hero-name:hover { text-decoration: underline; }
    #${GRID_ID} .gfd-hero-meta {
      display: flex;
      gap: 8px 12px;
      flex-wrap: wrap;
      color: var(--gfd-muted);
      font-size: 12px;
      margin-top: 4px;
    }

    /* THE MAIN RECOMMENDED DOWNLOAD BUTTON IS RED */
    #${GRID_ID} .gfd-btn-hero-download {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 10px 24px;
      background: #da3633 !important;
      border: 1px solid #da3633 !important;
      border-radius: 6px;
      color: #ffffff !important;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none !important;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.25);
      transition: background-color .12s ease, transform .1s ease;
      cursor: pointer;
    }
    #${GRID_ID} .gfd-btn-hero-download:hover {
      background: #b32321 !important;
      border-color: #b32321 !important;
      transform: translateY(-1px);
      color: #ffffff !important;
    }
    #${GRID_ID} .gfd-btn-hero-download:active { transform: translateY(0); }
    #${GRID_ID} .gfd-btn-hero-download svg { width: 17px; height: 17px; }

    /* SMALL GREEN SOURCE CODE BUTTONS STRIP */
    #${GRID_ID} .gfd-source-strip {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 2px 0 14px 0;
      flex-wrap: wrap;
    }
    #${GRID_ID} .gfd-source-label {
      font-size: 12px;
      color: var(--gfd-muted);
      font-weight: 500;
    }
    #${GRID_ID} .gfd-source-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 5px;
      background: #238636 !important;
      color: #ffffff !important;
      font-size: 11px;
      font-weight: 600;
      text-decoration: none !important;
      border: 1px solid #2ea043 !important;
      transition: background-color .12s ease;
      white-space: nowrap;
    }
    #${GRID_ID} .gfd-source-btn:hover {
      background: #2ea043 !important;
      color: #ffffff !important;
    }
    #${GRID_ID} .gfd-source-btn svg { width: 11px; height: 11px; }

    /* SHOW MORE: Styled like GitHub's native secondary grey button */
    #${GRID_ID} .gfd-btn-github-grey {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #21262d !important;
      border: 1px solid #30363d !important;
      border-radius: 6px;
      padding: 7px 16px;
      color: #c9d1d9 !important;
      font: 600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      cursor: pointer;
      transition: background-color .12s ease, border-color .12s ease;
      text-decoration: none !important;
    }
    #${GRID_ID} .gfd-btn-github-grey:hover {
      background: #30363d !important;
      border-color: #8b949e !important;
      color: #f0f6fc !important;
    }
    #${GRID_ID} .gfd-btn-github-grey svg {
      width: 13px;
      height: 13px;
      transition: transform .18s ease;
    }
    #${GRID_ID} .gfd-btn-github-grey[aria-expanded="true"] svg {
      transform: rotate(180deg);
    }

    /* Collapsible other assets container */
    #${GRID_ID} .gfd-other-assets-box {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed var(--gfd-border);
    }
    #${GRID_ID} .gfd-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    #${GRID_ID} .gfd-tab {
      border: 1px solid var(--gfd-border);
      border-radius: 6px;
      padding: 4px 10px;
      background: var(--gfd-panel);
      color: inherit;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
    }
    #${GRID_ID} .gfd-tab[aria-pressed="true"] {
      background: #1f6feb;
      border-color: #58a6ff;
      color: #ffffff;
      font-weight: 600;
    }
    #${GRID_ID} .gfd-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
      gap: 10px;
    }
    #${GRID_ID} .gfd-card {
      border: 1px solid var(--gfd-border);
      border-radius: 7px;
      padding: 12px 14px;
      background: var(--gfd-panel);
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 9px;
      transition: border-color .12s ease;
    }
    #${GRID_ID} .gfd-card:hover {
      border-color: #58a6ff;
    }
    #${GRID_ID} .gfd-card-top {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    #${GRID_ID} .gfd-icon {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      flex: 0 0 30px;
      border-radius: 6px;
      background: var(--gfd-bg);
      border: 1px solid var(--gfd-border);
      color: var(--gfd-fg);
    }
    #${GRID_ID} .gfd-icon svg { width: 16px; height: 16px; }
    #${GRID_ID} .gfd-file-info { min-width: 0; flex: 1; }
    #${GRID_ID} .gfd-file-name {
      display: block;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.35;
      overflow-wrap: anywhere;
      text-decoration: none;
      color: #58a6ff;
    }
    #${GRID_ID} .gfd-file-name:hover { text-decoration: underline; }
    #${GRID_ID} .gfd-meta {
      display: flex;
      gap: 6px 10px;
      flex-wrap: wrap;
      color: var(--gfd-muted);
      font-size: 11.5px;
      margin-top: 3px;
    }
    #${GRID_ID} .gfd-tag {
      border: 1px solid var(--gfd-border);
      border-radius: 99px;
      padding: 1px 6px;
      font-size: 10px;
      white-space: nowrap;
    }
    #${GRID_ID} .gfd-card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-top: auto;
    }

    /* ALL OTHER ASSET DOWNLOAD BUTTONS ARE GREY (SYNCED RED FOR RECOMMENDED, GREY FOR REST) */
    #${GRID_ID} .gfd-download-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border-radius: 6px;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none !important;
      white-space: nowrap;
      background: #21262d !important;
      border: 1px solid #30363d !important;
      color: #c9d1d9 !important;
      transition: background-color .12s ease, border-color .12s ease;
    }
    #${GRID_ID} .gfd-download-secondary:hover {
      background: #30363d !important;
      border-color: #8b949e !important;
      color: #f0f6fc !important;
    }
    #${GRID_ID} .gfd-download-secondary svg { width: 13px; height: 13px; }

    #${GRID_ID} .gfd-section { margin-top: 14px; }
    #${GRID_ID} .gfd-section-head {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 8px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--gfd-fg);
    }
    #${GRID_ID} .gfd-section-head > svg { width: 15px !important; height: 15px !important; flex: 0 0 15px; }
    #${GRID_ID} .gfd-count { color: var(--gfd-muted); font-size: 11.5px; font-weight: 400; }
    #${GRID_ID} .gfd-empty {
      padding: 14px;
      border: 1px dashed var(--gfd-border);
      border-radius: 6px;
      color: var(--gfd-muted);
      font-size: 13px;
      margin-bottom: 10px;
    }
    #${GRID_ID} .gfd-notice {
      padding: 8px 12px;
      background: var(--gfd-panel);
      border-radius: 6px;
      color: var(--gfd-muted);
      font-size: 12px;
      margin-bottom: 10px;
    }

    /* REPOSITORY HOMEPAGE DOWNLOAD BUTTON (TOOLBAR, LEFT OF CODE BUTTON) */
    #${BUTTON_ID} {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin: 0 8px 0 0;
      border-radius: 6px;
      padding: 0 13px;
      font: 600 12px/20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      white-space: nowrap;
      cursor: pointer;
      height: 32px;
      vertical-align: middle;
      flex-shrink: 0;
      box-shadow: 0 1px 0 rgba(0,0,0,0.1);
      text-decoration: none !important;
      transition: background-color .12s ease, border-color .12s ease;
    }
    /* Main active download is RED */
    #${BUTTON_ID}.gfd-state-active {
      background: #da3633 !important;
      border: 1px solid #da3633 !important;
      color: #ffffff !important;
    }
    #${BUTTON_ID}.gfd-state-active:hover {
      background: #b32321 !important;
      border-color: #b32321 !important;
      color: #ffffff !important;
    }
    /* Disabled compatibility state is neutral */
    #${BUTTON_ID}.gfd-state-disabled {
      background: #f6f8fa !important;
      border: 1px solid #d1d9e0 !important;
      color: #8b949e !important;
      cursor: not-allowed;
    }
    #${BUTTON_ID}.gfd-state-disabled:hover {
      background: #eef1f4 !important;
      border-color: #b7c0ca !important;
      color: #6e7781 !important;
    }
    #${BUTTON_ID} svg { width: 14px; height: 14px; flex: 0 0 14px; }
    #${BUTTON_ID}[disabled] { opacity: .75; cursor: wait; }
  `;

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

  /** Wrapper that handles null/missing sizes gracefully */
  function formatAssetSize(bytes) {
    return bytes == null ? t("sizeUnknown") : formatBytes(bytes);
  }

  function cleanSizeText(value) {
    if (!value) return null;
    const text = String(value).replace(/,/g, "").replace(/\s+/g, " ").trim();
    const match = text.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(B|KB|KiB|MB|MiB|GB|GiB|TB|TiB)\b/i);
    if (!match) return null;
    const num = Number(match[1]);
    const unit = match[2].toUpperCase();
    const powers = { B: 0, KB: 1, KIB: 1, MB: 2, MIB: 2, GB: 3, GIB: 3, TB: 4, TIB: 4 };
    return num * Math.pow(1024, powers[unit] ?? 0);
  }

  /**
   * Modern Client Hints & WebGL hardware detection.
   * Accurately identifies OS (Windows, macOS, Linux, Android) and hardware architecture (x64, arm64).
   */
  function detectUserOS() {
    if (cachedUserOS) return cachedUserOS;

    const ua = `${navigator.userAgent || ""} ${navigator.platform || ""}`.toLowerCase();
    let os = "other";
    let method = "User-Agent";

    // Modern Client Hints check if supported
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

    // WebGL Unmasked Renderer check for Apple Silicon / ARM distinction
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
              method = "Apple Silicon GPU";
            } else {
              arch = "x64";
            }
          }
        }
      } catch (_) {
        arch = "x64";
      }
    }

    cachedUserOS = { os, arch, method };
    return cachedUserOS;
  }

  function formatOSName(os) {
    return ({ windows: "Windows", macos: "macOS", linux: "Linux", android: "Android" })[os] || "your system";
  }

  function detectRepo(pathname = location.pathname) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0], repo = parts[1].replace(/\.git$/, "");
    const reserved = ["settings", "marketplace", "topics", "collections", "sponsors", "orgs", "login", "join", "features", "enterprise", "apps", "organizations"];
    if (reserved.includes(owner.toLowerCase())) return null;
    if (!owner || !repo || owner.startsWith("!") || repo.startsWith("!")) return null;
    return { owner, repo, key: `${owner}/${repo}` };
  }

  function isRepoRoot() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (!detectRepo()) return false;
    return parts.length === 2 || (parts.length === 4 && parts[2] === "tree");
  }

  function isReleaseRoute() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length < 3 || parts[2] !== "releases" || !detectRepo()) return false;
    const sub = parts[3];
    if (sub === "new" || sub === "edit" || sub === "download") return false;
    return true;
  }

  function getCurrentReleaseTag() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length >= 5 && parts[2] === "releases" && parts[3] === "tag") {
      return decodeURIComponent(parts.slice(4).join("/"));
    }
    return null;
  }

  function repoUrl(repo) { return `https://github.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`; }
  function releasesUrl(repo) { return `${repoUrl(repo)}/releases`; }
  function latestReleaseUrl(repo) { return `${repoUrl(repo)}/releases/latest`; }
  function tagReleaseUrl(repo, tag) { return `${repoUrl(repo)}/releases/tag/${encodeURIComponent(tag)}`; }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

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

  function assetFromDOM(anchor) {
    let rawHref = anchor.getAttribute("href") || anchor.href;
    if (!rawHref) return null;

    let fullUrl;
    try {
      fullUrl = new URL(rawHref, "https://github.com").href;
    } catch (_) {
      return null;
    }
    if (!/^https:\/\/github\.com\//i.test(fullUrl)) return null;

    const pathParts = new URL(fullUrl).pathname.split("/").filter(Boolean);
    const urlFilename = decodeURIComponent(pathParts.pop() || "");
    const cleanName = (anchor.textContent || anchor.getAttribute("aria-label") || urlFilename).replace(/\s+/g, " ").trim();
    const name = urlFilename && !cleanName.includes(urlFilename) ? cleanName : (urlFilename || cleanName);
    if (!name) return null;

    const container = anchor.closest("li, .Box-row, [data-testid='release-asset'], tr, .d-flex") || anchor.parentElement;
    const text = container?.innerText || container?.textContent || "";
    const info = parseFileInfo(name);
    if (/source code|zip source code|tar\.gz source code/i.test(name)) info.type = "source";
    const size = cleanSizeText(text);

    return {
      id: fullUrl,
      name,
      size,
      download_count: null,
      browser_download_url: fullUrl,
      ...info
    };
  }

  function findReleasePageAssets(doc = document) {
    const anchors = [...doc.querySelectorAll('a[href*="/releases/download/"], a[href*="/archive/refs/tags/"], a[href*="/archive/"]')];
    const seen = new Set();
    const assets = [];
    for (const a of anchors) {
      const asset = assetFromDOM(a);
      if (!asset || seen.has(asset.browser_download_url)) continue;
      seen.add(asset.browser_download_url);
      assets.push(asset);
    }
    return assets;
  }

  async function fetchText(url, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        credentials: "same-origin",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchJSON(url) {
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

  async function getCached(key, producer) {
    const existing = cache.get(key);
    if (existing && Date.now() - existing.time < CACHE_TTL) return existing.value;
    if (pending.has(key)) return pending.get(key);
    const promise = producer().then(value => {
      cache.set(key, { time: Date.now(), value });
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  }

  async function fetchReleaseData(repo, tag = null) {
    const cacheKey = `release:${repo.key}:${tag || "latest"}`;
    return getCached(cacheKey, async () => {
      let release = null, assets = [], warning = false;

      try {
        const apiUrl = tag
          ? `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/releases/tags/${encodeURIComponent(tag)}`
          : `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/releases/latest`;
        release = await fetchJSON(apiUrl);
        if (Array.isArray(release.assets)) {
          assets = release.assets.map(a => ({
            id: a.id,
            name: a.name,
            size: Number.isFinite(a.size) ? a.size : null,
            download_count: a.download_count ?? null,
            browser_download_url: a.browser_download_url,
            ...parseFileInfo(a.name)
          })).filter(a => a.browser_download_url && /^https:\/\/github\.com\//i.test(a.browser_download_url));
        }
      } catch (_) {
        warning = true;
      }

      if (!release || !assets.length) {
        try {
          const pageUrl = tag ? tagReleaseUrl(repo, tag) : latestReleaseUrl(repo);
          const html = await fetchText(pageUrl);
          const doc = new DOMParser().parseFromString(html, "text/html");
          const found = findReleasePageAssets(doc);
          if (found.length) {
            assets = found;
            warning = true;
            const title = doc.querySelector("h1")?.textContent?.trim() || "";
            release = release || {
              name: title.replace(/^releases?\s*/i, "") || tag || t("latest"),
              html_url: pageUrl,
              tag_name: tag || "",
              assets: found
            };
          }
        } catch (_) {
          // Handled below
        }
      }

      if (!assets.length && isReleaseRoute()) {
        assets = findReleasePageAssets(document);
        if (assets.length) warning = true;
      }

      if (!release && assets.length) {
        const pageUrl = tag ? tagReleaseUrl(repo, tag) : latestReleaseUrl(repo);
        release = { name: tag || t("latest"), html_url: pageUrl, tag_name: tag || "", assets };
      }

      return { release, assets, warning };
    });
  }

  function typeLabel(type) {
    return ({ installer: t("installers"), portable: t("portable"), cli: t("cli"), gui: t("gui"), source: t("source"), other: t("other") })[type] || t("other");
  }

  function iconForOS(os) {
    return ({ windows: ICONS.windows, macos: ICONS.apple, linux: ICONS.linux, android: ICONS.android, all: ICONS.package })[os] || ICONS.file;
  }

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

  /**
   * Render non-recommended asset cards with GREY download buttons (synchronized design)
   */
  function renderAssetCard(asset) {
    const url = asset.browser_download_url;
    const size = formatAssetSize(asset.size);
    const tags = [typeLabel(asset.type), asset.arch !== "unknown" ? asset.arch : null].filter(Boolean);

    return `<article class="gfd-card" data-gfd-name="${escapeHTML(asset.name.toLowerCase())}" data-gfd-type="${escapeHTML(asset.type)}">
      <div class="gfd-card-top">
        <span class="gfd-icon">${iconForOS(asset.os)}</span>
        <div class="gfd-file-info">
          <a class="gfd-file-name" href="${escapeHTML(url)}" title="${escapeHTML(asset.name)}">${escapeHTML(asset.name)}</a>
          <div class="gfd-meta"><span>${escapeHTML(size)}</span>${asset.download_count != null ? `<span>↓ ${Number(asset.download_count).toLocaleString()}</span>` : ""}</div>
        </div>
      </div>
      <div class="gfd-card-bottom">
        <span class="gfd-tags">${tags.map(tag => `<span class="gfd-tag">${escapeHTML(tag)}</span>`).join(" ")}</span>
        <a class="gfd-download-secondary" href="${escapeHTML(url)}">${ICONS.download}<span>${escapeHTML(t("download"))}</span></a>
      </div>
    </article>`;
  }

  function isHeaderNavElement(el) {
    if (!el) return true;
    if (el.closest('[data-component="SplitPageLayout.Header"], header, nav, .AppHeader, #repository-container-header, .js-repo-nav, ul.UnderlineNav-body')) {
      return true;
    }
    return false;
  }

  /**
   * Finds the exact container for the toolbar Download button:
   * Anchors directly to the left of the green "<> Code" dropdown button.
   */
  function findToolbarCodeTarget() {
    const codeBtn = Array.from(document.querySelectorAll('button'))
      .find(el => {
        if (isHeaderNavElement(el)) return false;
        const text = (el.textContent || '').trim();
        return text.includes('Code') || el.querySelector('svg.octicon-code');
      });

    if (!codeBtn) return null;

    // Walk up to find the main toolbar container (Box_6__yyTyGl or equivalent flex row)
    let container = codeBtn.parentElement;
    while (container && container !== document.body) {
      if (container.querySelector('input[aria-label="Go to file"]') || container.classList.toString().includes('Box_6') || container.children.length >= 2) {
        // Find the direct child of this container that wraps the code button
        let targetChild = codeBtn;
        while (targetChild && targetChild.parentElement && targetChild.parentElement !== container) {
          targetChild = targetChild.parentElement;
        }
        if (targetChild && targetChild.parentElement === container) {
          return { parent: container, before: targetChild };
        }
      }
      container = container.parentElement;
    }

    return null;
  }

  function injectDownloadButton() {
    if (!isRepoRoot()) {
      document.getElementById(BUTTON_ID)?.remove();
      return;
    }
    const repo = detectRepo();
    if (!repo) return;
    ensureStyles();

    const target = findToolbarCodeTarget();
    if (!target || !target.parent) return;

    let button = document.getElementById(BUTTON_ID);
    if (button && button.isConnected) {
      if (button.parentElement === target.parent && button.nextElementSibling === target.before) {
        if (button.dataset.evaluatedRepo !== repo.key) {
          button.dataset.evaluatedRepo = repo.key;
          updateButtonCompatibility(repo, button);
        }
        return;
      }
    }

    if (!button) {
      button = document.createElement("button");
      button.id = BUTTON_ID;
      button.type = "button";
      button.className = "gfd-state-disabled";
      button.setAttribute("aria-disabled", "true");
      button.innerHTML = `${ICONS.download}<span>${escapeHTML(t("download"))}</span>`;
      button.title = t("loading");
    }

    button.dataset.repo = repo.key;

    if (button.parentElement !== target.parent || button.nextElementSibling !== target.before) {
      target.parent.insertBefore(button, target.before);
    }

    if (button.dataset.evaluatedRepo !== repo.key) {
      button.dataset.evaluatedRepo = repo.key;
      updateButtonCompatibility(repo, button);
    }
  }

  /**
   * Locates where to inject the release grid:
   * Anchors inside the page content / release card, below the header and above notes.
   * NEVER injects at the top of the repo header or above the navbar!
   */
  function findReleaseTarget() {
    const contentArea = document.querySelector(
      '#js-repo-pjax-container .repository-content, #repo-content-pjax-container .repository-content, [data-component="SplitPageLayout.Content"] .repository-content, .repository-content'
    );
    if (!contentArea || isHeaderNavElement(contentArea)) return null;

    const cards = Array.from(contentArea.querySelectorAll(
      '[data-test-selector="release-entry"], [data-testid="release-entry"], .release, .Box--responsive, section.Box, article'
    )).filter(card => !isHeaderNavElement(card));

    for (const card of cards) {
      const markdownBody = card.querySelector('.markdown-body, [data-test-selector="body-content"], [data-testid="release-body"]');
      const heading = card.querySelector('.Box-header h1, .Box-header h2, .release-header h1, .release-header h2, h1, h2');
      if (markdownBody && heading && markdownBody.parentElement && markdownBody.parentElement !== card) {
        return { parent: markdownBody.parentElement, before: markdownBody };
      }
      if (heading) {
        const next = heading.nextElementSibling;
        if (next && next !== card.querySelector("#" + GRID_ID)) {
          return { parent: next.parentElement || card, before: next };
        }
      }
    }

    const markdownBody = contentArea.querySelector('.markdown-body, [data-test-selector="body-content"], [data-testid="release-body"]');
    const heading = contentArea.querySelector('h1, h2');
    if (markdownBody && heading && markdownBody.parentElement && heading.closest(".repository-content") === contentArea) {
      return { parent: markdownBody.parentElement, before: markdownBody };
    }
    return null;
  }

  /**
   * Builds source archive download URLs.
   * Uses refs/tags for real tags, refs/heads for branch names like "main".
   */
  function sourceArchiveUrls(repo, tag) {
    const ref = encodeURIComponent(tag);
    const isBranch = !tag || /^(main|master|develop|dev|trunk)$/i.test(tag);
    const basePath = isBranch
      ? `${repoUrl(repo)}/archive/refs/heads/${ref}`
      : `${repoUrl(repo)}/archive/refs/tags/${ref}`;
    return {
      zipUrl: `${basePath}.zip`,
      tarUrl: `${basePath}.tar.gz`
    };
  }

  function renderReleaseGrid(repo, data, routeToken) {
    if (routeToken !== renderToken || !isReleaseRoute()) return;
    ensureStyles();

    const target = findReleaseTarget();
    if (!target || !target.parent) return;

    let root = document.getElementById(GRID_ID);
    if (!root) {
      root = document.createElement("section");
      root.id = GRID_ID;
      root.setAttribute("aria-label", t("title"));
    }

    if (root.parentElement !== target.parent || root.nextElementSibling !== target.before) {
      if (target.before) {
        target.parent.insertBefore(root, target.before);
      } else {
        target.parent.appendChild(root);
      }
    }

    const { release, assets, warning } = data;
    const releaseURL = release?.html_url || (getCurrentReleaseTag() ? tagReleaseUrl(repo, getCurrentReleaseTag()) : latestReleaseUrl(repo));
    const userDevice = detectUserOS();
    const osName = formatOSName(userDevice.os);
    const archName = userDevice.arch !== "unknown" ? userDevice.arch : "64-bit";
    const recommended = getBestAsset(assets);
    const nonSourceAssets = assets.filter(a => a.type !== "source");
    const otherAssets = recommended ? nonSourceAssets.filter(a => a.id !== recommended.id) : nonSourceAssets;
    const groupedOther = groupAssets(otherAssets);

    // Source code archives: small green buttons
    const currentTag = getCurrentReleaseTag() || release?.tag_name || "main";
    const { zipUrl, tarUrl } = sourceArchiveUrls(repo, currentTag);

    const sourceButtonsHTML = `
      <div class="gfd-source-strip">
        <span class="gfd-source-label">${escapeHTML(t("sourceCode"))}:</span>
        <a class="gfd-source-btn" href="${escapeHTML(zipUrl)}" title="Download zip source archive">
          ${ICONS.code} <span>zip</span>
        </a>
        <a class="gfd-source-btn" href="${escapeHTML(tarUrl)}" title="Download tar.gz source archive">
          ${ICONS.code} <span>tar.gz</span>
        </a>
      </div>
    `;

    let contentHTML = "";

    if (assets.length === 0) {
      contentHTML = `
        <div class="gfd-empty">
          ${escapeHTML(release ? t("noAssets") : t("noRelease"))}
          <a href="${escapeHTML(releasesUrl(repo))}" style="color:#58a6ff;margin-left:6px;">${escapeHTML(t("viewReleases"))}</a>
        </div>
        ${sourceButtonsHTML}
      `;
    } else {
      let heroHTML = "";
      if (recommended) {
        const recSize = formatAssetSize(recommended.size);
        const recTags = [typeLabel(recommended.type), recommended.arch !== "unknown" ? recommended.arch : null].filter(Boolean);

        heroHTML = `
          <div class="gfd-hero-card">
            <div class="gfd-hero-top">
              <span class="gfd-rec-label">
                <span class="gfd-rec-dot"></span>
                <span>${escapeHTML(t("recommendedSystem"))}</span>
              </span>
              <span class="gfd-compat-banner">
                ${ICONS.checkShield}
                <span>${escapeHTML(t("compatVerified"))} <strong>${escapeHTML(osName)} (${escapeHTML(archName)})</strong></span>
              </span>
            </div>

            <div class="gfd-hero-main">
              <div class="gfd-hero-details">
                <span class="gfd-hero-icon">${iconForOS(recommended.os)}</span>
                <div>
                  <a class="gfd-hero-name" href="${escapeHTML(recommended.browser_download_url)}">${escapeHTML(recommended.name)}</a>
                  <div class="gfd-hero-meta">
                    <span>${escapeHTML(recSize)}</span>
                    ${recommended.download_count != null ? `<span>↓ ${Number(recommended.download_count).toLocaleString()} downloads</span>` : ""}
                    ${recTags.map(tag => `<span class="gfd-tag">${escapeHTML(tag)}</span>`).join(" ")}
                  </div>
                </div>
              </div>

              <!-- MAIN RECOMMENDED DOWNLOAD BUTTON IS RED -->
              <a class="gfd-btn-hero-download" href="${escapeHTML(recommended.browser_download_url)}">
                ${ICONS.downloadLg}
                <span>${escapeHTML(t("download"))} (${escapeHTML(recSize)})</span>
              </a>
            </div>
          </div>
        `;
      } else {
        // No compatible OS binary found in this release
        heroHTML = `
          <div class="gfd-empty" style="border-color:#d29922;background:rgba(210,153,34,0.06);color:#e3b341;">
            <div style="display:flex;align-items:center;gap:8px;font-weight:600;margin-bottom:4px;">
              ${ICONS.alertTriangle}
              <span>${escapeHTML(t("compatUnavailable"))} (${escapeHTML(osName)} ${escapeHTML(archName)})</span>
            </div>
            <div style="font-size:12px;color:var(--gfd-muted);">You can inspect all available assets below or download the source code archive.</div>
          </div>
        `;
      }

      // Grouped non-recommended assets (all download buttons are grey)
      const otherMarkup = groupedOther.map(group => `
        <section class="gfd-section" data-gfd-section="${escapeHTML(group.key)}">
          <h3 class="gfd-section-head">
            ${iconForOS(group.key)} ${escapeHTML(group.title)} <span class="gfd-count">(${group.assets.length})</span>
          </h3>
          <div class="gfd-grid">
            ${group.assets.map(a => renderAssetCard(a)).join("")}
          </div>
        </section>
      `).join("");

      // GitHub-styled native grey button for Show all assets (collapsed by default)
      const moreToggleHTML = otherAssets.length > 0 ? `
        <button class="gfd-btn-github-grey" id="gfd-toggle-more-btn" type="button" aria-expanded="false">
          <span>${escapeHTML(t("showMore"))} (${otherAssets.length} more)</span>
          ${ICONS.chevronDown}
        </button>
        <div class="gfd-other-assets-box" id="gfd-other-assets-box" style="display: none;">
          <div class="gfd-tabs" role="group" aria-label="${escapeHTML(t("title"))}">
            <button class="gfd-tab" type="button" data-gfd-filter="all" aria-pressed="true">${escapeHTML(t("all"))} (${otherAssets.length})</button>
            ${["installer", "portable", "cli", "gui"].map(type => {
              const count = otherAssets.filter(a => a.type === type).length;
              return count ? `<button class="gfd-tab" type="button" data-gfd-filter="${type}" aria-pressed="false">${escapeHTML(typeLabel(type))} (${count})</button>` : "";
            }).join("")}
          </div>
          <div class="gfd-assets-list">${otherMarkup}</div>
        </div>
      ` : "";

      contentHTML = `
        ${heroHTML}
        ${sourceButtonsHTML}
        ${moreToggleHTML}
        <p class="gfd-subtitle" style="margin-top:16px;"><a href="${escapeHTML(releaseURL)}" style="color:#58a6ff;">${escapeHTML(t("viewRelease"))}</a></p>
      `;
    }

    root.innerHTML = `
      <div class="gfd-head">
        <div>
          <h2 class="gfd-title">${escapeHTML(t("title"))}</h2>
          <div class="gfd-subtitle">${escapeHTML(release?.name || t("latest"))} · ${assets.length} ${escapeHTML(t("assetsCount"))}</div>
        </div>
        <div class="gfd-tools">
          <input class="gfd-search" type="search" aria-label="${escapeHTML(t("search"))}" placeholder="${escapeHTML(t("search"))}">
        </div>
      </div>
      ${warning ? `<div class="gfd-notice">${escapeHTML(t("apiFallback"))}</div>` : ""}
      ${contentHTML}
    `;

    // Hook up "Show all assets" toggle
    const toggleBtn = root.querySelector("#gfd-toggle-more-btn");
    const otherBox = root.querySelector("#gfd-other-assets-box");
    if (toggleBtn && otherBox) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = otherBox.style.display === "none";
        otherBox.style.display = isHidden ? "block" : "none";
        toggleBtn.setAttribute("aria-expanded", String(isHidden));
        const labelSpan = toggleBtn.querySelector("span");
        if (labelSpan) {
          labelSpan.textContent = isHidden
            ? t("showFewer")
            : `${t("showMore")} (${otherAssets.length} more)`;
        }
      });
    }

    // Filter and search inside the expanded assets area
    const search = root.querySelector(".gfd-search");
    const filterButtons = [...root.querySelectorAll("[data-gfd-filter]")];
    const applyFilter = () => {
      const active = root.querySelector('[data-gfd-filter][aria-pressed="true"]')?.dataset.gfdFilter || "all";
      const query = (search?.value || "").trim().toLowerCase();

      if (query && otherBox && otherBox.style.display === "none") {
        otherBox.style.display = "block";
        if (toggleBtn) {
          toggleBtn.setAttribute("aria-expanded", "true");
          const labelSpan = toggleBtn.querySelector("span");
          if (labelSpan) labelSpan.textContent = t("showFewer");
        }
      }

      root.querySelectorAll(".gfd-card").forEach(card => {
        const matchesType = active === "all" || card.dataset.gfdType === active;
        const matchesText = !query || card.dataset.gfdName.includes(query);
        card.hidden = !(matchesType && matchesText);
      });
      root.querySelectorAll(".gfd-section").forEach(section => {
        const visibleCards = [...section.querySelectorAll(".gfd-card")].some(card => !card.hidden);
        section.hidden = !visibleCards;
      });
    };

    filterButtons.forEach(button => button.addEventListener("click", () => {
      filterButtons.forEach(b => b.setAttribute("aria-pressed", String(b === button)));
      applyFilter();
    }));

    search?.addEventListener("input", applyFilter);
  }

  async function transformReleasePage() {
    const repo = detectRepo();
    if (!repo || !isReleaseRoute() || isUpdatingDOM) return;
    isUpdatingDOM = true;
    const token = ++renderToken;
    ensureStyles();

    try {
      const tag = getCurrentReleaseTag();
      const data = await fetchReleaseData(repo, tag);
      if (token !== renderToken || !isReleaseRoute()) return;
      renderReleaseGrid(repo, data, token);
    } catch (_) {
      // Clean fallback
    } finally {
      isUpdatingDOM = false;
    }
  }

  function assetsCount(data) {
    return Array.isArray(data?.assets) ? data.assets.length : 0;
  }

  async function updateButtonCompatibility(repo, button) {
    const userDevice = detectUserOS();
    const osFormatted = formatOSName(userDevice.os);
    const archFormatted = userDevice.arch !== "unknown" ? userDevice.arch : "64-bit";

    try {
      const data = await fetchReleaseData(repo);

      if (!data.release && assetsCount(data) === 0) {
        button.className = "gfd-state-disabled";
        button.setAttribute("aria-disabled", "true");
        button.title = t("noRelease");
        button.innerHTML = `${ICONS.slash}<span>${escapeHTML(t("download"))}</span>`;
        button.onclick = () => { window.location.assign(releasesUrl(repo)); };
        return;
      }

      const bestAsset = getBestAsset(data.assets || []);
      if (bestAsset && bestAsset.browser_download_url) {
        const assetSize = formatAssetSize(bestAsset.size);
        button.className = "gfd-state-active";
        button.setAttribute("aria-disabled", "false");
        button.title = `Download ${bestAsset.name} (${assetSize}) for ${osFormatted} ${archFormatted}`;
        button.innerHTML = `${ICONS.download}<span>${escapeHTML(t("download"))}</span>`;
        button.onclick = () => {
          const a = document.createElement("a");
          a.href = bestAsset.browser_download_url;
          a.download = bestAsset.name || "";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          a.remove();
        };
        return;
      }

      // No compatible OS release exists
      button.className = "gfd-state-disabled";
      button.setAttribute("aria-disabled", "true");
      button.title = `${t("noCompatibleOS")} (${osFormatted}${userDevice.arch !== "unknown" ? ` ${archFormatted}` : ""})`;
      button.innerHTML = `${ICONS.slash}<span>${escapeHTML(t("download"))}</span>`;
      button.onclick = () => {
        const target = data.release?.html_url || releasesUrl(repo);
        window.location.assign(target);
      };
    } catch (_) {
      button.className = "gfd-state-disabled";
      button.setAttribute("aria-disabled", "true");
      button.title = t("error");
      button.innerHTML = `${ICONS.slash}<span>${escapeHTML(t("download"))}</span>`;
      button.onclick = () => { window.location.assign(releasesUrl(repo)); };
    }
  }

  function evaluateRoute() {
    const routeKey = `${location.pathname}${location.search}`;
    if (routeKey !== lastRouteKey) {
      lastRouteKey = routeKey;
      renderToken++;
      isUpdatingDOM = false;
      document.getElementById(GRID_ID)?.remove();
    }
    if (isRepoRoot()) injectDownloadButton();
    else document.getElementById(BUTTON_ID)?.remove();

    if (isReleaseRoute()) {
      if (!document.getElementById(GRID_ID)) transformReleasePage();
    } else {
      document.getElementById(GRID_ID)?.remove();
    }
  }

  /**
   * RequestAnimationFrame debounce prevents thrashing during Turbo / pjax file tree navigation.
   */
  function scheduleEvaluate() {
    if (rafScheduleId !== null) return;
    rafScheduleId = requestAnimationFrame(() => {
      rafScheduleId = null;
      evaluateRoute();
    });
  }

  /**
   * Ultra-Efficient MutationObserver:
   * 1. Filters out mutations originating from self-injected extension nodes.
   * 2. Ignores tooltips, popovers, hovercards, progress bar mutations.
   * 3. Scopes observation to the repository content frame instead of entire document body whenever possible.
   * 4. Idempotently guards against re-attaching or re-evaluating when elements are already settled.
   */
  function startObserver() {
    if (observer) return;

    observer = new MutationObserver(mutations => {
      if (isUpdatingDOM) return;

      let isRelevant = false;
      for (const m of mutations) {
        const target = m.target?.nodeType === Node.ELEMENT_NODE ? m.target : m.target?.parentElement;
        if (target?.closest?.(`#${GRID_ID}, #${BUTTON_ID}, #${STYLE_ID}`)) continue;

        // Ignore hovercards, tooltips, and progress bars
        if (target?.closest?.('.Popover, [data-component="Tooltip"], tool-tip, .turbo-progress-bar, .sentinel')) continue;

        const isSelf = n => n?.id === GRID_ID || n?.id === BUTTON_ID || n?.id === STYLE_ID;
        const allSelf = [...m.addedNodes, ...m.removedNodes].every(isSelf);
        if (!allSelf || (m.addedNodes.length === 0 && m.removedNodes.length === 0)) {
          isRelevant = true;
          break;
        }
      }

      if (isRelevant) scheduleEvaluate();
    });

    const targetNode = document.querySelector(
      '#repo-content-turbo-frame, [data-turbo-frame="repo-content-turbo-frame"], #repo-content-pjax-container, main'
    ) || document.body;

    observer.observe(targetNode, { childList: true, subtree: true });

    // GitHub Turbo & PJAX navigation lifecycle hooks
    window.addEventListener("turbo:load", scheduleEvaluate);
    window.addEventListener("turbo:render", scheduleEvaluate);
    window.addEventListener("turbo:visit", scheduleEvaluate);
    window.addEventListener("pjax:end", scheduleEvaluate);
    window.addEventListener("popstate", scheduleEvaluate);
    document.addEventListener("turbo:render", scheduleEvaluate);

    scheduleEvaluate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }
})();
