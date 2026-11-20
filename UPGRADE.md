# OneUID Browser Link - Upgrade Log

> **Repository**: `uid.one/uid-link` (Cross-Browser WebExtension & Safari Extension for Session Binding, DLP & Cryptographic Signing)
> **Ecosystem**: OneUID
> **Current version**: `v2.5.9` (2026-11-20)
> **Release policy**: Updated automatically via `python3 /home/s/Projects/getding.io/scripts/release.py` and verified by `gate.py` before every release push.

## Feature inventory

| Module | Surface | Core capabilities |
| :--- | :--- | :--- |
| **Binding** | `src/` | Hardware device fingerprinting and HMAC session binding (`/v1/auth/session-binding/register/`) with MV3 session-only token storage and JWKS JWT verification |
| **Signer** | `src/` | Cryptographic Minimal in-browser PDF and webmail digital signature overlay paired with **UID Agent** PKCS#11 hardware tokens |
| **Shield** | `src/` | Real-time anti-phishing origin verification, context-aware browser DLP clipboard/upload guard, and opt-in per-site vault password fill |
| **Targets** | `.github/workflows/` | Unified WebExtension manifest supporting Chrome, Edge, Brave, Firefox, and macOS/iOS Safari Web Extension packaging |

## Release log

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
