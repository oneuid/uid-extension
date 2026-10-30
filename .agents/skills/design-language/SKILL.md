---
name: design-language
description: Architectural Design Language, Geometric Proportion Laws (Concentric Radii, Control Height Scale, Surface Ladder), Optical Typography, Viewport Stage & Anti-Slop Laws (Hallmark, Frontend Slides, Scroll World), Physical Motion & Tactile Feedback, Editorial Diagram Standards (Archify, Diagram Design), and Brand-Specific Visual DNA (Tactile Precision for DING OS, Kinetic Horizon for Trip Express, Cryptographic Minimal for OneUID, Quiet Architectural Luxury for SHAN). Use whenever designing, building, auditing, or polishing UI across web and mobile repositories.
---

# Ecosystem Design Language & Interface Craft (`design-language`)

Distilled from **VoltAgent `DESIGN.md`** (Linear, Vercel, Stripe), **Emil Kowalski's Design Engineering** (`emil-design-eng`, `apple-design`, `mobile-native`, `animate-expo`), **Jakub Krehel's Interface Craft** (`jakubkrehel/skills`), **Hallmark** (`Nutlope/hallmark`), **Frontend Slides** (`zarazhangrui/frontend-slides`), **Scroll World** (`oso95/scroll-world`), **Archify & Diagram Design** (`tt-a1i/archify`, `cathrynlavery/diagram-design`), and **Anthropic's `frontend-design`**.

Just as automotive and architectural houses enforce a strict **Design Language** (chassis proportions, beltline ratios, material finish) so every vehicle or building is unmistakably part of the same lineage, every screen in our ecosystem must obey deterministic **Geometric Proportion Laws** paired with each brand's **Visual DNA**.

---

## 1. Universal Geometric Proportion Laws (The "Chassis & Beltline" Math)

### A. Law of Concentric Radii (`R_outer = R_inner + Padding`)
Nested rounded corners must share the same curvature center. Never mix arbitrary radii inside a card:
- **Outer Card / Sheet / Modal**: `rounded-2xl` (`16px`) with `p-4` (`16px`) or `p-5` (`20px`).
- **Inner Interactive Control (Button, Input, Select) or Sub-Banner**: `rounded-xl` (`12px`) or `rounded-lg` (`8px`).
- **Inline Status Badge / Tag / Chip**: `rounded-md` (`6px`) for technical/operational density, or `rounded-full` for pill counters.
- **Forbidden**: Never put a `rounded-3xl` (`24px`) card around a `py-6 rounded-2xl` button — it destroys optical balance and looks inflated.

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

## 3. Physical Motion, Tactile Response & Mobile-Native Polish (`emilkowalski/skills` + `heygen-com/hyperframes`)

1. **The Animation Frequency Gate & Deterministic Frame Choreography**:
   - **100+ times/day** (tab switches, keyboard shortcuts, command palette toggle, list filtering): **0ms / No animation. Ever.** Never slide between peer tabs or animate keyboard-initiated actions.
   - **Tens of times/day** (button press, hover, dropdowns): **100–180ms** with strong custom `ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`). **Never use `ease-in`** on UI elements (it delays initial movement and feels sluggish).
   - **Occasional** (drawers, sheets, modals): **200–300ms** drawer curve (`cubic-bezier(0.32, 0.72, 0, 1)`) or critically damped spring (`type: "spring", duration: 0.5, bounce: 0.15`). Keep all UI animations under `300ms` for maximum perceived performance.
2. **Explicit Transition Properties, Tactile Press & Origin-Aware Popovers**:
   - **Never use `transition-all`** (`Hallmark` Gate 10a & `emil-design-eng`): Always specify exact properties (`transition-[color,background-color,border-color,transform,opacity]`) and never animate layout geometry (`width`, `height`, `top`, `left`).
   - **Mandatory Reduced-Motion Fallback**: Include `motion-reduce:transition-none motion-reduce:active:scale-100` on interactive controls.
   - **Tactile Press Feedback**: Every pressable button/card must respond on pointer-down (`active:scale-[0.98] transition-transform duration-150 ease-out`).
   - **Never Animate from `scale(0)`**: Nothing in the physical world appears from zero volume; always enter from `scale(0.95)` + `opacity: 0`.
   - **Origin-Aware Popovers**: Anchor popovers, dropdowns, and menus to their trigger (`origin-top-right` or `var(--radix-popover-content-transform-origin)`), never `center`.
3. **Mobile-Native Web & Expo Rules**:
   - **No Sticky Hover on Touch**: Gate hover transforms behind `@media (hover: hover) and (pointer: fine)`.
   - **No iOS Input Auto-Zoom**: Form inputs on mobile must maintain `16px` (`text-base sm:text-sm`) or proper viewport handling so iOS Safari never zooms and crops the layout.
   - **Viewport & Safe Areas**: Use `100dvh` for app shells/drawers and `100svh` for hero sections; respect `env(safe-area-inset-bottom)` on bottom bars and sheets.
   - **Expo / React Native**: Run all gesture animations on the UI thread via `react-native-reanimated` worklets; animate only `transform` and `opacity`.

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
1. **Cognitive Node Budget (`Max 5–7 Primary Nodes`)**: Never draw "spaghetti spiderwebs." Group components into at most **3 directional swimlanes/tiers** (e.g., `1. Edge Ingress` → `2. Core Engine` → `3. Folio Settlement`).
2. **Verb-Labeled Edges**: Every arrow/connector must state the exact protocol or action (`POST /v1/email/ingest`, `CNAME Edge Proxy`, `880Hz + Visual Banner`).
3. **Editorial Monochrome + Single Signal Accent**: Style nodes in neutral slate (`#0f172a` / `#f8fafc`) and highlight only the active critical path in brand accent (`#f59e0b` Amber or `#10b981` Emerald).

---

## 6. Pre-Ship UI Design Audit Checklist (`| Before | After | Why |` Table Format)

When reviewing UI polish, always present findings in a `| Before | After | Why |` Markdown table (`emil-design-eng`) and verify every modified component against this checklist:

| Check | Standard |
| :--- | :--- |
| **Concentric Radii** | Card is `rounded-2xl` (`p-4`/`p-5`), inner buttons/inputs are `rounded-xl` or `rounded-lg`. |
| **Button Proportion & Variants** | Buttons use `h-7` / `h-8` / `h-9` / `h-10` and built-in `<Button variant="...">` — zero `py-5` bloated buttons or muddy `bg-slate-200` outline fills. |
| **Surface, Borders & 5% Accent** | Uniform `1px` hairline border (`border-slate-200/90 dark:border-slate-800`), zero `border-l-*` stripes, zero aurora/glow blobs, accent `amber-500` `<= 5%–8%` of viewport. |
| **Single Focal Visual** | Max **1** dark-overlay hero/photo card per viewport; never stack two dark photo cards vertically. |
| **Zero Nested Cards & Unboxed Footer Disclosures** | No boxed cards/callouts/notes inside boxed cards; never wrap corporate legal disclosures, tax IDs (`0402217820`), or trust badges in boxed cards (`bg-[#161618] rounded-xl p-4`) inside footers — render them as unboxed muted fine print (`text-[11px]`) in the bottom copyright bar. On `< lg` mobile, `<aside>` has zero outer card box (`lg:rounded-2xl lg:border lg:bg-white`). |
| **Sentence Case & Anti-Title-Case / Anti-UPPERCASE** | Default to **Sentence case** across all headings, card titles, buttons, tabs, table headers, and policy stores; never overuse Title Case or `ALL CAPS` (`uppercase` CSS) except on genuine acronyms/codes (`AI`, `QR`, `VIP`, `USD`, `VND`) and short 1–2 word `10px–11px` structural footer column titles. |
| **Anti-Badge Inflation & Zero-Box Tab/Kanban Counters** | **NEVER** wrap counts inside Segmented Controls (`<Tabs>`), Sidebar Nav Items, Mobile Section Drawers, or Kanban Column Headers in background pill/box containers (`bg-slate-900 rounded-full` or `bg-slate-100 rounded-md`) — this creates "pill-in-a-button" nested surface bloat. Always render tab/column counters as **unboxed inline tabular numerals** (`text-[11px] font-medium tabular-nums text-slate-400 dark:text-slate-500`) and **completely suppress zero counts** (`0`, `'0'`, `'$0'`, `'$0.00'`). Furthermore, **NEVER** wrap Unit codes (`SPA ROOM 01`, `TABLE 04`), References (`REF-552199`), Channels (`Direct Agency`), Categories (`DINING`), or Account Classes (`Asset`, `Revenue`) inside bordered pill/tag boxes when they already sit in their own dedicated table column or key-value row. Reserve `<Badge>` (`h-5 px-1.5 rounded-md text-[11px] font-medium`) strictly for **1 primary semantic state** per row/card (`Occupied`, `Synced`, `Paid`, `Pending`). Back/Forward (`< >`) window history buttons must **ONLY** render inside native desktop shells (`isDesktopApp()`) and **NEVER** on web browsers. |
| **Single-Font-Family & Heading Discipline** | Zero `font-mono` on UI labels/prices/times (`font-sans tabular-nums` only); zero split-color or single-italic words inside headings; `top space >= 2x bottom space` on headings. |
| **Strict CSS `dark:` Pairing & Layout Classes** | Never use runtime JS `isDark ? ... : ...` ternaries for Tailwind colors; prefer `flex flex-col gap-*` over `space-y-*` and `size-*` over `w-* h-*`. |
| **Pagination Hygiene** | Pagination component returns `null` when `totalPages <= 1`. |
| **Pure Operational Utility** | Zero marketing strips, zero read-only `Locked`/`Protected` explainer cards, zero simulation toggles (`Surplus`/`Subsidized`, `Test Lock`), zero fake scarcity meters (`94% Claimed`), and zero redundant sub-bars in workspace views. |
| **Zero Truncation (`...`) & Horizontal Row Lists for URLs/Emails** | **NEVER** use `truncate` (`...`), `line-clamp-1`, or mid-word `break-all` (`getdin` / `g.io`) on UI labels, profile headers, integration descriptions, or endpoint URLs/emails. When displaying URLs, webhooks, or email endpoints with action buttons (`Copy`), **NEVER** cram 3 long strings side-by-side in a `grid-cols-3` row; always use **stacked horizontal rows (`divide-y`)** so every URL/email sits cleanly on a single unbroken line. |
| **Motion & Press** | Explicit `transition-[...]` (never `transition-all`), under `250ms` `ease-out`, `active:scale-[0.98]`, `motion-reduce` fallback, 0ms on high-frequency tab/keyboard switches. |

