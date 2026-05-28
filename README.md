# UID Link (Browser Extension)

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

**UID Link** is a high-performance cross-browser extension designed for the **UID.ONE** Sovereign Identity Ecosystem. It acts as the browser-layer security agent, enforcing Zero-Trust policies, context-aware DLP (Data Loss Prevention), and real-time cryptographic session binding directly on the client side.

For detailed architectural specifications, please see the [UID 7-Layer Architecture](../uid-web/docs/uid-architecture-7-layers.md).

---

## 🛡 Security Engine Features

### 1. Cryptographic Session Binding
Prevents session hijacking and token theft. Upon authentication, UID Link locks down the session by:
- Generating a local hardware device fingerprint.
- Creating an HMAC-bound signature for the active `sessionToken`.
- Registering the binding securely with the backend API `/v1/auth/session-binding/register/`.
- Verifying the signature locally before allowing privileged requests.

### 2. Origin Verification (Anti-Phishing Shield)
Actively checks visited domains to detect spoofing, typosquatting, and phishing attempts targeted at the UID.one brand:
- Matches against regex patterns targeting domain variations like `uid-one-login.com`, `uidone-secure.com`, and `uid.one.evil.com`.
- Automatically injects an authoritative red blocking banner if a malicious mimic page is detected, warning users against entering credentials.

### 3. Browser-Layer Data Loss Prevention (DLP)
Inspects client-side actions to prevent inadvertent leaks of PII, credentials, or sensitive documents:
- **File Upload Interceptor:** Listens for `input[type="file"]` change events and drag & drop drops. Files are analyzed client-side, blocking unsafe files and displaying a warning overlay.
- **Clipboard Interceptor:** Intercepts `paste` and `copy` events. Unsafe clipboard pastes are stopped with confirmation modals, while sensitive copies trigger native browser warning notifications.
- **Form Interceptor:** Scans outbound `<form>` submissions for compliance before payloads leave the browser context.

### 4. Cookie Guard & Anti-Tracking
Protects user privacy even when clicking "Accept All" on popular cookie consent banners:
- Intercepts writes to `document.cookie` in the page context, suppressing registration of tracking/advertising cookies (e.g., `_ga`, `_gid`, `_fbp`, `_fbc`, `hj*`, `cluid`).
- Detects and blocks cookies containing sensitive PII values (like raw email addresses, Credit Card numbers, JWTs, and API Keys).
- Performs periodic sweeps (every 5 seconds) to clean up tracking cookies set via HTTP response headers.

### 5. Dynamic EXIF & Metadata Stripper
Automatically strips privacy-leaking metadata from images on the fly:
- Intercepts image uploads (JPEG/JPG) via file inputs and drag-and-drop events.
- Client-side strips GPS coordinates, camera model, and creation timestamp headers (`APP1` segment) before reconstruction and submission.

### 6. Self-Destructing OTP / Input Cache Wiping
Prevents sensitive inputs and code leakage in shared or compromised environments:
- Detects OTP, 2FA codes, password, and credit card fields during standard or AJAX-based form submissions.
- Automatically wipes values from inputs and clears browser autocomplete history 300ms after submission.
- Wipes clipboard content immediately if it contains highly sensitive PII values.

### 7. Global Privacy Control (GPC) & DNT Enforcer
Asserts the user's sovereign right to privacy across all web interactions:
- Injects standard privacy signals (`navigator.globalPrivacyControl = true` and `navigator.doNotTrack = '1'`) into the global window context of all web pages.

### 8. Viewport Cleaner & Blocker Shield
- **Notification Blocker:** Intercepts service worker registration and notification permissions to block annoying third-party push notifications.
- **Viewport Cleaner:** Sweeps and hides suspicious floating elements, overlays, and potential keyloggers on secure pages to protect input fields.

---

## 🛠 Prerequisites

- **Node.js** (18+)
- **pnpm**, **yarn**, or **npm**

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Extension
```bash
npm run build
```
This compiles TypeScript files and bundles static resources into the `dist/` directory.

### 3. Load into Chromium Browsers (Chrome / Edge / Brave)
1. Navigate to `chrome://extensions/` (or `edge://extensions/`).
2. Toggle on **"Developer mode"** in the top right corner.
3. Click the **"Load unpacked"** button.
4. Select the compiled `dist/` folder in the root of the project.

---

## 📂 Native Messaging Configuration

To verify Native Messaging features (such as secure hardware checks or OS integration), ensure that the native messaging host manifest is installed inside the corresponding system directory depending on your OS.

- **Linux:** `~/.config/google-chrome/NativeMessagingHosts/`
- **macOS:** `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
- **Windows:** Registry key `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\`

---

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE). 

By open-sourcing our browser extension, we ensure complete transparency in how your web sessions and DLP policies are enforced. We welcome community audits and contributions.