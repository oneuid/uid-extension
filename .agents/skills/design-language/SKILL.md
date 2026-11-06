---
name: design-language
description: Unified Design System Charter bridging SYSTEM DESIGNER (system-designer/SKILL.md - Macro-Structure, Information Architecture, 375px Row Budget, Cross-Route App Shell, 0ms Optimistic State & break-ui Stress Test) and UI DESIGNER (ui-designer/SKILL.md - Micro-Craft, Brand Visual DNA, Anthropic Frontend-Design Anti-Slop, Geometric Proportions, Optical Typography, Emil Kowalski 120fps Motion Physics, and Garry Tan gstack 7-Pass 0-10 Visual Design Review). Use alongside system-designer/SKILL.md and ui-designer/SKILL.md whenever designing, planning, building, stress-testing, auditing, or polishing UI across web, mobile, and desktop repositories.
---

# Ecosystem Design Language (`design-language` -> `system-designer` + `ui-designer`)

Distilled from **Anthropic `frontend-design`** (`anthropics/skills/frontend-design` - Subject-Matter Grounding, Two-Pass Plan & Self-Critique, 5 Default AI Look Traps & Chanel's Subtraction Rule), **Emil Kowalski (`emilkowalski/skill`)** (`emil-design-eng`, `ui-cheatsheet`, `performance-cheatsheet`, `animate-expo`, `mobile-native`, `break-ui`), **Garry Tan `gstack` (`/plan-design-review` & `/design-review`)** (Surface Mode Classifier, 7-Pass `0-10` Design Plan Review & Fix-to-10 Loop, Krug's Trunk Test, Goodwill Reservoir, 7 Hard Rejections & 7 Litmus Checks), **Jony Ive / Apple HIG**, **Karri Saarinen (`The Linear Method`)**, **Stripe Design (`Patrick Collison & Katie Dill`)**, **Jakub Krehel (`Interface Craft`)**, **Hallmark** (`Nutlope/hallmark`), **Frontend Slides** (`zarazhangrui/frontend-slides`), and **Scroll World** (`oso95/scroll-world`).

In our ecosystem (`ding`, `trip`, `shan`, `uid`), design governance is explicitly separated into **2 specialized roles** so macro-structure and micro-aesthetics never conflict:
1. **`SYSTEM DESIGNER` (`system-designer/SKILL.md` - Principal System & Information Designer)**: Owns **Macro-Structure** - Information Architecture (IA), the 5 Hard Structural Veto Gates, Cross-Route App Shell topology, `375px` 2-Tier Mobile Toolbar Budget, `@/components/ui/*` primitive contracts, `0ms` Optimistic UI / Prefetching topology, and Emil Kowalski's `break-ui` adversarial structural stress tests.
2. **`UI DESIGNER` (`ui-designer/SKILL.md` - Principal UI, Visual & Motion Designer)**: Owns **Micro-Craft** - Brand-Specific Visual DNA (`Tactile Precision`, `Kinetic Horizon`, `Cryptographic Minimal`, `Quiet Architectural Luxury`), Concentric Radii & Optical Typography, Anthropic `frontend-design` Anti-Slop & Chanel's Subtraction Rule, Emil Kowalski `120fps` Motion Physics (`emil-design-eng`, `mobile-native`, `animate-expo`), and Garry Tan's `gstack` 7-Pass `0-10` Visual Review.

---

## 0. `SYSTEM DESIGNER` Charter & 5 Hard Structural Veto Gates (`system-designer/SKILL.md`)

Why do engineering-led teams accidentally ship cluttered screens even when individual buttons and colors follow a style guide? Because without a **Principal System Designer (`SYSTEM DESIGNER`)** auditing **Information Architecture (IA), Navigation Stacking, State Latency, and Spatial Density** first, developers keep appending controls row-by-row until mobile viewports (`375px`) fracture.

The **Principal System Designer (`SYSTEM DESIGNER`)** holds **Hard Veto Power** in the Executive Council over every UI blueprint across `ding`, `trip`, `shan`, and `uid` via 5 mandatory structural gates:

### Gate 1 - Single Primary Navigation Law (`Quy tắc 1 Thanh Điều Hướng Duy Nhất`)
- **Zero Navigation Stacking**: Never render two primary or secondary navigation bars of the same hierarchy on the same viewport (e.g., NEVER combine a Top Header Quick Switcher with a horizontal mobile tab strip below the header AND a fixed bottom footer nav).
- **Linear / Stripe Single-Header Quick Switcher (`< lg`)**: On mobile and tablet viewports (`< 1024px`) or when the desktop sidebar is collapsed, workspace navigation consolidates into a single borderless breadcrumb trigger in the top header (`Logo | Active View ▾`) that opens a structured Quick Switcher Popover (showing current page `subNav` items first, followed by module groups).

### Gate 2 - The `375px` Mobile Row Density Budget (`Ngân sách Mật độ 2 Cụm / Hàng trên Mobile`)
- **Max 2 Interactive Groups per Mobile Row (`< 640px`)**: A `375px` screen has only `347px` of inner width (`px-3.5`). Never place `Search Input + Filter Select + Secondary Button + Primary CTA` in a single `flex-wrap` row on mobile - doing so either crushes the Search Input under `120px` or wraps controls into 3-4 ragged rows.
- **Canonical 2-Tier Mobile Toolbar Pattern**:
  - **Row 1 (`justify-between`)**: Left = **View / Sub-Tab Switcher** (`Segmented Pill` with `N <= 3` items, e.g., `[ Grid | Calendar ]` or `[ Kanban | Table | Goals ]`) - Right = **Primary `+ Add` CTA** (+ at most 1 compact `36x36px` icon button).
  - **Row 2 (`w-full`)**: **100% Full-Width `<SearchBar>`** with secondary filters (`Status`, `Category`, `Role`, `Signal`) tucked cleanly inside its `Filters (N)` popover/drawer.

### Gate 3 - Strict `1-Primary / N-Contextual` Action Hierarchy (`Phân cấp Hành động 1-Chính / N-Phụ`)
- **One Dominant Primary CTA per Screen**: Every view has at most **1 high-contrast Primary CTA** (`+ Add`, `+ Invite`, `Pay`, `Save`) visible in the toolbar.
- **Progressive Disclosure for Secondary Actions**: Secondary utilities (`Templates`, `Import`, `Export`, `Matrix`, `Tax Rules`) must never crowd the mobile primary toolbar. Tuck them inside the `+ Add` modal header (`Templates`), inside the `Filters` drawer, or scope them strictly to desktop (`hidden sm:inline-flex` / `hidden md:inline-flex`) when mobile equivalents already exist inside modals.

### Gate 4 - Cross-Route App Shell Consistency (`Đồng nhất Khung Vỏ Toàn Cục`)
- Every route inside an application (`/dashboard`, `/units`, `/agents`, `/settings/team`, `/reports/commission`, `/referrals`, `/profile`, `/inbox`) MUST share the **exact same App Shell chrome**:
  - Identical top header height, breadcrumb trigger position, and right utility cluster.
  - Zero orphan `fixed bottom-0` footer bars that appear on one route (`/dashboard`) and disappear on another (`/settings/team`).
  - Identical fluid `<main>` container padding (`w-full px-3.5 sm:px-6 py-4 sm:py-6`) and consistent floating action button (`FAB`) bottom offset (`bottom-5 sm:bottom-6`).

### Gate 5 - Dual-Viewport Visual Verification (`Kiểm thử Thị giác Kép 375px & 1440px`)
- Before signing off any UI task, the `SYSTEM DESIGNER`, `UI DESIGNER`, and `VERIFIER` inspect both **`375px` (Mobile Portrait)** and **`1440px` (Desktop Wide)**:
  - Zero horizontal overflow (`scrollWidth <= clientWidth`).
  - Zero `...` truncated labels on navigation tabs, segmented controls, or KPI titles.
  - Zero ragged multi-row button wrapping in toolbars.

---

## 1. Universal Geometric Proportion Laws (The "Chassis & Beltline" Math)

### A. Law of Concentric Radii (`R_outer = R_inner + Padding`)
Nested rounded corners must share the same curvature center. Never mix arbitrary radii inside a card:
- **Outer Card / Sheet / Modal**: `rounded-2xl` (`16px`) with `p-4` (`16px`) or `p-5` (`20px`).
- **Inner Interactive Control (Button, Input, Select) or Sub-Banner**: `rounded-xl` (`12px`) or `rounded-lg` (`8px`).
- **Inline Status Badge / Tag / Chip**: `rounded-md` (`6px`) for technical/operational density, or `rounded-full` for pill counters.
- **Forbidden**: Never put a `rounded-3xl` (`24px`) card around a `py-6 rounded-2xl` button - it destroys optical balance and looks inflated.

### B. Strict Control Height Scale (Never Inflate Buttons with Vertical Padding)
Interactive controls must use fixed height tokens (`h-*`) rather than arbitrary vertical padding (`py-4`, `py-5`, `py-6`):
| Control Tier | Height Token | Font / Icon Spec | Use Case |
| :--- | :--- | :--- | :--- |
| **Compact (`xs`)** | `h-7` (`28px`) | `text-xs font-medium`, icon `14px` (`w-3.5 h-3.5`) | Inline table actions, alert sub-actions (`Merge`, `Keep Both`), filter chips |
| **Small (`sm`)** | `h-8` (`32px`) | `text-xs font-semibold`, icon `15px` (`w-3.5 h-3.5`) | Header utility buttons (`Chime`, `Export`), card header actions |
| **Default (`md`)** | `h-9` (`36px`) | `text-xs` or `text-sm font-semibold`, icon `16px` (`w-4 h-4`) | Primary card actions (`Start Preparation`, `Save`, `Connect`), standard inputs |
| **Large (`lg`)** | `h-10` (`40px`) | `text-sm font-semibold`, icon `18px` (`w-4.5 h-4.5`) | Checkout primary CTA, auth submit button, hero search trigger |

- **Button-to-Card Area Ratio**: A card's primary action button must never exceed **12–15%** of the card's total vertical height (`h-9` inside a `p-5` card is ideal).
- **Button Label Discipline**: Keep button labels to **1–2 crisp words** (`Save`, `Merge`, `Dispatch`, `Verify`). Never stretch secondary action buttons to `flex-1` next to a short text button.

### C. Four-Step Surface Ladder & Hairline Borders (Depth Without Heavy Shadows or Left Borders)
Following Linear and Vercel's surface engineering, hierarchy is achieved via **surface luminance steps** and **1px hairline borders**, NOT heavy drop shadows (`shadow-xl`, `shadow-2xl`), thick 4-sided colored borders (`border-2 border-emerald-500`), or "vibe-code" colored left borders (`border-l-4`, `border-s-4`, `border-l-2`):
1. **Level 0 — Canvas**: Page background (`bg-slate-50` light / `bg-slate-950` or `#010102` dark).
2. **Level 1 — Primary Surface**: Card / Panel (`bg-white` light / `bg-slate-900` dark) with uniform `1px` hairline border (`border-slate-200/90` light / `border-slate-800` dark) and at most `shadow-2xs`.
3. **Level 2 — Elevated / Interactive Surface**: Hovered row, active nav item (`bg-slate-900/[0.05] dark:bg-white/[0.08] rounded-lg`), or active tab pill.
4. **Level 3 — Translucent Floating Chrome**: Sticky headers, drawers, command palettes (`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl`).
- **Inner Image Hairline Ring & Optical Icon Centering (`jakubkrehel/skills`)**:
  - Every photo, cover thumbnail, or avatar must carry a subtle inset border ring (`ring-1 ring-inset ring-black/5 dark:ring-white/10`) so bright or dark image edges never bleed into adjacent card backgrounds.
  - Asymmetric directional icons (`Play`, `Send`, `ChevronRight`) inside circular buttons must shift `translate-x-[0.5px]` to align their optical center of mass with the geometric center.
- **Strict Zero Single-Sided Accent Border / Strip & Zero Nested-Card Rule**:
  - **NEVER** use decorative single-sided accent borders or gradient strips on **ANY of the 4 sides (top, bottom, left, right)** (`border-t-2`, `border-t-4`, `border-l-4`, `border-l-2`, `border-s-4`, `border-r-2`, `border-b-2` on cards, or `<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r ..." />` / `absolute inset-y-2 start-0 w-1`) on cards, login boxes, alerts, notes, or navigation items — that is a telltale "2000s freshman project / vibe-code" trope. Always use a uniform `1px` full-perimeter hairline border (`border border-slate-200 dark:border-slate-800`) and convey status cleanly through compact status badges (`RECEIVED`, `PREPARING`) and primary action buttons.
  - **NEVER** nest a bordered/tinted box (`bg-amber-50 border p-3 rounded-xl` or `bg-slate-50 p-3 rounded-lg`) inside a card for notes, warnings, or sub-sections. Separate internal card sections strictly with a `1px` horizontal divider (`border-b border-slate-100 dark:border-slate-800/80`) or clean typography (`text-xs text-slate-500`).
- **Strict CSS `dark:` Class Pairing (Ban Runtime `isDark` Class Ternaries)**:
  - **NEVER** compute `const isDark = resolvedTheme !== 'light'` (or `resolvedTheme === 'dark'`) in JavaScript to conditionally branch Tailwind background/text classes (`isDark ? 'text-slate-100' : 'text-slate-900'`). During SSR hydration or theme transitions, `resolvedTheme` can desync from the `html.dark` class, resulting in white text (`text-slate-100`) rendered on a white card (`bg-white`)!
  - **ALWAYS** use pure, atomic CSS `dark:` utility pairs (`bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`) so background and foreground contrast are guaranteed by the browser's CSS cascade on every single frame.

### D. Viewport Stage, Single Focal Visual & Anti-Slop Layout Laws (`Nutlope/hallmark` v2.0 + `Frontend Slides` + `Scroll World`)
1. **Single Focal Visual per Viewport (`Hallmark`)**:
   - Never stack or place two dark-overlay image banners/cards within the same viewport (`100svh`). If a page uses a full-bleed Cover Hero banner at the top, adjacent content columns below must use clean surface cards (`bg-white dark:bg-slate-900`) rather than a second competing photo card.
2. **Ban Generic 3-Column Icon-Card Clichés, Vibecode Eyebrow Pills, Auroras & Colored Glows (`Hallmark` Gates 2a, 3, 29)**:
   - Never render generic AI-slop purple/pink/cyan gradients (`from-purple-500 to-pink-500`), floating blurred aurora blobs (`blur-3xl bg-amber-500/20`) behind text, colored zero-offset glow shadows (`shadow-amber-500/30`), or repetitive 3-equal-column icon-above-heading tiles. Prefer **Asymmetric Functional Grids** (e.g., `5 cols` direct channels/metrics + `7 cols` interactive form/preview) or **Bento Grids** anchored by real interactive UI states.
   - **Ban Vibecode Section-Header Eyebrow Pills (`Max 1 Hero Pill per Page`)**: **NEVER** place a bordered pill/capsule (`rounded-full bg-amber-500/10 border ...` with an icon or dot + uppercase text) above every `<section>` `<h2>` or sub-section `<h3>` — repeating pill kickers across multiple sections is the #1 "vibecode / AI-slop template" tell, creates false interactive affordance, and repeats what the heading right below it already says. Allow at most **1** eyebrow pill on the top Hero section of a public landing page; all subsequent sections must lead directly with a strong `<h2>` / `<h3>` and generous top whitespace (`Gate 71`).
   - **Ban Redundant Floating Badges on Feature Card Photos**: Never glue decorative text badges onto the corners of feature/workflow card images when the card's `<h3>` title sit immediately below the image (`12px` away).
3. **The 5%–8% Viewport Accent Budget (`Hallmark` Gate 23)**:
   - Brand accent color (`amber-500`) must occupy **at most 5%–8% of any viewport**, strictly reserved for the primary CTA, active status indicator, or active tab marker. Painting >10% of the viewport in accent color destroys signal hierarchy.
4. **Grid Track Blowout Guard & Single Sticky Plane (`Hallmark` Gates 34, 50, 56)**:
   - Always set `overflow-x: clip` on `html, body` (never `100vw`). Image-bearing or text-truncating grid/flex tracks must carry `min-w-0` / `minmax(0, 1fr)` with `break-words` so long titles never cause horizontal scroll between `320px` and `1920px`.
   - Never stack two `sticky top-0` elements that collide on scroll without offsetting `top` and z-index hierarchy.
5. **Viewport-Aware Wizard & Kiosk Stages (`Frontend Slides` + `Scroll World`)**:
   - Onboarding wizards (`/onboard`), Kiosk check-in screens, and pitch sections must frame each step as a self-contained stage (`min-h-[calc(100svh-4rem)]`) with **`>= 35%` open background whitespace**, 1 clear headline, and 1 primary action per step so users never scroll through walls of form fields.
   - Restrict scrollytelling / parallax strictly to public marketing and luxury showcase pages (`shan.estate`, `shan.voyage`); **never** add scroll-jacking or heavy 3D canvas effects to operational front-desk/POS screens.
6. **Law of Pure Operational Utility (Zero Non-Operational UI Noise in Workspace Views)**:
   - Every element inside authenticated operational views (`/dashboard`, `/inbox`, `/agents`, `/profile`, `/referrals`, `/reports/*`, `/settings/*`, `/check-in`, `/kiosk`) MUST either **(a) display a live, changing operational metric from the database** or **(b) trigger a real operational action or setting**.
   - **Strictly Forbidden in Operational Views**:
     - **Marketing Strips / Slogans**: Never place promotional sub-headers or channel lists inside workspace pages (e.g., `"Omni-Channel AI Hub - QR Web Chat, Messenger..."`).
     - **Read-Only "Locked / Protected / Architecture Explainer" Cards**: Never render non-interactive security/compliance explainer cards (`"Data Protection [Locked]"`, `"Zero-Knowledge Session Security"` read-only tabs, `"Protected by Jev Sybil Shield · 100% Verified"` footers) on staff screens.
     - **Simulation Toggles & Platform-Admin Widgets on Merchant Screens**: Never render demo scenario toggles (`Surplus` vs. `Subsidized`), `Test Lock` fraud simulation buttons, internal platform seller tax forms (`Admin Tax Connectors`), or duplicate hardcoded summary cards inside settings pages.
      - **Fake Scarcity Meters & Promo Searchers**: Never render artificial scarcity percentages (`"Namespace Scarcity: 94% Claimed"`), rarity badges (`"Tier 1 Ultra-Rare"`), or sample handle promo buttons (`nen`, `lux`, `sixsenses`) inside workspace domain settings.
      - **Redundant Policy Strips**: Never render a secondary read-only summary bar right below a toolbar that already exposes the exact same setting button.
7. **Mobile-First Unboxed `<aside>` & Cardinality-Based Navigation (`N <= 3` Single-Row Segmented Control vs. `N >= 4` Mobile Filter/Section Drawer)**:
   - **Zero Duplicate Mobile Header Title**: Never render a gray `[ViewName]` pill next to the logo inside the sticky mobile header when the page already renders an `<h1>` title right below it.
   - **Zero Boxed `<aside>` Wrapper on Mobile (`< lg`)**: In 12-column settings/workspace layouts (`aside.lg:col-span-3` + `div.lg:col-span-9`), NEVER wrap the `<aside>` in a white bordered card (`rounded-2xl border bg-white p-4`) on `< lg` mobile screens — doing so creates a boxed card stacked right on top of the content card. Scope the outer card surface strictly to desktop (`lg:rounded-2xl lg:border lg:border-slate-200 lg:dark:border-slate-800 lg:bg-white lg:dark:bg-slate-900 lg:p-4 lg:shadow-2xs`).
   - **Strict Cardinality Rule (`Ban Multi-Row Segmented Controls`)**: A Segmented Control MUST NEVER wrap into 2 rows (`grid-cols-3` with 5–6 items is strictly forbidden because the active white pill floats awkwardly in the top-left corner of a tall gray box):
     - **`N <= 3` items (`Mailboxes` [2], `Team` [2], `Referrals` [2], `Profile` [3], `Commissions` [3])**: Use a **1-Row Segmented Control (`grid-cols-2` or `grid-cols-3`)** for instant 1-tap switching on a single `h-9` track.
     - **`N >= 4` items (`Integrations` [6], `Workspace` [6], `AI Studio` [6], `Billing` [5])**: Hide the `<nav>` list on `< lg` (`hidden lg:flex lg:flex-col`) and render `<MobileSectionDrawer />` (`components/ui/filter-drawer.tsx`) inline in the page header row (`lg:hidden`). Tapping the trigger opens a clean Bottom Sheet / Filter Drawer showing every item's icon, full label, subtitle, and live count badge (`tabular-nums`) with 1-tap selection and auto-close.
   - **Zero Crammed Sidebar Footer Links**: Never cram cross-page navigation links (`Referrals → | Ledger →`) into the bottom of a vertical `<aside>` sidebar; route cross-module navigation cleanly through the header `AppLauncher` or `UserMenu`.
8. **Canonical Workspace Viewport & Container Sizing Law (`w-full px-3.5 sm:px-6 py-4 sm:py-6` — 100% Aligned with `DashboardHeader`)**:
   - **Why Widths Must Never Jump Across Views**: `DashboardHeader` (`components/header.tsx`) is a full-width top bar (`w-full px-3.5 sm:px-6`) to the right of the `272px` Unfold Left Sidebar. If any authenticated workspace `<main>` uses `max-w-3xl` (`768px`), `max-w-4xl` (`896px`), or `max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8` (`1280px`), its left and right edges will pull inward on `1440px+` / `1920px+` monitors and misalign against the `DashboardHeader`'s left `[◧]` toggle and right `[👤]` user avatar, making screens jump between narrow and wide as the user clicks through the sidebar.
   - **Single Workspace `<main>` Formula**: Every authenticated workspace `<main>` container (`/dashboard`, `/agents`, `/settings/domains`, `/settings/integrations`, `/settings/mailboxes`, `/settings/team`, `/settings/billing`, `/referrals`, `/reports/commission`, `/profile`, `/seatmap`, `/kiosk`, `/help`) MUST use **`w-full px-3.5 sm:px-6 py-4 sm:py-6`** (fluid `100%` width with the exact same `px-3.5 sm:px-6` horizontal padding as `DashboardHeader` and zero `max-w-*` caps).
   - **Inner Views (`Tasks` Kanban & `Catalog` Studio)**: Kanban boards (`components/tasks/manager.tsx`) must use a fluid 3-column grid (`grid grid-cols-1 sm:grid-cols-3 gap-4 items-start w-full` with `w-full min-w-0` columns, never fixed `sm:w-[320px] lg:w-[340px]` columns), and Catalog Editor tab panels (`components/catalog/editor.tsx`, `components/catalog/workspace/modal.tsx`) must use `space-y-6 w-full` (never `max-w-3xl`).
   - **Public Marketing Pages Only (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`)**: Reserve `max-w-7xl mx-auto` strictly for standalone public marketing/legal pages (`/`, `/pricing`, `/download`, `/terms`, `/privacy`, `/cookies`) that do not have the Unfold Left Sidebar.

### E. Scientific Chromatic & Token System (Tactile Precision Palette — Web & Mobile Parity)
To eliminate visual noise, muddy gray buttons, and inconsistent border weights across `getding.io` (Web) and `app.getding.io` (`ding/app` Mobile), all components MUST adhere to this deterministic chromatic matrix (APCA / WCAG AA+ verified):

1. **Single Neutral Scale (`slate` Only — Ban Mixing `gray`, `zinc`, `neutral`)**:
   - **Canvas (Level 0)**: Light `bg-slate-50` (`#f8fafc`) | Dark `bg-slate-950` (`#020617`).
   - **Card / Surface (Level 1)**: Light `bg-white` (`#ffffff`) | Dark `bg-slate-900` (`#0f172a`).
   - **Subtle Well / Track / Input Fill (Level 1.5)**: Light `bg-slate-100/80` or `bg-slate-50` | Dark `bg-slate-950/70` or `bg-slate-800/60`.
   - **Hairline Border (Default)**: Light `border-slate-200/90` (`#e2e8f0`) | Dark `border-slate-800` (`#1e293b`). **Never** use heavy `border-slate-300` on standard cards or containers in Light Mode; reserve `border-slate-300 dark:border-slate-700` strictly for `:hover` or active input focus transitions.
   - **Internal Divider**: Light `border-slate-100` (`#f1f5f9`) | Dark `border-slate-800/80`.

2. **Four-Tier Typography Contrast Scale**:
   - **Primary Ink (Headings, Titles, Totals, Active Labels)**: `text-slate-900 dark:text-slate-50` (`#0f172a` / `#f8fafc`, APCA $L_c > 90$).
   - **Secondary Body (Descriptions, Table Cells, Inactive Nav)**: `text-slate-600 dark:text-slate-300` (`#475569` / `#cbd5e1`, APCA $L_c > 65$).
   - **Tertiary Meta (Timestamps, Subtitles, Unit Capacities)**: `text-slate-500 dark:text-slate-400` (`#64748b` / `#94a3b8`, APCA $L_c > 50$).
   - **Muted / Placeholder / Eyebrow**: `text-slate-400 dark:text-slate-500` (`#94a3b8` / `#64748b`).

3. **Scientific Button & Interactive Control Matrix**:
   - **Primary (`default` — High-Contrast Ink)**: `bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 shadow-2xs`.
   - **Brand Signal (`brand` — Revenue / Checkout / Dispatch CTA)**: `bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-2xs` (always dark `text-slate-950` on `#f59e0b` amber for 10.2:1 WCAG AAA contrast — never white text on `amber-500`).
   - **Outline (`outline` — Crisp Surface Action)**: `bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white shadow-2xs`. (**Never** fill `outline` buttons with muddy `bg-slate-200/80`).
   - **Secondary (`secondary` — Soft Neutral Pill / Filter Action)**: `bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-slate-200/75 dark:hover:bg-slate-700 shadow-2xs`.
   - **Ghost (`ghost` — Utility / Icon Trigger)**: `bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white`.
   - **Destructive (`destructive` — Cancel / Void / Delete)**: `bg-rose-600 text-white hover:bg-rose-500 shadow-2xs`.

4. **Hospitality & POS Semantic Status Palette (Soft Fill + Hairline Border + High-Contrast Text)**:
   - **Active / Occupied / Settled / Online (`emerald`)**: `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20`.
   - **Pending / Preparing / Chime Alert / Hold (`amber`)**: `bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25`.
   - **Urgent / Overdue / Void / Stop-Sell (`rose`)**: `bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20`.
   - **Reserved / Scheduled / Synced (`sky` / `blue`)**: `bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20`.
   - **Available / Idle / Closed (`slate`)**: `bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700`.

5. **`shadcn/ui` Official Component & Tailwind Hygiene (`shadcn-ui/ui` `skills/shadcn`)**:
   - **Built-in Variants First (`className` for Layout, Not Color Overrides)**: Always use `<Button variant="outline" size="sm">` and `<Badge variant="emerald">` instead of writing 15 ad-hoc color classes on raw `<button>` or `<span>` elements.
   - **Use `flex flex-col gap-*` Instead of `space-y-*` / `space-x-*`**: Margin-based `space-*` selectors break when child elements are conditionally hidden or wrapped in portals.
   - **Use `size-*` Shorthand When Width & Height Match**: Prefer `size-9` or `size-4` over `w-9 h-9` or `w-4 h-4`, and `truncate` over `overflow-hidden text-ellipsis whitespace-nowrap`.
   - **Accessible Overlay Titles & Zero Manual `z-index` on Overlays**: Every `Dialog`, `Sheet`, and `Drawer` must include a title (`sr-only` if visually hidden) and rely on the primitive's stacking context rather than arbitrary `z-[999]` overrides.

---

## 2. Optical Typography & Scannable Hierarchy (Apple WWDC + Linear + `Hallmark` Spec)

1. **Size-Specific Tracking & Heading Proximity (`Hallmark` Gates 38, 67, 71)**:
   - **Display / Hero (`32px–64px`)**: Tight negative tracking (`tracking-tight` / `-0.025em` to `-0.04em`) and tight leading (`leading-[1.08]`).
   - **Card Title / Section Header (`16px–20px`)**: `font-semibold` or `font-bold`, `tracking-tight` (`-0.015em`).
   - **Heading Proximity Law (`Gate 71`)**: Every section or group heading (`h2`–`h4`) must have at least **2x more whitespace above it than below it**, anchoring it to the content it introduces.
   - **Ban Split-Color or Single-Italic Words in Headings (`Gates 38i, 38iii`)**: Never color, underline, or italicize a single word inside an otherwise roman heading (a classic AI-slop tell). Set the entire heading in one unified weight and color.
   - **Body Copy (`14px–15px`)**: Neutral tracking (`0`), comfortable leading (`leading-relaxed` / `1.5`), max line width `45ch–68ch` (`Gate 25`).
   - **Restrained Micro-Labels & Strict Sentence Case (`Gate 63 & 67` — Ban Title Case & `UPPERCASE` Abuse)**: Never overuse Title Case (`Capitalizing Every Word`) or `ALL CAPS` (`uppercase` CSS) on headings (`h1`–`h6`), card titles, buttons, table headers, badges, tabs, or policy clauses. Default to **Sentence case** everywhere (capitalizing only the first letter plus genuine proper nouns, brand names, geographical names, and acronyms like `DING OS`, `Trip Express`, `OneUID`, `SHAN`, `QR`, `AI`, `VIP`, `CRM`, `POS`, `GDPR`, `PCI-DSS`). Never chain middle-dot strings (`A · B · C`) or glue `→` arrows to link text.
2. **Single-Font-Family Discipline & Numeric Alignment (`font-sans tabular-nums` — Ban `font-mono` Abuse, `Gate 64`)**:
   - **NEVER mix multiple font families (`font-sans` + `font-mono`) inside UI cards, tables, schedules, maps, badges, or forms.** Mixing monospace typewriter text with sans-serif labels on alternating lines creates visual clutter ("ransom-note typography").
   - Every price, quantity (`x2`), timer (`6m ago`), opening hour (`06:00 – 23:30`), coordinate, percentage, folio line, unit label (`TABLE 04`), and reference code (`REF-981244`) MUST stay in the primary **`font-sans`** typeface and use **`tabular-nums`** (`font-variant-numeric: tabular-nums`) so numbers align vertically to the pixel without changing the font family.
   - Reserve `font-mono` strictly for raw `<pre>`/`<code>` developer snippets or cryptographic/API key strings.
3. **Zero Redundant Data Repetition & Empty Badge Guard**:
   - Never display the same field twice inside a single card (e.g., never use `booking.notes` as both the item title and the note line below it, or repeat a `<Select>` value in a status dot above it).
   - Always guard optional badges with `Boolean(value)` so an empty string `""` never renders a blank colored pill box.
   - Hide pagination controls completely whenever `totalPages <= 1`.

---

## 3. Physical Motion, Tactile Response, Mobile-Native Polish & Worst-Case Stress Testing (`emilkowalski/skill` + `heygen-com/hyperframes`)

1. **The Animation Decision Framework (Frequency Gate + Purpose Gate)**:
   - **Step 1 - Frequency Gate (`Should this animate at all?`)**:
     - **100+ times/day** (tab switches, keyboard shortcuts, command palette toggle, list filtering): **0ms / No animation. Ever.** Never slide between peer tabs (`animation: 'none'`) or animate keyboard-initiated actions (Raycast rule).
     - **Tens of times/day** (button press, hover, row selection, dropdowns): **100-180ms** with strong custom `ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`). **Never use `ease-in`** on UI elements (it starts slow and delays the exact moment the user is watching).
     - **Occasional** (drawers, sheets, modals, toasts): **200-300ms** iOS drawer curve (`cubic-bezier(0.32, 0.72, 0, 1)`) or critically damped spring (`type: "spring", duration: 0.5, bounce: 0.15`). Keep all UI animations under `300ms` for maximum perceived speed.
     - **Rare / First-Time** (onboarding, empty-state celebration): Delight budget lives strictly here.
   - **Step 2 - Purpose Gate**: Name the animation's job in one word before writing it: **`feedback`**, **`spatial consistency`**, **`state indication`**, **`preventing jarring changes`**, or **`explanation`**. If you cannot name it, do not animate.
2. **Explicit Transition Properties, Tactile Press, Blur Bridges & Origin-Aware Popovers (`emil-design-eng`)**:
   - **Never use `transition-all`**: Always list exact properties (`transition-[color,background-color,border-color,transform,opacity]`) and animate **only `transform` and `opacity`** (never `width`, `height`, `top`, `left`, `margin`, or `padding`).
   - **Tactile Press Feedback on Pointer-Down**: Every pressable button/card must respond immediately on press (`active:scale-[0.97] transition-transform duration-150 ease-out`) with `motion-reduce:transition-none motion-reduce:active:scale-100`.
   - **Never Animate from `scale(0)`**: Nothing in the real world appears from zero volume; always enter from `scale(0.95)` + `opacity: 0` (using CSS `@starting-style` or `data-starting-style`).
   - **Origin-Aware Popovers**: Anchor popovers, dropdowns, and menus to their trigger (`origin-top-right` or `var(--radix-popover-content-transform-origin)`). Modals stay `center`.
   - **Skip Delay on Subsequent Tooltips**: Delay the first tooltip to prevent accidental hover, but once open, adjacent tooltips must open in `0ms` (`data-instant`).
   - **Subtle `blur(2px)` Crossfade Bridge**: When crossfading two states (e.g., button icon/label morphing) still feels abrupt, add `filter: blur(2px)` during the `160-200ms` transition to blend the overlap (never exceed `blur(20px)` for Safari GPU safety).
   - **`clip-path: inset(...)` & Velocity Dismissal**: Use `clip-path: inset(0 100% 0 0)` for hardware-accelerated reveals, hold-to-delete overlays (2s linear press, 200ms `ease-out` release), and seamless tab indicators. For swipe-to-dismiss drawers/toasts, dismiss whenever flick velocity `Math.abs(swipeAmount) / elapsedTime > 0.11` even if drag distance is short, and apply rubber-band damping at boundaries instead of hard stops.
   - **Never Update Inherited CSS Variables Per Frame**: Updating `--swipe-amount` on a parent recalculates styles for all children; write `element.style.transform = translateY(...)` directly on the target node (`ref.current.style`, never React `setState` per frame).
3. **Emil Kowalski's UI & Performance Cheatsheets (`ui-cheatsheet.md` & `performance-cheatsheet.md`)**:
   | UI / Performance Problem | Canonical Engineering Fix |
   | :--- | :--- |
   | Old timestamps read `"340 days ago"` | Switch from relative time to an **absolute date** after **7 days** |
   | Numbers jitter when they update | `font-variant-numeric: tabular-nums` (`tabular-nums`) |
   | Large headings look loose | Tighter negative tracking (`-0.02em` to `-0.03em`) |
   | Body text lines feel exhausting | Cap line measure around `65ch` (`max-width: 65ch`) |
   | Avatar or icon squished into an oval | `flex-shrink: 0` (`shrink-0`) on avatars, icons, and fixed boxes |
   | Gradient fade has a hard visible edge | Use an eased multi-stop gradient along an ease curve |
   | Count reads `"1 members"` or `"0 item"` | Pluralize properly with `Intl.PluralRules` or count-specific keys |
   | Long list (`1,000+` rows) scrolls slowly | Virtualize or paginate - render only visible rows |
4. **11 Mobile-Native Web Laws (`emilkowalski/skill/mobile-native` - Separating an App from a Website)**:
   1. **No Sticky Hover on Touch**: Wrap hover rules in `@media (hover: hover) and (pointer: fine)` so tapping a button on iOS/Android never leaves `:hover` stuck.
   2. **Kill the Gray/Blue Tap Flash**: Set `-webkit-tap-highlight-color: transparent` on `html` and provide explicit `:active` press states.
   3. **`100dvh` for App Shells vs. `100svh` for Heroes**: Never use `100vh` on mobile (it overflows behind the URL bar). Use `100dvh` for app shells/drawers (`interactive-widget=resizes-content`) and `100svh` for marketing heroes so scrolling never shifts layout height.
   4. **Zero iOS Input Auto-Zoom (`16px` Minimum, Never `user-scalable=no`)**: Keep `<input>`, `<textarea>`, and `<select>` at `>= 16px` on coarse pointers (`text-base sm:text-sm`). **Never** set `user-scalable=no` or `maximum-scale=1` (an accessibility failure). Pair inputs with exact `inputmode` (`numeric`, `decimal`, `email`, `tel`) and `enterkeyhint` (`send`, `search`, `done`).
   5. **Kill the `300ms` Tap Delay**: Apply `touch-action: manipulation` on `button, a, [role="button"]`.
   6. **Stop Pull-to-Refresh Scroll Hijacking**: Set `overscroll-behavior: none` on `html, body` for app shells and `overscroll-behavior: contain` on inner scrollable sheets/sidebars (never use non-passive `touchmove` + `preventDefault()`).
   7. **Notch & Home-Indicator Safe Areas**: Pair `viewport-fit=cover` with `env(safe-area-inset-top, 0px)` on fixed headers and `env(safe-area-inset-bottom, 0px)` on bottom bars/sheets.
   8. **Prevent Long-Press Label Selection on Controls**: Apply `user-select: none; -webkit-user-select: none; -webkit-touch-callout: none` on buttons, tabs, chips, and drag handles - **never** on `body` (users must be able to copy order refs, emails, and addresses).
   9. **Axis-Locked Carousels & Sheets**: Set `touch-action: pan-y` on horizontal carousels (or use native `scroll-snap-type: x mandatory`), and `touch-action: none` strictly on custom drag surfaces.
   10. **Dual-Scheme Status Bar (`theme-color`)**: Provide `<meta name="theme-color" media="(prefers-color-scheme: light/dark)">` matching the top header background.
   11. **Hardware Truth**: Chrome device emulation never reproduces sticky hover, tap delay, input zoom, or rubber-banding; always verify touch ergonomics against real mobile hardware constraints.
5. **React Native & Expo 120fps UI-Thread Laws (`emilkowalski/skill/animate-expo`)**:
   - **Reanimated 4 Worklets on the UI Runtime**: Never use legacy `PanResponder`, core `Animated` for gestures, or `setState` inside gesture/scroll handlers. Use `Gesture.Pan()` + `useSharedValue` + `useAnimatedStyle` with compiler-safe `.get()` / `.set()` accessors.
   - **Zero Per-Frame Bridge Crossings**: Use `scheduleOnRN` (from `react-native-worklets`, replacing deprecated `runOnJS`) strictly inside `onEnd` or threshold-crossed `useAnimatedReaction`, never per frame inside `onUpdate`.
   - **Apple 2-Parameter Springs**: Use `{ duration: 300, dampingRatio: 0.8, velocity }` for sheets/drags and `{ duration: 400, dampingRatio: 1 }` for non-overshooting settles.
   - **120fps ProMotion & Same-Frame Haptics**: Ensure `CADisableMinimumFrameDurationOnPhone: true` in `app.json` (`8ms` frame budget). Fire `expo-haptics` (`selectionAsync`, `impactAsync`) on the **exact same frame** as the visual detent/commit, at most once per user action, and never as the sole feedback.
6. **MotionSites 5-Layer 3D & Scroll-Driven Stage Architecture (`MotionSites.ai` + `Scroll World`)**:
   - **Layer 1 - Procedural Canvas/WebGL Fibonacci Globe & Spatial Stage**: For public showcase sections, prefer zero-dependency procedural `<canvas>` 3D Fibonacci spheres and great-circle bezier arcs over heavy `.glb` bundles, scaling by `Math.min(window.devicePixelRatio, 2)`.
   - **Layer 2 - Interactive Pointer Inertia & Scroll-Linked Tilt**: Support tactile pointer drag with exponential velocity damping (`0.94`) and GPU-composited transforms.
   - **Layer 3 - Single Focal Visual Guard**: Never stack two dark hero banners or two competing 3D stages inside the same `100svh` viewport.
   - **Layer 4 - Mandatory `IntersectionObserver` Off-Screen Pause & `prefers-reduced-motion` Guard**: Halt `requestAnimationFrame` when off-screen (`0%` idle GPU drain) and render a static frame under `prefers-reduced-motion: reduce`.
   - **Layer 5 - Strict Operational Cockpit Exclusion**: **NEVER** place continuous 3D background animations or scroll-jacking inside operational workspace views.

---

## 4. Brand-Specific Design Languages Across Our 4 Ecosystems

While sharing the geometric chassis above, each product line expresses its own unmistakable aesthetic identity:

| Product Line | Design Language Name | Aesthetic Reference | Signature Visual DNA |
| :--- | :--- | :--- | :--- |
| **1. DING OS** (`getding.io`, `app.getding.io`) | **Tactile Precision** | Braun (Dieter Rams) + Linear + Teenage Engineering | • **Palette**: Crisp Slate (`#0f172a` / `#f8fafc`) + Signal Amber (`#f59e0b`) & Operational Emerald (`#10b981`).<br>• **Character**: High-density operational cockpit, uniform `1px` hairline cards, flat divider sections (zero nested boxes, zero left-border stripes), `h-9` tactile buttons, dual-modality acoustic + visual alerts. |
| **2. Trip Express** (`trip.express/web`, `mobile`) | **Kinetic Horizon** | Airbnb Luxe + Stripe + Apple Maps | • **Palette**: Clean Daylight Canvas + Trust Blue/Indigo & Warm Coral/Amber accents.<br>• **Character**: Effortless discovery cards (`16:10` / `4:3` imagery with subtle inner ring), frictionless multi-currency checkout, Stripe-grade B2B/OTA admin tables (`h-9` controls, zero nested cards). |
| **3. OneUID** (`uid.one/uid-web`, `uid-app`) | **Cryptographic Minimal** | Vercel Geist + Apple Passkeys + Ledger | • **Palette**: Stark Monochrome (`#010102` canvas, `#171717` surface, `1px` `white/10` hairlines) + single security accent.<br>• **Character**: Zero-knowledge vault clarity, monospace cryptographic tokens (`Geist Mono`), instant passkey/QR challenge feedback, zero decorative fluff. |
| **4. SHAN** (`shan.estate`, `shan.club`, `shan.voyage`, `shan.one`, `shan.academy`) | **Quiet Architectural Luxury** | Aman Resorts + Hermès + Bottega Veneta | • **Palette**: Warm Stone / Alabaster (`#f6f4f0`) & Deep Espresso/Obsidian (`#0c0b09`) + Muted Champagne Gold (`#c5a572`).<br>• **Character**: Editorial serif headlines (`Cormorant Garamond` / negative tracking) paired with crisp geometric sans body, generous gallery whitespace, refined `rounded-lg`/`rounded-xl` geometry, never loud neon or generic SaaS tropes. |

---

## 5. Editorial Architecture & Workflow Diagrams (`Archify` + `Diagram Design`)

Whenever rendering system architecture diagrams, DNS/edge routing flows, or settlement pipelines in Help Centers, Docs, or Artifacts:
1. **Cognitive Node Budget (`Max 5-7 Primary Nodes`)**: Never draw "spaghetti spiderwebs." Group components into at most **3 directional swimlanes/tiers** (e.g., `1. Edge Ingress` -> `2. Core Engine` -> `3. Folio Settlement`).
2. **Verb-Labeled Edges**: Every arrow/connector must state the exact protocol or action (`POST /v1/email/ingest`, `CNAME Edge Proxy`, `880Hz + Visual Banner`).
3. **Editorial Monochrome + Single Signal Accent**: Style nodes in neutral slate (`#0f172a` / `#f8fafc`) and highlight only the active critical path in brand accent (`#f59e0b` Amber or `#10b981` Emerald).

---

## 6. Anthropic `frontend-design` Subject-Matter Grounding & Anti-Slop Calibration (`anthropics/skills/frontend-design`)

1. **Ground Every Design in the Real Subject Matter & Vernacular**:
   - Before writing JSX/CSS, anchor the visual hierarchy to the product's actual operational domain, physical environment, and user job (e.g., a sunlit pickleball court counter, a midnight front-desk reception terminal, or a private aviation charter dossier).
   - **Two-Pass Design Discipline**:
     1. **Pass A (Design Plan)**: Define the 4-6 hex palette tokens, typeface roles, 1-sentence layout concept + ASCII wireframe, and the single memorable signature element.
     2. **Pass B (Anti-Default Self-Critique & Chanel's Rule)**: Review the plan before coding - if any section looks like a generic template that could belong to any random SaaS app, replace it with a domain-specific interaction. Follow **Chanel's Rule**: *before leaving the house, look in the mirror and remove one accessory* (spend your visual boldness in one place and keep everything around it quiet and disciplined).
2. **Calibration Against the 5 Default AI Look Traps**:
   Never unconsciously drift into the 5 default visual clusters that LLMs generate when unguided unless the brand charter explicitly specifies it:
   - **Trap 1**: Warm cream `#F4F1EA` background + high-contrast serif + `#D97757` terracotta/clay accent (Claude's own UI accent - an immediate AI-generated tell on third-party products).
   - **Trap 2**: Generic near-black background with a single random acid-green or vermilion neon glow.
   - **Trap 3**: Unrequested newspaper broadsheet grids with `0px` radius and dense multi-column rules on operational tools.
   - **Trap 4**: The "SaaS-card kit" where every piece of content is chopped into identical rounded cards with identical `rgba(0,0,0,0.1)` shadows and decorative gradient washes.
   - **Trap 5**: Template chrome tells: tracked-out `ALL-CAPS` eyebrow labels above every heading, metadata joined by middle dots (`A · B · C`), `WORD - fragment` labels, `font-mono` used as decorative costume on small labels, and `→` appended to every button/link.
3. **Words Are Design Content, Not Decoration**:
   - **Write from the end-user's mental model**: A merchant manages `"Notifications"` or `"Mailboxes"`, not `"Webhook payload config"`.
   - **Verb-Toast Symmetry**: An action keeps the exact same verb through the entire flow - a button labeled `"Publish"` triggers a toast that says `"Published"` (never `"Submit"` -> `"Operation successful"`).
   - **Failure & Emptiness as Direction**: Error messages never apologize or blame the user; they state what happened and the immediate action to fix it. Empty states are first-class features with context and a single primary CTA.

---

## 7. Garry Tan `gstack` 7-Pass `0-10` Design Review & Fix-to-10 Protocol (`garrytan/gstack` `/plan-design-review` & `/design-review`)

Whenever planning, reviewing, or auditing any UI across our projects (`ding`, `trip`, `shan`, `uid`), the `DESIGNER` runs **Garry Tan's 7-Pass `0-10` Design Review** and iteratively fixes every gap until every pass reaches **`10/10`**.

### Step 0: Surface Mode Classifier (Classify Before Judging a Pixel)
Name the surface's primary mode before applying rules (for hybrid pages, classify per section):
- **`PERSUADE`** (Marketing, Landing, Pricing, Storefront Hero) -> Visitor decides and acts. Apply *Landing Page Rules* (full-bleed composition, brand-first hierarchy, 1 primary CTA, proof beside every claim, real risk reversal).
- **`OPERATE`** (Workspaces: Counter, Inbox, Catalog, Units, Tasks, Finance, Settings) -> User finishes a task fast. Apply *App UI Rules* (calm surface hierarchy, dense scannability, minimal chrome, utility copy, cards only when the card IS the interaction).
- **`READ`** (Help Center, Docs, Legal Policies, Changelogs) -> User comprehends information. Apply *Read Rules* (`65-75ch` measure, single reading column, headings `2x` closer to what follows than what precedes, instant wayfinding, zero CTA theater).
- **`EXPERIENCE`** (SHAN Luxury Showcases, 3D Seatmaps, Interactive Galleries) -> The artifact owns the first viewport; chrome gets out of the way.

### The 7 Scored Design Passes (`0-10` Each -> Fix Until `10/10`)
1. **Pass 1 - Information Architecture & Krug's 6-Question Trunk Test (`0-10`)**:
   - Does the screen define unmistakably what the eye sees **1st, 2nd, and 3rd**?
   - **Krug's Trunk Test (Must Pass All 6 in `< 3s`)**: Dropped onto this screen cold, can the user immediately answer: *(1) What product/venue is this? (2) What page/view am I on? (3) What are the major sections? (4) What is my #1 primary action here? (5) Where am I in the hierarchy? (6) How do I search or switch views?*
2. **Pass 2 - Interaction State Coverage (`0-10`)**:
   - Every UI feature must define all 5 visual states in user-facing terms:
     `FEATURE | LOADING (layout-matched skeleton) | EMPTY (warm context + 1 primary CTA) | ERROR (specific cause + 1-tap fix) | SUCCESS (instant optimistic state) | PARTIAL (graceful missing optional fields)`.
3. **Pass 3 - User Journey, Emotional Arc & Goodwill Reservoir (`0-10`)**:
   - Evaluate the **5-second visceral**, **5-minute behavioral** (`< 2 taps` rush-hour execution), and **5-year reflective** trust.
   - **Goodwill Reservoir (`70/100` Baseline)**: Eliminate goodwill drains (hidden pricing/fees `-15`, forced popups/tours `-15`, strict input format punishment `-10`, multi-row button clutter `-10`, ambiguous button labels `-5`) and maximize fills (obvious top task `+10`, 1-tap smart defaults/saved addresses `+10`, instant optimistic feedback `+5`).
4. **Pass 4 - AI Slop Risk, 7 Hard Rejections & 7 Litmus Checks (`0-10`)**:
   - **7 Hard Rejections (Any hit caps score `< 8/10` until eliminated)**:
     1. Generic SaaS 3-column icon-card grid as first impression.
     2. Beautiful imagery with weak or hidden brand identity.
     3. Strong headline with no clear primary action.
     4. Busy imagery or blurred aurora blobs behind text.
     5. Multiple sections repeating the exact same mood statement.
     6. Carousel with no narrative or functional purpose.
     7. App UI made of stacked/nested cards instead of clean spatial layout.
   - **7 Litmus Checks (`YES/NO` Verification)**:
     1. Is the brand/product unmistakable in the first screen?
     2. Is there one strong visual anchor?
     3. Is the page understandable by scanning headings only?
     4. Does each section have strictly one job?
     5. Are cards actually necessary (earned existence)?
     6. Does motion improve hierarchy or spatial continuity?
     7. Would the design still feel premium with all decorative shadows removed?
   - **5 Hand-Checked Craft Reflexes (No Automated Detector Catches These)**:
     1. **Themed Browser Surfaces**: Theme `::selection`, caret color, scrollbars, `:focus-visible` rings, underline offset, and `tabular-nums` from the brand palette.
     2. **One Authored Motion Moment**: Never put the same fade-up entrance on every section; content never hides behind animation timing.
     3. **Offset Depth**: Shadows use subtle vertical offset + soft blur (`shadow-2xs`), never zero-offset colored neon halos.
     4. **Hue-Tinted Secondary Text**: Secondary text on a colored surface is tinted from that hue, never muddy mid-gray.
     5. **Heading Proximity**: More whitespace above a heading (`>= 2x`) than below it.
5. **Pass 5 - Design System & Token Alignment (`0-10`)**:
   - 100% adherence to `design-language/SKILL.md` tokens, `@/components/ui/*` primitives, Concentric Radii, `h-7..h-10` control heights, and `slate` neutral scale.
6. **Pass 6 - Responsive Ergonomics, Native-Mobile & Accessibility (`0-10`)**:
   - Intentional layout per viewport (`375px` Mobile, `768px` Tablet, `1440px` Desktop), `>= 44px` touch hit targets, keyboard navigation, ARIA labels on icon buttons, `>= 4.5:1` contrast, and Emil's 11 `mobile-native` rules.
7. **Pass 7 - Unresolved Design Decisions & `break-ui` Adversarial Stress Test (`0-10`)**:
   - Run **Emil Kowalski's `break-ui` Worst-Case Data Stress Test** against every component before sign-off:
     - **Long Compound Names**: e.g., `"Aleksandra Wiśniewska-Kowalczyk"` (`min-w-0` on flex/grid text columns so trailing `•••` actions or prices are never pushed off-screen).
     - **Unbreakable Emails & URLs**: e.g., `bartholomew.fitzgerald@northwind-industries-holdings.example.com` (`overflow-wrap: anywhere` or stacked horizontal rows, never `grid-cols-3` truncation).
     - **1-Letter & Diacritic Names**: `"Jo"`, Vietnamese `"Nguyễn Thị Phương Thảo"`, Arabic RTL (`dir="rtl"`), ensuring `line-height` never clips diacritics and avatar initials handle single-word or grapheme-cluster names cleanly.
     - **Boundary Counts**: `0` items (warm empty state, suppress `0` tab counter badges), `1` item (`Intl.PluralRules` - never `"1 members"`), and `1,284+` items (`tabular-nums`, formatted numbers, pagination/virtualization).

---

## 8. Pre-Ship UI Design Audit Checklist (`| Before | After | Why |` Table Format)

When reviewing UI polish, always present findings in a `| Before | After | Why |` Markdown table (`emil-design-eng`) and verify every modified component against this checklist:

| Check | Standard |
| :--- | :--- |
| **5 Hard Design Veto Gates** | (1) Single Primary Nav (`Logo \| View ▾`, zero stacked navs/orphan footers), (2) `375px` 2-Tier Mobile Toolbar Budget, (3) 1-Primary CTA Hierarchy, (4) Cross-Route App Shell Consistency (`w-full px-3.5 sm:px-6`), (5) Dual-Viewport `375px` & `1440px` Gate. |
| **gstack 7-Pass `0-10` Score** | Every pass (`1. IA & Trunk Test`, `2. 5 Interaction States`, `3. Journey & Goodwill >= 70`, `4. Zero AI Slop`, `5. Token Alignment`, `6. Responsive/A11y`, `7. break-ui Worst-Case Data`) scores **`10/10`**. |
| **Concentric Radii** | Card is `rounded-2xl` (`p-4`/`p-5`), inner buttons/inputs are `rounded-xl` or `rounded-lg`. |
| **Button Proportion & Variants** | Buttons use `h-7` / `h-8` / `h-9` / `h-10` and built-in `<Button variant="...">` - zero `py-5` bloated buttons or muddy `bg-slate-200` outline fills. |
| **Surface, Borders & 5% Accent** | Uniform `1px` hairline border (`border-slate-200/90 dark:border-slate-800`), zero `border-l-*` stripes, zero aurora/glow blobs, accent `amber-500` `<= 5%-8%` of viewport. |
| **Single Focal Visual** | Max **1** dark-overlay hero/photo card per viewport; never stack two dark photo cards vertically. |
| **Zero Nested Cards & Unboxed Footer Disclosures** | No boxed cards/callouts/notes inside boxed cards; never wrap corporate legal disclosures, tax IDs (`0402217820`), or trust badges in boxed cards (`bg-[#161618] rounded-xl p-4`) inside footers - render them as unboxed muted fine print (`text-[11px]`) in the bottom copyright bar. On `< lg` mobile, `<aside>` has zero outer card box (`lg:rounded-2xl lg:border lg:bg-white`). |
| **Sentence Case & Anti-Title-Case / Anti-UPPERCASE** | Default to **Sentence case** across all headings, card titles, buttons, tabs, table headers, and policy clauses; never overuse Title Case or `ALL CAPS` (`uppercase` CSS) except on genuine acronyms/codes (`AI`, `QR`, `VIP`, `USD`, `VND`) and short 1-2 word `10px-11px` structural footer column titles. |
| **Anti-Badge Inflation & Zero-Box Tab/Kanban Counters** | **NEVER** wrap counts inside Segmented Controls (`<Tabs>`), Sidebar Nav Items, Mobile Section Drawers, or Kanban Column Headers in background pill/box containers - render tab/column counters as **unboxed inline tabular numerals** (`text-[11px] font-medium tabular-nums text-slate-400 dark:text-slate-500`) and **completely suppress zero counts** (`0`, `'0'`, `'$0'`, `'$0.00'`). Reserve `<Badge>` (`h-5 px-1.5 rounded-md text-[11px] font-medium`) strictly for **1 primary semantic state** per row/card (`Occupied`, `Synced`, `Paid`, `Pending`). |
| **Single-Font-Family & Heading Discipline** | Zero `font-mono` on UI labels/prices/times (`font-sans tabular-nums` only); zero split-color or single-italic words inside headings; `top space >= 2x bottom space` on headings. |
| **Strict CSS `dark:` Pairing & Layout Classes** | Never use runtime JS `isDark ? ... : ...` ternaries for Tailwind colors; prefer `flex flex-col gap-*` over `space-y-*` and `size-*` over `w-* h-*`. |
| **Pure Operational Utility** | Zero marketing strips, zero read-only `Locked`/`Protected` explainer cards, zero simulation toggles, zero fake scarcity meters, and zero redundant sub-bars in workspace views. |
| **Zero Truncation (`...`) & `break-ui` Resilience** | `min-w-0` on flex/grid text columns, `shrink-0` on avatars/actions, stacked horizontal rows (`divide-y`) for URLs/emails, absolute dates after 7 days, and zero `...` clipping on labels. |
| **Motion, Press & Mobile-Native** | Explicit `transition-[...]` (never `transition-all`), under `250ms` `ease-out` (never `ease-in`), `active:scale-[0.97]`, `scale(0.95)` entry (never `scale(0)`), `@media (hover: hover) and (pointer: fine)`, `16px` mobile inputs, `100dvh`/`100svh`, and `0ms` on high-frequency tab/keyboard switches. |

