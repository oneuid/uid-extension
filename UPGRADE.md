# OneUID Browser Link - Upgrade Log

> **Repository**: `uid.one/uid-link` (Cross-Browser WebExtension & Safari Extension for Session Binding, DLP & Cryptographic Signing)
> **Ecosystem**: OneUID
> **Current version**: `v2.5.8` (2026-11-19)
> **Release policy**: Updated automatically via `python3 /home/s/Projects/getding.io/scripts/release.py` and verified by `gate.py` before every release push.

## Feature inventory

| Module | Surface | Core capabilities |
| :--- | :--- | :--- |
| **Binding** | `src/` | Hardware device fingerprinting and HMAC session binding (`/v1/auth/session-binding/register/`) preventing cookie/token replay |
| **Signer** | `src/` | Cryptographic Minimal in-browser PDF and webmail digital signature overlay paired with **UID Agent** PKCS#11 hardware tokens |
| **Shield** | `src/` | Real-time anti-phishing origin verification, context-aware browser DLP clipboard/upload guard, and anti-tracking cookie filter |
| **Targets** | `.github/workflows/` | Unified WebExtension manifest supporting Chrome, Edge, Brave, Firefox, and macOS/iOS Safari Web Extension packaging |

## Release log

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
