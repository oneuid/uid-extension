# UID Link - Security & Identity (Browser Extension)

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: Proprietary Source-Available](https://img.shields.io/badge/License-Source--Available-red.svg?style=flat-square)](LICENSE)

**UID Link - Security & Identity** is a high-performance cross-browser extension designed for the **UID.ONE** Sovereign Identity Ecosystem. It acts as the browser-layer security agent, enforcing Zero-Trust policies, context-aware DLP (Data Loss Prevention), and real-time cryptographic session binding directly on the client side.

For detailed architectural specifications and ecosystem details, please visit the official website: [uid.one](https://uid.one).

---

## 🤝 The Perfect Duo: UID Link & UID Agent

To achieve the highest level of security and client-side trust, **UID Link** (Browser Extension) and [**UID Agent**](https://github.com/oneuid/uid-agent) (Desktop App & Daemon) are engineered to work in tandem.

| Component | Layer | Core Security Responsibilities |
| :--- | :--- | :--- |
| **UID Link (Browser Extension)** | Web & Session | Real-time session lock, anti-phishing shield, browser-layer DLP, anti-tracking cookie guards, webmail/PDF cryptographic signing triggers. |
| **[UID Agent](https://github.com/oneuid/uid-agent) (Desktop App)** | Hardware & OS | Continuous endpoint integrity monitoring (SOC 2), PKCS#11 hardware keys (USB tokens), containerized app sandboxes (Docker + Wine). |

### 🚀 Unified Workflow Synergy
1. **Hardware-Backed Cryptographic Signing:** When signing a document or text in the browser using UID Link, it communicates with the local **UID Agent** daemon over secure native ports to access your plugged-in USB security tokens (PKCS#11/smartcards), executing the signing process directly on-device without exposing private keys.
2. **Device Attestation & Session Integrity:** UID Link actively checks that a trusted **UID Agent** is running on the host machine. The agent synchronizes authorization states and verifies that the device meets enterprise security compliance (disk encryption, firewall status) before enabling access.

👉 **Get UID Agent:** Check out the [UID Agent Setup Guide](https://github.com/oneuid/uid-agent) (or `../uid-agent/README.md` if cloned locally side-by-side) to build and install the desktop dashboard for Linux, macOS, or Windows.

---

## 🛡 Security Engine Features

### 1. Cryptographic Session Binding
Prevents session hijacking and token theft. Upon authentication, UID Link locks down the session by:
- Generating a local browser environment fingerprint (derived from user-agent, language, screen metrics, timezone, and hardware concurrency).
- Creating an HMAC-bound signature for the active `sessionToken`.
- Registering the binding securely with the backend API `/v1/auth/session-binding/register/`.
- Verifying the signature locally before allowing privileged requests.

### 2. Origin Verification (Anti-Phishing Shield)
Actively checks visited domains to detect spoofing, typosquatting, and phishing attempts targeted at the UID.one brand:
- Matches against regex patterns targeting domain variations like `uid-one-login.com`, `uidone-secure.com`, and `uid.one.evil.com`.
- Automatically injects an authoritative red blocking banner if a malicious mimic page is detected, warning users against entering credentials.

#### 3. Opt-In Browser-Layer Data Loss Prevention (DLP)
All intrusive shields are **off by default** and controlled individually from the extension popup on user-enabled sites:
- **DLP Input and Paste Shield (`settings_otp_shield`):** When enabled, inspects form submissions, text uploads, and critical-risk pastes client-side before submission.
- **Presentation Mode:** Toggle on demand via `Alt+Shift+P` to mask sensitive patterns across the active page. Hovering reveals text temporarily.
- **Clipboard Audit Metadata (`settings_clipboard_audit`):** Disabled by default. When explicitly enabled, logs only the detected pattern type, match count, length, and block status — never raw clipboard text or secret substrings.

### 4. Opt-In Tracking Cookie Guard
Disabled by default (`settings_cookie_guard`). When enabled on non-UID.one sites, sweeps known third-party analytics cookie prefixes (`_ga`, `_gid`, `_gat`, `_fbp`, `_fbc`, `_uetsid`, `_uetvid`, `_tt_enable_cookie`) without deleting cookie-consent preference cookies.

### 5. Opt-In JPEG EXIF Stripper
Disabled by default (`settings_exif_stripper`). When enabled, strips JPEG `APP1` EXIF metadata (GPS, camera model, timestamp) client-side before upload.

### 6. Opt-In Tab-Switch Blur (`UID.one`)
Disabled by default (`settings_screen_shield`). When enabled, blurs `uid.one` tabs only when `document.hidden` is true, without blocking printing, DevTools, or browser context menus.

### 7. Digital Document and Email Signing
- **PDF Signer (`signer.html`):** Supports UID.one cryptographic challenge signing, local PKCS#12 (`.p12` / `.pfx`) certificates, and an optional user-configured **HTTPS-only** local PKCS#11 USB token agent endpoint. Fails closed if a signature, certificate, or agent is unavailable.
- **Verified Email and Signature Modal:** Signs selected email content using RSA-SHA256 challenges approved on your UID.one authenticator and verifies incoming signatures against UID.one JWKS public keys.

### 8. Multi-Language i18n Localization
Localized across **14 canonical locales** (`ar`, `de`, `en`, `es`, `fr`, `it`, `ja`, `ko`, `pt`, `ru`, `th`, `vi`, `zh_CN`, `zh_TW`) with full RTL support for Arabic.

### 9. Minimal MV3 Permissions Justification
- `storage`: Stores user shield toggles, user-enabled HTTPS site allowlists, and `chrome.storage.session` (`TRUSTED_CONTEXTS`) session tokens.
- `contextMenus`: Adds right-click signing actions (`Sign text with UID.one`, `Sign PDF with UID.one`).
- `activeTab` & `scripting`: Injects signing or vault-fill scripts strictly on user-enabled HTTPS sites or on demand when the user clicks a context-menu action.
- `notifications`: Displays signing results and phishing warnings.
- `declarativeNetRequest`: Attaches the `X-UID-Session-Binding` header exclusively to `https://*.uid.one/*` requests.
- `host_permissions` (`https://uid.one/*`, `https://*.uid.one/*`) & `optional_host_permissions` (`https://*/*`): Default host access is limited to HTTPS `uid.one` origins; third-party HTTPS origins require explicit per-site opt-in in the popup.

---

## 🛠 Prerequisites

- **Node.js** (18+)
- **pnpm**, **yarn**, or **npm**

---

## 🚀 How to Install

Choose one of the two methods below to install the extension:

### Option 1: Install Prebuilt (Recommended & Simplest)
1. Download **`uid-link-chrome.zip`** (for Chrome, Edge, Brave) or **`uid-link-firefox.zip`** (for Firefox) from the [GitHub Releases](https://github.com/oneuid/uid-extension/releases) page.
2. Extract the downloaded zip file into a folder on your computer.
3. Open your browser and navigate to `chrome://extensions/` (or `about:debugging` in Firefox).
4. Turn on **"Developer mode"** in the top-right corner.
5. Click **"Load unpacked"** and select the extracted folder.

---

### Option 2: Clone & Build from Source
1. Clone this repository to your computer:
   ```bash
   git clone https://github.com/oneuid/uid-extension.git
   cd uid-extension
   ```
2. Install dependencies and compile:
   ```bash
   pnpm install
   pnpm run build
   ```
3. Open `chrome://extensions/`, turn on **"Developer mode"**, click **"Load unpacked"** and select the compiled **`dist/chrome/`** folder.

---

### Option 3: Package for Apple Safari (macOS/iOS)
Since Apple Safari Web Extensions must be wrapped inside a native macOS/iOS app container, packaging requires Xcode command-line tools (available only on macOS):

1. **Build the extension source**:
   ```bash
   pnpm install
   pnpm run build
   ```
   This compiles the extension files into the standard Manifest V3 compliant `dist/chrome/` folder.

2. **Convert to Safari Extension**:
   On a macOS machine, run Apple's official conversion tool:
   ```bash
   xcrun safari-web-extension-converter dist/chrome --project-type macos
   ```
   *(Replace `--project-type macos` with `ios` if you want to build for iPhone/iPad).*

3. **Run and Enable in Safari**:
   - Open the generated project in Xcode.
   - Select your signing team under Xcode settings.
   - Build and run the project (this registers the extension with the system).
   - Open **Safari** -> **Settings** -> **Advanced**, check **"Show features for web developers"** (or **"Show Develop menu in menu bar"** depending on macOS version).
   - In Safari's menu bar, click **Develop** -> check **"Allow Unsigned Extensions"**.
   - Go to **Safari** -> **Settings** -> **Extensions** and check the box next to **UID Link**.

---

## 📸 Screenshots

- Popup interface: [`public/screenshots/popup.png`](public/screenshots/popup.png)
- PDF digital signer: [`public/screenshots/pdf_signer.png`](public/screenshots/pdf_signer.png)

---

## 📂 Native Messaging Configuration

To verify Native Messaging features (such as secure hardware checks or OS integration), ensure that the native messaging host manifest is installed inside the corresponding system directory depending on your OS.

- **Linux:** `~/.config/google-chrome/NativeMessagingHosts/`
- **macOS:** `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
- **Windows:** Registry key `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\`

---

## 📄 License

This project is licensed under the [UID.ONE Source-Available License](LICENSE). 

By making our source code visible, we ensure complete transparency in how your web sessions and DLP policies are enforced. Under this license:
- You may audit and run the software locally for personal security verification.
- Third-party commercial redistribution, publishing to extensions stores, and commercial forks are strictly prohibited.
- Authorized B2B customers of UID.ONE are fully permitted to use the software in daily business operations.