
GitHub Downloader v2

GitHub Downloader v2 is a lightweight, pure Vanilla JavaScript browser extension (Manifest V3) that streamlines GitHub's asset delivery interface. Instead of forcing users to scroll through a long list of distribution files, this extension automatically detects the user's Operating System (OS) and CPU architecture to present the correct binary package instantly.

Key Features

• 1-Click Repo Homepage Button: Injects a native-looking download shortcut directly to the left of the green "Code" dropdown button on any codebase landing page.
• Smart System Diagnostics: Automatically identifies platform contexts (Windows, macOS, Linux, Android) and build architectures (x64, ARM64, Universal).
• Smart Architecture Mapping: Evaluates assets using regex arrays to instantly flag installation categories such as Installers, Portables, CLI tools, GUIs, or source archives.
• Zero-API Web Scraper Fallback Engine: Features an embedded memory-mapped cache mechanism that gracefully bypasses GitHub’s strict 60-call hourly API rate limits. If the API limits are hit, it falls back to raw DOM processing automatically.
• Fully I18N Native Localization: Implements complete structural text strings supporting native English (LTR) and Hebrew (RTL) directional styles.

How to Install It Unpacked (Developer Mode)

Because this project is community-driven and free of telemetry, tracking, or registration fees, it is distributed as an unpacked development folder.
Follow these steps to get it running on your web browser:

Step 1: Secure Your Extension Workspace

Ensure your local project directory contains your matching code components:
• manifest.json (The configuration schema)
• content.js (The Vanilla script array provided above)
• Optional: Image icon layers (icon16.png, icon48.png, icon128.png)

Step 2: Open Chrome's Extension Management Console

1. Launch Google Chrome (or any Chromium-based browser like Microsoft Edge, Brave, or Opera).
2. Type or paste chrome://extensions/ directly into your browser's URL address bar and press Enter.

Step 3: Toggle Extension Developer Authorization

1. Locate the "Developer mode" toggle switch in the top-right corner of the Extensions dashboard page.
2. Click the switch to toggle it ON. This unhides the structural developer testing interface tools.

Step 4: Mount Your Workspace Directory

1. Click the "Load unpacked" action button that appears in the top-left section of the dashboard navigation header.
2. In the file explorer pop-up window that appears, navigate to and select your main project folder containing your configuration and script files. Click Select Folder or Open.
