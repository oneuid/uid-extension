---
name: release-manager
description: Principal Release & Version Architect responsible for Semantic Versioning (SemVer), Cross-Platform Manifest Synchronization (Web Next.js, Desktop Tauri v2, Mobile Expo iOS/Android, Backend Django API), Live Client Auto-Update Propagation (VersionGuard & /api/version), and Pre-Release CI Gate Verification (Flake8 E9/F63/F7/F821 & TypeScript tsc --noEmit) across DING OS, Trip Express, SHAN, and OneUID. Use whenever shipping features, fixing bugs, preparing releases, or bumping versions.
---

# Principal Release & Version Manager (`release-manager`)

## 1. Mission & Core Philosophy ("Zero Unversioned Releases")

In a multi-surface operating system like **DING OS** (and sister ecosystems **Trip Express**, **SHAN**, and **OneUID**), merchants and guests run our software simultaneously across **4 client/server surfaces**:
1. **Web & White-Label Custom Domains (`getding.io`, `desk.yourdomain.com`)**: Long-lived browser tabs and PWAs kept open 24/7 at hotel front desks and restaurant counters.
2. **Desktop Counter Kiosk (`src-tauri` — Windows `.exe`, macOS `.dmg`, Linux `.AppImage/.deb`)**: Native Rust + WebView terminals connected to LAN TCP `9100` ESC-POS thermal printers and cash drawers.
3. **Mobile Native Apps (`app.getding.io`, `trip.express/mobile`, `shan.one`, `uid-app`)**: iOS App Store (`ios.buildNumber`) and Google Play (`android.versionCode`) binaries.
4. **Backend API (`api.getding.io`, `trip.express/x`, `uid-core`)**: Authoritative REST & WebSocket servers.

**Why Strict Version Management Is Mandatory**:
- If code is updated without bumping and synchronizing the version across all manifests, **long-lived Web/PWA tabs stay stuck on stale cached JS bundles**, **Desktop Tauri terminals download mismatched installers**, and **iOS/Android app stores reject binary builds due to duplicate `versionCode` / `buildNumber`**.

---

## 2. Single Source of Truth Architecture (DING OS)

Every DING OS release is governed by synchronized manifests managed by `python3 scripts/release.py`:

| Surface | Canonical File(s) | Purpose |
| :--- | :--- | :--- |
| **Web Runtime & Download Registry** | `getding.io/lib/version.ts` (`APP_VERSION`, `MIN_SUPPORTED_VERSION`) | Imported by `components/version-guard.tsx`, `app/api/version/route.ts`, `app/api/download/route.ts`, and `components/download/view.tsx`. Never hardcode version strings in components! |
| **Live Client Polling Manifest** | `getding.io/public/version.json` & `GET /api/version` | Polled by `<VersionGuard />` on `visibilitychange` (tab focus) and every 10 minutes with `Cache-Control: no-store`. Displays a non-disruptive **Update Ready** toast pill when `remote.version > APP_VERSION`. |
| **Desktop Tauri v2 Kiosk** | `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `public/install.sh`, `public/install.ps1`, `.github/workflows/desktop.yml` | Controls native `.exe`, `.dmg`, `.deb`, and `.AppImage` bundle filenames and GitHub Release tag triggers (`vX.Y.Z`). |
| **Mobile Native (Expo)** | `app.getding.io/package.json` & `app.getding.io/app.json` | Synchronizes `expo.version` and automatically increments `expo.ios.buildNumber` and `expo.android.versionCode`. |
| **Backend API (`api.getding.io`)** | `api.getding.io/VERSION` & `GET /v1/version/` (`apps/core/views/health.py`) | Exposes `version`, `latest_client_version`, `min_client_version`, `force_update`, and `X-Ding-Version` HTTP response header. |

---

## 3. Mandatory Pre-Release & Version Bump Workflow

Whenever a feature, business model enhancement, or bugfix batch is completed on any repository, execute the **3-Step Release Protocol**:

### Step 1: Run Automated Pre-Flight AST (Flake8 `E9/F63/F7/F821`) & TypeScript Gates
Before bumping or pushing, verify zero undefined names (`F821`), syntax errors (`E999`), or TypeScript errors:
```bash
python3 /home/s/Projects/getding.io/scripts/release.py --status
npx tsc --noEmit
```

### Step 2: Synchronize & Bump Version via `scripts/release.py`
 follows Semantic Versioning (`MAJOR.MINOR.PATCH`):
- **`patch` (`2.5.0 -> 2.5.1`)**: Bug fixes, linter fixes, copy adjustments, performance tuning.
- **`minor` (`2.4.0 -> 2.5.0`)**: New UI features, studio modules, BA quick wins, backward-compatible API endpoints.
- **`major` (`2.x.x -> 3.0.0`)**: Breaking architectural or API contract migrations.

**Commands**:
```bash
# Bump DING OS across Web, Desktop (Tauri), Mobile (Expo), and Backend API:
python3 /home/s/Projects/getding.io/scripts/release.py --target ding --bump patch

# Or set an explicit version across DING OS:
python3 /home/s/Projects/getding.io/scripts/release.py --target ding --version 2.5.0

# Or bump across the entire 4-product ecosystem (ding, trip, shan, uid):
python3 /home/s/Projects/getding.io/scripts/release.py --target all --bump patch
```

### Step 3: Verify Client Update Propagation
1. Confirm `getding.io/lib/version.ts`, `getding.io/public/version.json`, `getding.io/src-tauri/tauri.conf.json`, `app.getding.io/app.json`, and `api.getding.io/VERSION` all report the exact same version string.
2. Confirm `<VersionGuard />` is mounted in `app/[lang]/layout.tsx` so active merchant tabs receive the one-click update prompt immediately after deployment.
