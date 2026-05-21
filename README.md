# UID Link (Browser Extension)

A cross-browser extension providing Identity-Aware Session Binding, Browser-layer DLP, and phishing prevention for the UID.one ecosystem.

For detailed architectural specifications, please see the [UID 7-Layer Architecture](../uid-web/docs/uid-architecture-7-layers.md).

## Prerequisites
- Node.js (18+)
- pnpm, yarn, or npm

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the extension**
   ```bash
   npm run build
   ```

3. **Load into Chrome/Edge**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` or `build/` folder.

## Native Messaging Setup
To test Native Messaging with the local host securely, ensure the native messaging host manifest is installed in your browser's specific configuration directory.

## License

This project is licensed under the [Apache License 2.0](LICENSE). 

By open-sourcing our browser extension, we ensure complete transparency in how your web sessions and DLP policies are enforced. We welcome community audits and contributions.