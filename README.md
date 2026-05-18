# UID.ONE Sovereign Identity Extension

UID.ONE Sovereign Identity Extension is an enterprise-grade security extension designed to eliminate the need for traditional passwords and provide Zero-Trust Digital Signatures. By seamlessly integrating WebAuthn, Passkey technology, and PKCS#7 cryptography, it provides a secure, 1-click passwordless authentication and document signing experience.

## ✨ Key Features

- **Multi-Tenant Vault**: Granular credential isolation (`vault_${domain}_${username}`) guarantees zero cross-user data leakage on shared computers.
- **Universal Injection**: Detects and upgrades standard password inputs (`<input type="password">`) to support biometric logins (TouchID/Windows Hello) via the WebAuthn API.
- **Zero-Trust Digital Signatures**: Intercepts PDF documents in the browser, calculates SHA-256 hashes locally, and injects PKCS#7 signature blocks authorized by the mobile app—without ever uploading the document to a server.
- **Zero-Trust Anonymous Flow (QR Code)**: The extension acts as a lightweight, dumb terminal. It requires **NO LOGIN** and stores **NO TOKENS**. All authentication is handled out-of-band via a secure QR code or Push Notification.
- **Mobile App Requirement**: To use this extension, you **MUST** have the UID.ONE mobile app installed on your smartphone and an active account. Authentication is authorized solely by scanning the extension's QR code or verifying the Matching Number on your phone.
- **Native SDK Detection**: Smartly avoids double-injection (UI conflicts) by detecting the `<meta name="uid-passkey-native" content="true">` tag broadcasted by the `@oneuid-auth-js/core` SDK.
- **Absolute Privacy**: Zero telemetry. Passkeys are encrypted (AES-GCM 256-bit) and stored entirely locally.

---

## 🛠️ Build Instructions

To build the extension from source, you will need Node.js (v18 or higher) and `npm`.

1. Clone the repository:
   ```bash
   git clone git@github.com:oneuid/uid-extension.git
   cd uid-extension
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Compile the source code:
   ```bash
   npm run build
   ```

Upon a successful build, a `dist/` directory will be created containing the compiled extension files ready for installation.

---

## 🚀 Manual Installation Guide

If you wish to test the extension locally without downloading it from the Web Store, follow these steps to load it manually into your browser.

### 🌐 Google Chrome, Brave, & Edge
1. Build the extension using the instructions above to generate the `dist/` folder.
2. Open your Chromium-based browser and navigate to the Extensions page: `chrome://extensions/` (or `edge://extensions/`).
3. Toggle the **Developer mode** switch in the top right corner to ON.
4. Click the **Load unpacked** button in the top left.
5. In the file dialog, select the `dist/` folder located inside the `uid-extension` directory.
6. The extension is now installed! You should see the UID.ONE Passkey Wrapper icon in your extensions list.

### 🦊 Mozilla Firefox
> **⚠️ CRITICAL:** Firefox loads unpacked extensions differently than Chrome. You MUST select the `manifest.json` file, NOT the directory.

1. Build the extension using the instructions above to generate the `dist/` folder.
2. Open Firefox and type `about:debugging#/runtime/this-firefox` into the URL bar and press Enter.
3. Click the **Load Temporary Add-on...** button.
4. Navigate into your `uid-extension/dist/` directory and double-click the **`manifest.json`** file.
5. The extension will immediately load and appear under the "Temporary Extensions" list.

*(Note: In Firefox, temporary add-ons are removed when you restart the browser. You will need to repeat this step each time you restart Firefox for development).*

---

## 📄 License & Privacy
**All Rights Reserved - UID.ONE**

This extension stores all cryptographic data and credentials locally on your device. We do not collect, transmit, or share any personal information, telemetry, or passwords with any third-party servers.
