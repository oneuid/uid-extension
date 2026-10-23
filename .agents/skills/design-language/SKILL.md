---
name: design-language
description: Architectural Design Language, Geometric Proportion Laws (Concentric Radii, Control Height Scale, Surface Ladder), Optical Typography, Physical Motion & Tactile Feedback, Mobile-Native Platform Polish, and Brand-Specific Visual DNA (Tactile Precision for DING OS, Kinetic Horizon for Trip Express, Cryptographic Minimal for OneUID, Quiet Architectural Luxury for SHAN). Distilled from VoltAgent/awesome-design-md (Linear, Vercel, Stripe), Emil Kowalski's Design Engineering (emil-design-eng, apple-design, mobile-native, animate-expo), Jakub Krehel's Interface Craft, and Anthropic's frontend-design. Use whenever designing, building, auditing, or polishing UI across web and mobile repositories.
---

# Ecosystem Design Language & Interface Craft (`design-language`)

Distilled from **VoltAgent `DESIGN.md`** (Linear, Vercel, Stripe), **Emil Kowalski's Design Engineering** (`emil-design-eng`, `apple-design`, `mobile-native`, `animate-expo`), **Jakub Krehel's Interface Craft**, and **Anthropic's `frontend-design`**.

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

### C. Four-Step Surface Ladder & Hairline Borders (Depth Without Heavy Shadows)
Following Linear and Vercel's surface engineering, hierarchy is achieved via **surface luminance steps** and **1px hairline borders**, NOT heavy drop shadows (`shadow-xl`, `shadow-2xl`) or thick 4-sided colored borders (`border-2 border-emerald-500`):
1. **Level 0 — Canvas**: Page background (`bg-slate-50` light / `bg-slate-950` or `#010102` dark).
2. **Level 1 — Primary Surface**: Card / Panel (`bg-white` light / `bg-slate-900` dark) with `1px` hairline border (`border-slate-200/90` light / `border-slate-800` dark) and at most `shadow-xs`.
3. **Level 2 — Elevated / Interactive Surface**: Hovered row, active tab pill, or subtle callout (`bg-slate-100/80` light / `bg-slate-800/60` dark).
4. **Level 3 — Translucent Floating Chrome**: Sticky headers, drawers, command palettes (`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl`).
- **Status Indication on Cards**: To indicate card status (e.g., `Received`, `Preparing`, `Ready`), use a **3px–4px left accent bar** (`border-s-4 border-s-emerald-500`) paired with a neutral 1px outer border — NEVER wrap the entire card in a thick 2px neon border.

---

## 2. Optical Typography & Scannable Hierarchy (Apple WWDC + Linear Spec)

1. **Size-Specific Tracking (Letter-Spacing)**:
   - **Display / Hero (`32px–64px`)**: Tight negative tracking (`tracking-tight` / `-0.025em` to `-0.04em`) and tight leading (`leading-[1.08]`).
   - **Card Title / Section Header (`16px–20px`)**: `font-semibold` or `font-bold`, `tracking-tight` (`-0.015em`).
   - **Body Copy (`14px–15px`)**: Neutral tracking (`0`), comfortable leading (`leading-relaxed` / `1.5`), max line width `< 68ch`.
   - **Section Eyebrow / Group Header (`10px–11px`)**: Uppercase `font-semibold tracking-[0.12em] text-slate-400`.
2. **Numeric & Financial Discipline (`tabular-nums`)**:
   - Every price, quantity (`x2`), timer (`6m ago`), percentage, folio line, and reference code (`REF-981244`) MUST use `tabular-nums` (`font-mono` where appropriate) so columns align vertically to the pixel.
3. **Zero Redundant Data Repetition**:
   - Never display the same field twice inside a single card (e.g., never use `booking.notes` as both the item title and the quoted note box below it).
   - Hide pagination controls completely whenever `totalPages <= 1`.

---

## 3. Physical Motion, Tactile Response & Mobile-Native Polish (Emil Kowalski)

1. **The Animation Frequency Gate**:
   - **100+ times/day** (tab switches, keyboard shortcuts, list filtering): **0ms / No animation**. Never slide between peer tabs.
   - **Tens of times/day** (button press, hover, dropdowns): **100–180ms** with strong custom `ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`). Never use `ease-in` on UI elements.
   - **Occasional** (drawers, sheets, modals): **200–300ms** drawer curve (`cubic-bezier(0.32, 0.72, 0, 1)`) or critically damped spring (`dampingRatio: 1, duration: 300`).
2. **Tactile Press Feedback & Entry Physics**:
   - Every pressable button/card must respond on pointer-down (`active:scale-[0.98] transition-transform duration-150 ease-out`).
   - Never animate from `scale(0)`. Always enter from `scale(0.96)` + `opacity: 0`.
   - Anchor popovers and menus to their trigger (`origin-top-right`, `var(--radix-popover-content-transform-origin)`).
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
| **1. DING OS** (`getding.io`, `app.getding.io`) | **Tactile Precision** | Braun (Dieter Rams) + Linear + Teenage Engineering | • **Palette**: Crisp Slate (`#0f172a` / `#f8fafc`) + Signal Amber (`#f59e0b`) & Operational Emerald (`#10b981`).<br>• **Character**: High-density operational cockpit, borderless grouped navigation with `3px` left active indicator, `border-s-4` status tickets, `h-9` tactile buttons, dual-modality acoustic + visual alerts. |
| **2. Trip Express** (`trip.express/web`, `mobile`, `enterprises`) | **Kinetic Horizon** | Airbnb Luxe + Stripe + Apple Maps | • **Palette**: Clean Daylight Canvas + Trust Blue/Indigo & Warm Coral/Amber accents.<br>• **Character**: Effortless discovery cards (`16:10` / `4:3` imagery with subtle inner ring), frictionless multi-currency checkout, Stripe-grade B2B/OTA admin tables (`h-9` controls, zero nested cards). |
| **3. OneUID** (`uid.one/uid-web`, `uid-app`) | **Cryptographic Minimal** | Vercel Geist + Apple Passkeys + Ledger | • **Palette**:Stark Monochrome (`#010102` canvas, `#171717` surface, `1px` `white/10` hairlines) + single security accent.<br>• **Character**: Zero-knowledge vault clarity, monospace cryptographic tokens (`Geist Mono`), instant passkey/QR challenge feedback, zero decorative fluff. |
| **4. SHAN** (`shan.estate`, `shan.club`, `shan.voyage`, `shan.one`, `shan.academy`) | **Quiet Architectural Luxury** | Aman Resorts + Hermès + Bottega Veneta | • **Palette**: Warm Stone / Alabaster (`#f6f4f0`) & Deep Espresso/Obsidian (`#0c0b09`) + Muted Champagne Gold (`#c5a572`).<br>• **Character**: Editorial serif headlines (`Cormorant Garamond` / negative tracking) paired with crisp geometric sans body, generous gallery whitespace, refined `rounded-lg`/`rounded-xl` geometry, never loud neon or generic SaaS tropes. |

---

## 5. Pre-Ship UI Design Audit Checklist

Before completing any UI task, verify every modified component against this table:

| Check | Standard |
| :--- | :--- |
| **Concentric Radii** | Card is `rounded-2xl` (`p-4`/`p-5`), inner buttons/inputs are `rounded-xl` or `rounded-lg`. |
| **Button Proportion** | Buttons use `h-7` / `h-8` / `h-9` / `h-10` — zero `py-5` or `py-6` bloated buttons. |
| **Surface & Borders** | `1px` hairline border (`border-slate-200/90 dark:border-slate-800`), status via `border-s-4`, zero `border-2` full-card neon frames. |
| **Zero Nested Cards** | No boxed cards inside boxed cards; inner groups separated by `border-t` or whitespace. |
| **Pagination Hygiene** | Pagination component returns `null` when `totalPages <= 1`. |
| **Numeric Alignment** | All prices, counts, timers, and codes have `tabular-nums`. |
| **Motion & Press** | Under `250ms` `ease-out`, `active:scale-[0.98]`, no animation on high-frequency tab/keyboard switches. |
