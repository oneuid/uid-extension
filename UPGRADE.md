# OneUID Browser Link - Upgrade Log

> **Repository**: `oneuid/uid-extension` (Cross-Browser WebExtension & Safari Extension for Session Binding, Opt-In DLP & Cryptographic Signing)
> **Ecosystem**: OneUID
> **Current version**: `v2.5.11` (2026-11-21)

## Feature inventory

| Module | Surface | Core capabilities |
| :--- | :--- | :--- |
| **Binding** | `src/` | Browser environment fingerprinting and HMAC session binding (`/v1/auth/session-binding/register/`) with MV3 session-only token storage, vault lock/unlink controls, and JWKS JWT verification |
| **Signer** | `src/` | Fail-closed in-browser PDF and webmail digital signature overlay supporting UID.one challenges, local PKCS#12 (`.p12`/`.pfx`) files, and optional HTTPS-only PKCS#11 local agent endpoints |
| **Shield** | `src/` | Anti-phishing lookalike origin verification plus opt-in per-site vault password fill (`approval.html` + closed Shadow DOM), `options.html` settings, and individual default-off DLP, EXIF, analytics cookie, clipboard metadata audit, and tab-blur toggles |
| **Targets** | `.github/workflows/` | Unified WebExtension manifest supporting Chrome, Edge, Brave, Firefox, and macOS/iOS Safari Web Extension packaging with PR verification gates |

## Release log

### Version 2.5.11 - 2026-11-21

- **[ADDED]** Added full popup session lifecycle and settings views (`#10`): in-popup QR browser linking (`Link this browser`), `Sign in on UID.one`, verified/unexpired session check (`CHECK_PAIRING`), masked account identifier and linked timestamp, `Lock` / `Unlock`, `Unlink`, account settings and `https://uid.one/data-privacy` account deletion link, loading/error/retry states, polite `aria-live` status region, and a dedicated `options.html` (`options_ui`) page managing all 5 default-off shields and allowed HTTPS autofill origins.
- **[ADDED]** Added dedicated extension-chrome challenge verification (`approval.html`) and hardened `src/content/autofill.ts` (`#11`): moved pairing and approval into extension chrome with a closed Shadow DOM (`mode: 'closed'`) companion dialog, added 44×44 px icon and close hit targets, displayed relying-party origin and large `tabular-nums` match number, localized all strings and notices across all 14 locales (removing `window.alert`), honored `prefers-reduced-motion: reduce`, and separated recoverable Cancel, Reject, Expiry, Timeout, and Error states.
- **[UPDATED]** Aligned UI chrome, toolbar icons (`16`/`32`/`48`/`128`/`512`), `store-assets/promo_tile.png`, `signer.html`, `src/style.css`, and `public/_locales/*/messages.json` with the official OneUID palette (`#2563FF`, `#1457FF`, `#6E9BFF`, `#7C3AED`, `#00D4FF`, `#0B1220`, `#1A2233`, `#E5E7EB`), light/dark WCAG AA contrast, >= 11 px captions, >= 44 px switch hit targets, and added `store-assets/LISTING_CHECKLIST.md` (`#12`).
- **[FIXED]** Untracked stale root `.zip` archives (`uid-link-chrome.zip`, `uid-link-firefox.zip`), synchronized `package.json`, `manifest.json`, and `UPGRADE.md` at `v2.5.11`, and added `pull_request` CI checks in `.github/workflows/release.yml` enforcing zero tracked `.zip` files, version parity, `pnpm run typecheck`, `pnpm run build`, `pnpm run build:firefox`, and `pnpm test` (`#8`).
- **[FIXED]** Renamed `public/screenshoots/` to `public/screenshots/`, removed unused Vite starter files (`src/counter.ts`, `src/assets/*`), updated `README.md` and `docs/README.*.md` to use `pnpm`, GitHub Releases downloads, accurate browser environment fingerprint wording, and screenshot links (`#9`).

### Version 2.5.10 - 2026-11-20

- **[SECURITY]** Narrowed MV3 manifest permissions and host access (`#5`): restricted `host_permissions` to `https://uid.one/*` and `https://*.uid.one/*` with `optional_host_permissions` (`https://*/*`), narrowed `content_scripts` to top-frame `https://uid.one/*` and `https://*.uid.one/*` (using `activeTab` + `chrome.scripting` for user-enabled sites and context-menu actions), removed `clipboardRead`, `clipboardWrite`, `webRequest`, and `<all_urls>` `web_accessible_resources`, tightened `declarativeNetRequest` to HTTPS `uid.one` only, added strict `content_security_policy.extension_pages`, enforced `isAllowedPdfFetchUrl` across `FETCH_AND_HASH_PDF`, `FETCH_PDF_BYTES`, and `signer.html`, added `GET_USER_PUBKEY` identifier traversal checks, and shipped sized 16/32/48/128 PNG icons.
- **[SECURITY]** Removed destructive default shields and clipboard sample exfiltration (`#6`): removed global print-blocking `@media print` CSS, DevTools console getter polling, `F12`/inspect/`contextmenu` blocking, `ViewportCleaner` DOM hiding, catch-all cookie regexes, and silent `navigator.clipboard.readText()` wiping; defaulted all shields (`settings_otp_shield`, `settings_exif_stripper`, `settings_cookie_guard`, `settings_clipboard_audit`, `settings_screen_shield`) to OFF with 1-to-1 popup toggles; eliminated `sample` substrings from `AUDIT_COPY` and removed signer email logging.
- **[SECURITY]** Removed 512-bit mock certificates and `DEMO_SIGNATURE_VALUE` (`#7`): deleted `generateMockCert`, `showRemoteSigningModal`, and unreviewed `remote_ca` third-party CA password forms; removed `'DEMO_SIGNATURE_VALUE'` fallbacks from `waitForChallengeApproval` so missing signatures fail closed; replaced hidden `local-agent-url` / `http://127.0.0.1:13013` with an explicit HTTPS-only agent endpoint setting; validated PKCS#12 decryption before modifying PDF bytes.
- **[FIXED]** Synchronized `package.json`, `manifest.json`, and `UPGRADE.md` at `v2.5.10`, updated popup title to `UID Link`, stripped `console.*` via Vite `mode === 'production'`, and added 14-locale translations for all new shield and signer controls.

### Version 2.5.9 - 2026-11-20

- **[SECURITY]** Eliminated plaintext `oneuid_access_token` / `identity_token` persistence in `chrome.storage.local` and removed all cleartext `http://127.0.0.1:13013/auth/sync` token sync calls, 5-second localhost poller, and broad localhost `host_permissions`; migrated active sessions to `chrome.storage.session` (`TRUSTED_CONTEXTS`) + in-memory storage with WebCrypto JWKS JWT signature/issuer/audience/expiry verification (`#1`).
- **[SECURITY]** Removed arbitrary-site session planting and wiping (`#oneuid-handshake-token` DOM scraping, `localStorage` scraping, `CustomEvent` listeners, and content-script `chrome.storage.local.remove`); enforced strict parsed HTTPS `uid.one` allowlist (`src/shared/origins.ts`) on both top-level `postMessage` and background `SET_SESSION_TOKEN` / `CLEAR_SESSION_TOKEN` sender checks, and expanded `OriginVerifier` lookalike detection (`#2`).
- **[SECURITY]** Removed global `<all_urls>` MAIN-world injection (`src/world.ts`) along with `window.vnpt_plugin` / `window.vgcaplugin` CA signing emulators and global `Notification` / `PushManager` / OPFS / `document.cookie` overrides (`#3`).
- **[SECURITY]** Hardened vault password fill (`src/content/autofill.ts`, `src/background/index.ts`, `src/main.ts`, 14 locales): removed "Sign in with passkey" mislabeling, made autofill opt-in per HTTPS site (default OFF), eliminated form auto-submission and raw `DECRYPT_PAYLOAD` string delivery to content scripts (replaced with background `chrome.scripting.executeScript` targeted fill), required extension UI + explicit user gesture + match number on `APPROVE_CHALLENGE`, blocked `SAVE_PAIRING` from storing challenge tokens, removed the `/qr?challenge=` browser auto-approve link, and added pairing poll timeouts + `REJECTED`/`EXPIRED` termination (`#4`).
- **[ADDED]** Added unit test suite (`tests/security.test.ts`) verifying UID origin allowlists, substring bypasses, JWKS JWT verification, and built bundle security invariants.

### Version 2.5.8 - 2026-11-19

- **[REMOVED]** Fixed `uid-link` Extension & Safari Pipelines (`pnpm` + Node `22`, Removed Stale `v1.3.5` `package-lock.json`, Fixed Undefined `steps.get_version` & `workflow_dispatch` Tag Resolution, & Added Fast Ubuntu `1x` Verify on `main` Push)

### Version 2.5.6 - 2026-11-16

- **[UPDATED]** Migrated Chrome, Firefox, and Safari WebExtension CI pipelines to `pnpm 10.26.2`, Node 22, and fast Ubuntu `1x` verification on `main`.
- **[FIXED]** Switched `build:publish` script to `pnpm`, fixed `workflow_dispatch` tag resolution, and removed stale `v1.3.5` `package-lock.json` (`2026-11-17`).

### Version 2.5.5 - 2026-11-15

- **[ADDED]** Cryptographic Minimal PDF signer UI and 14-locale IME composition guards across popup and content-script overlays.
- **[UPDATED]** Distilled all extension background, content, and popup modules to LEXICON 1-word file and function identifiers.

### Version 2.5.1 - 2026-11-08

- **[UPDATED]** Synced golden-ratio (`phi = 1.618`) OneUID Shield-Key `#2563EB` extension toolbar and store icons.
