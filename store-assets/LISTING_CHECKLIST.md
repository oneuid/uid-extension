# Browser extension store listing checklist

- **Product name**: UID Link
- **Version**: `2.5.11` (synchronized across `package.json`, `manifest.json`, and `UPGRADE.md`)
- **Privacy policy URL**: `https://uid.one/privacy`
- **Support & data deletion URL**: `https://uid.one/data-privacy` (`https://uid.one/help`)
- **Homepage URL**: `https://uid.one`

## Required icon & graphic assets

- `public/icon_16.png` (`16×16`, 24-bit RGB PNG, `#2563FF`)
- `public/icon_32.png` (`32×32`, 24-bit RGB PNG, `#2563FF`)
- `public/icon_48.png` (`48×48`, 24-bit RGB PNG, `#2563FF`)
- `public/icon_128.png` (`128×128`, 24-bit RGB PNG, `#2563FF`)
- `store-assets/promo_tile.png` (`440×280`, 24-bit opaque RGB PNG, `#0B1220` / `#1A2233` / `#2563FF`)
- `store-assets/screenshot_1.png` (`1280×800`)
- `store-assets/screenshot_2.png` (`1280×800`)
- `public/screenshots/popup.png` (current popup)
- `public/screenshots/pdf_signer.png` (current PDF signer)

## Permission justifications (Chrome Web Store / Firefox AMO / Edge Add-ons)

- `storage`: Stores default-off shield preferences, per-site HTTPS autofill allowlists, and ephemeral `chrome.storage.session` (`TRUSTED_CONTEXTS`) tokens.
- `contextMenus`: Adds right-click actions (`Sign text with UID.one`, `Sign PDF with UID.one`).
- `activeTab` & `scripting`: Executes PDF/email signing or targeted vault password fill solely on user-enabled HTTPS sites or when invoked via context menu.
- `notifications`: Displays signing outcomes and phishing lookalike warnings.
- `declarativeNetRequest`: Attaches the `X-UID-Session-Binding` header exclusively to `https://*.uid.one/*` requests.
- `host_permissions` (`https://uid.one/*`, `https://*.uid.one/*`) & `optional_host_permissions` (`https://*/*`): Restricts default access to HTTPS `uid.one` origins; third-party HTTPS sites require explicit user opt-in in the popup or options page.
