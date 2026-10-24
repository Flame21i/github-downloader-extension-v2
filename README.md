# 📥 GitHub Downloader v2

A lightweight, high-performance browser extension (Manifest V3) that optimizes the asset acquisition workflow on GitHub repository and release pages.

---

### 📸 Interface Previews

<img width="1024" height="576" alt="image" src="https://github.com/user-attachments/assets/901dfc14-10a2-45e4-a8aa-156d1d2f3c2f" />

---

# 🛠️ Quick Installation

1. ### Download & Extract the repository 
2. ### [Watch manual installation tutorial](https://www.youtube.com/watch?v=oswjtLwCUqg)
3. Load the unpacked extension:
   - **Chrome / Edge**: `chrome://extensions` → enable **Developer mode** → **Load unpacked**.
   - **Firefox**: `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → select `manifest.json`.

---

### ⚙️ Core Mechanics

- **🖱️ Extension Popup UI**
  Click the toolbar icon to open a compact popup that mirrors the in-page experience, detecting the active GitHub tab and surfacing the recommended download.

- **🔀 Main page download button**
  Adds a native-looking download button directly to the left of the primary green "Code" dropdown on the repository root directory view.

- **📦 Release Page Asset Grid**
  Injects a structured panel on `/releases` pages, grouping assets by platform and type. The recommended asset for your machine is highlighted with a red hero card.

- **💻 Deterministic OS Detection**
  Queries system properties to detect the active Operating System (Windows, macOS, Linux, Android) and runtime execution architecture (x64, ARM64, Universal), using Client Hints and a WebGL fallback for Apple Silicon.

- **🔍 Regex-Driven Architecture Classification**
  Evaluates asset strings dynamically using string pattern matching arrays to isolate and group distinct distribution channels (Installers, Portables, CLI execution units, GUIs, or raw source archives).

- **🛡️ Zero-API Fault Recovery Architecture**
  Maintains an internal memory cache layout to preserve rate limits. If the public GitHub API hits a 403 throttling threshold, the extension automatically transitions to reading the raw page DOM layout to fetch target link parameters.

- **🔒 Sandboxed API Proxy**
  All GitHub API calls are routed through the background worker, which strictly validates requests against a whitelist before fetching.
