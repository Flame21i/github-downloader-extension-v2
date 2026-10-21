# Contributing to GitHub Downloader v2

First off, thank you for considering contributing to **GitHub Downloader v2**! It's contributions like yours that make this utility better for the entire developer community.

Please take a moment to review the following guidelines before getting started.

---

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and collaborative environment for everyone. Please keep discussions constructive and focused on improving the extension.

---

## 🚀 How Can You Contribute?

### 1. Reporting Bugs
Before opening a new issue, please check existing issues to ensure the bug hasn't already been reported. 

When creating a bug report, include as much context as possible:
- **Browser & Version:** (e.g., Chrome v124, Edge v122)
- **Target URL:** Link to the GitHub repository or release page where the issue occurred.
- **Expected vs. Actual Behavior:** A clear description of what should happen versus what actually happened.
- **Screenshots / Console Logs:** If applicable, attach developer tools console outputs or screenshot previews.

### 2. Suggesting Enhancements
Have an idea to make GitHub Downloader v2 faster, cleaner, or more functional? We'd love to hear it!
- Open a feature request under **Issues**.
- Explain **why** this feature would be useful to other users.
- Provide examples or mockups if relevant.

## 3. Contributing Code

When writing or modifying code for **GitHub Downloader v2**, please adhere to the following technical standards:

### 1. Architecture & Tech Stack
- **Manifest V3:** Ensure all background scripts, service workers, and extension APIs comply with modern Manifest V3 standards (avoid legacy background pages).
- **DOM Selectors:** Since GitHub frequently updates its UI classes, write resilient DOM queries. Utilize robust fallbacks or class-agnostic selectors where possible to prevent breakage during GitHub frontend updates.
- **Bi-Directional Support:** If you are adding UI components or modifying layouts, ensure they remain compatible with both English (LTR) and Hebrew (RTL) localization dictionaries.

### 2. Code Style & Linting
- Keep code clean, modular, and well-commented—especially complex regular expressions used for asset architecture classification or DOM scraping fallbacks.
- Follow standard JavaScript/ES6+ best practices.
- Avoid adding unnecessary external dependencies or heavy libraries; keep the extension lightweight and high-performance.

### 3. Testing Your Code Changes
Before submitting your code via a pull request, test your changes against:
- **Repository Homepages:** Verify that the shortcut button injects correctly next to the green "Code" dropdown without shifting native elements.
- **Release Pages:** Test hardware profiling and OS/architecture detection modules across different asset types (installers, portables, source archives).
- **API Failure States:** Simulate a 403 API rate-limit throttling scenario to ensure the zero-API DOM fallback logic triggers smoothly.

---

## 🛠️ Local Development Setup

To run and test the browser extension locally:

1. **Fork & Clone the Repository**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/github-downloader-extension-v2.git](https://github.com/YOUR_USERNAME/github-downloader-extension-v2.git)
   cd github-downloader-extension-v2
