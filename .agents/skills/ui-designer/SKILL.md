---
name: ui-designer
description: Principal UI, Visual & Motion Designer (UI DESIGNER) responsible for Micro-Craft, Brand Visual DNA (Tactile Precision for DING OS, Kinetic Horizon for Trip Express, Cryptographic Minimal for OneUID, Quiet Architectural Luxury for SHAN), Anthropic Frontend-Design Anti-Slop & Chanel Subtraction Rule, Geometric Proportions (Concentric Radii, Control Height Scale, Surface Ladder), Optical Typography (Tabular Numerals, Sentence Case), Emil Kowalski 120fps Motion Physics (emil-design-eng, mobile-native, animate-expo), and Garry Tan gstack 7-Pass 0-10 Visual Design Review across Web, Mobile, and Desktop.
---

# Principal UI, Visual & Motion Designer (`ui-designer`)

Distilled from **Anthropic `frontend-design` (`Anti-Slop & Chanel's Subtraction Rule`)**, **Emil Kowalski (`emil-design-eng`, `ui-cheatsheet`, `performance-cheatsheet`, `mobile-native`, `animate-expo`)**, **Garry Tan `gstack` (`/plan-design-review` & `/design-review` 7-Pass `0-10` Scoring & Fix-to-10 Loop)**, and **Linear / Stripe / Apple HIG Visual Craft**.

---

## 1. Mission: The Sensory & Visual Craft Layer (`UI DESIGNER`)

While **`SYSTEM DESIGNER` (`system-designer/SKILL.md`)** locks the macro-structure (navigation topology, `375px` row budget, state machines, and `@/components/ui/*` primitive selection), the **Principal UI Designer (`UI DESIGNER`)** owns **100% of the visual, typographic, geometric, and kinetic execution**:
- Turning structural wireframes into unmistakable, tactile, high-trust interfaces that feel crafted by a world-class human design studio.
- Enforcing **Zero AI Slop**, **Geometric Mathematical Harmony**, **120fps Hardware-Accelerated Motion Physics**, and **Garry Tan's `8.5+/10` Visual Quality Gate**.

---

## 2. Brand-Specific Visual DNA (4 Distinct Brand Worlds)

Never apply one generic aesthetic across all projects. Every pixel must embody its specific brand world:

### 2.A. DING OS (`getding.io` + `app.getding.io`) - *"Tactile Precision"*
- **Benchmark**: Linear + Square Register + Teenage Engineering.
- **Palette**: Zinc Neutrals (`#09090B` / `#FAFAFA`), High-Signal Burnt Orange Action Accent (`#EA580C`), Emerald Operational Live Status (`#10B981`).
- **Signature Feel**: Crisp `1px` structural borders, high-contrast scannable tickets, instant keyboard/touch feedback, zero decorative marketing fluff inside operational views.

### 2.B. Trip Express (`trip.express/web` + `trip.express/mobile`) - *"Kinetic Horizon"*
- **Benchmark**: Airbnb + Wise + Flighty.
- **Palette**: Editorial daylight surfaces (`#FFFFFF` / `#F8FAFC`), Horizon Blue (`#2563EB`), Verified Emerald (`#059669`), Warm Amber (`#D97706`).
- **Signature Feel**: Aspirational destination photography (`16:10` / `4:3`), live flight/transfer timeline nodes, effortless multi-currency clarity, transparent fee breakdown.

### 2.C. OneUID (`uid.one/uid-web` + `uid-app`) - *"Cryptographic Minimal"*
- **Benchmark**: Apple Passkeys + 1Password + Stripe Identity.
- **Palette**: Pure Monochrome (`#000000` / `#FFFFFF`), Verified Emerald (`#10B981`), Monospace cryptographic hashes.
- **Signature Feel**: Vault-grade calm, centered zero-distraction auth cards (`max-w-[400px]`), hardware biometric clarity, zero promotional noise.

### 2.D. SHAN (`shan.voyage` + `shan.estate` + `shan.holdings` + `shan.one`) - *"Quiet Architectural Luxury"*
- **Benchmark**: Aman Resorts + Hermès + Sotheby's International Realty.
- **Palette**: Deep Obsidian (`#0A0A0A`), Warm Alabaster (`#FAFAFA`), Muted Champagne Gold (`#D4AF37`).
- **Signature Feel**: Editorial Serif display (`Playfair Display` / `Cormorant Garamond`) paired with clean Sans body, generous whitespace (`py-24`), architectural hairline dividers, **zero discount countdowns or supermarket add-to-cart buttons**.

---

## 3. Geometric Proportion & Surface Laws

### 3.1. Concentric Border Radius Law
When nesting a child element inside a padded parent container, calculate radii mathematically so corners never look pinched:
$$R_{\text{outer}} = R_{\text{inner}} + P_{\text{padding}}$$
- Outer Card: `rounded-2xl` (`16px`) with `p-2` (`8px`) $\rightarrow$ Inner Image/Button: `rounded-lg` (`8px`).
- Outer Bento/Modal: `rounded-3xl` (`24px`) with `p-3` (`12px`) $\rightarrow$ Inner Panel: `rounded-xl` (`12px`).
- **Zero Nested Cards**: Never place a bordered `Card` inside another bordered `Card`. Use a single outer card container and separate inner regions with whitespace (`gap-6`) or hairline dividers (`border-t border-border/60`).
- **Zero `border-l-4` Callout Stripes**: Never use thick colored left borders (`border-l-4`). Use subtle surface tinting (`bg-muted/40`) + `1px` full-perimeter border (`border-border/80`).

### 3.2. Standardized Control Height Scale
Never mix random heights in the same toolbar row:
- **`xs` (`28px` / `h-7`)**: Compact inline table actions, keyboard shortcut pills, filter chips.
- **`sm` (`32px` / `h-8`)**: Dense operational header actions, segmented view switchers.
- **`md` (`36px` / `h-9` Desktop, `40px` / `h-10` Mobile)**: Default inputs, selects, and primary workspace buttons.
- **`lg` (`44px` / `h-11` - `48px` / `h-12`)**: Primary checkout/settlement CTAs, kiosk touch buttons, auth submit buttons.

### 3.3. 4-Level Surface Depth Ladder & Hairline Borders
1. **Level 0 (Canvas)**: `bg-background` (`#FAFAFA` light / `#09090B` dark).
2. **Level 1 (Raised Card / Workspace Panel)**: `bg-card` (`#FFFFFF` light / `#121215` dark) + `1px` hairline border (`border-border/80` or `rgba(255,255,255,0.07)` in dark mode).
3. **Level 2 (Sticky Header / Floating Bar)**: `bg-background/85 backdrop-blur-md` + bottom hairline.
4. **Level 3 (Modal / Popover / Command Palette)**: `bg-popover` + `shadow-xl` + `1px` specular ring (`ring-1 ring-black/5 dark:ring-white/10`).

---

## 4. Optical Typography & Copy Hygiene

1. **Mandatory `tabular-nums`**: Apply `tabular-nums` (`font-variant-numeric: tabular-nums`) to **every** price, quantity, timer, percentage, coordinates, booking reference, and table column so digits align vertically to the pixel.
2. **Strict Sentence Case**: All headings (`h1`-`h6`), buttons, tabs, badges, form labels, and table headers use **Sentence case** (capitalizing only the first letter and proper nouns like `DING OS`, `Trip Express`, `OneUID`, `SHAN`, `VIP`, `QR`, `AI`).
3. **Zero `/` or `&` in Headings and Labels**: Choose one crisp 1-2 word concept (`"Venue"`, `"Payments"`, `"Spa"`, `"Subscriptions"`).
4. **Zero `...` Truncation on Navigation, Tabs, or KPIs**: Never let navigation pills, segmented tabs, or primary revenue/metric numbers clip into `...`.
5. **Verb-Toast Symmetry**: Button labels and toast confirmations must share the exact same verb and object (`"Save card"` $\rightarrow$ `"Card saved"`, `"Confirm forwarding"` $\rightarrow$ `"Forwarding confirmed"`).

---

## 5. Anthropic `frontend-design` Anti-Slop & Chanel's Subtraction Rule

1. **Two-Pass Visual Execution (Add -> Subtract)**:
   - **Pass 1 (Ground in Domain Craft)**: Anchor every visual detail in the domain's real-world materiality (e.g., thermal folio precision for `DING OS`, flight boarding pass clarity for `Trip Express`).
   - **Pass 2 (Chanel's Subtraction Rule)**: Before shipping, remove at least one unnecessary pill badge, redundant subtitle, decorative icon box, or secondary border that does not carry live operational signal.
2. **Ban the 5 "Default AI Look" Tells**:
   - **Banned #1 - Claude-Default Warm Cream + Terracotta (`#F4F1EA` / `#F5F2EB` + `#D97757` / `#C86D51`)**: Never drift into warm beige/terracotta defaults.
   - **Banned #2 - Eyebrow Pill Slop**: Never place `✨ AI-POWERED WORKSPACE` uppercase pill badges with sparkle icons above headings.
   - **Banned #3 - 3-Equal-Card Icon-in-Circle Grid**: Replace generic 3-column icon cards with asymmetric Bento layouts (`5/7`, `12-col`) or live operational previews.
   - **Banned #4 - Unrequested Decorative Gradients & Neon Glows**: Never add purple-to-cyan gradients or blurred neon blobs behind operational tables.
   - **Banned #5 - Duplicate Card Titles & Inline Status Badge Jamming**: Keep card headers strictly `[Icon + 2-3 Word Title]` on the left and a single primary control on the right.

---

## 6. Emil Kowalski Motion Physics (`emil-design-eng` · `mobile-native` · `animate-expo`)

### 6.1. Frequency & Purpose Gate
- **100+ times/day (`j/k` list navigation, keyboard shortcuts, tab switching)**: **`0ms` (No animation)**. Never slow down high-frequency frontline workflows.
- **10-50 times/day (Popover, Dropdown, Tooltip, Hover)**: **`120ms-180ms`** `cubic-bezier(0.16, 1, 0.3, 1)` (`ease-out-expo`).
- **1-10 times/day (Modal, Drawer/Sheet, Toast)**: **`200ms-280ms`** `cubic-bezier(0.32, 0.72, 0, 1)` (iOS sheet curve) or spring physics.

### 6.2. Core Micro-Interaction Laws
- **Never Animate from `scale(0)`**: Popovers, modals, and dropdowns enter from `scale(0.95)` or `scale(0.97)` + `opacity: 0` with `transform-origin` anchored to the trigger (`var(--radix-popover-content-transform-origin)`).
- **Tactile Press Feedback**: Interactive buttons scale down subtly on active press (`active:scale-[0.98] transition-transform duration-100`).
- **The `blur(2px)` Crossfade Bridge**: When morphing between two distinct icon/button states (e.g., `Copy` $\leftrightarrow$ `Check`, `Idle` $\leftrightarrow$ `Confirming`), pair `opacity` + `scale(0.85)` with a transient `filter: blur(2px)` so the eye perceives a seamless physical morph.
- **Velocity-Based Gesture Dismissal**: Swipeable drawers/toasts dismiss when flick `velocity > 0.11 px/ms`, even if drag distance is under 50%.

### 6.3. GPU Performance & Mobile-Native Laws
- **Composite-Only Properties**: Animate ONLY `transform` (`translate3d`, `scale`, `rotate`) and `opacity`. Never animate `height`, `width`, `top`, `left`, `padding`, or `margin`.
- **11 Mobile-Native Web Rules**: Use `100dvh` (never `100vh`), `env(safe-area-inset-*)`, `font-size >= 16px` on inputs (prevents iOS Safari auto-zoom), `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`, and `prefers-reduced-motion: reduce` fallbacks.
- **React Native 120fps ProMotion (`animate-expo`)**: Run all mobile animations on the UI thread via Reanimated 4 `'worklet'` (`useSharedValue`, `useAnimatedStyle`, `withSpring({ mass: 0.8, damping: 18, stiffness: 220 })`), firing `expo-haptics` on the exact same frame as visual press feedback.

---

## 7. Garry Tan's `gstack` 7-Pass `0-10` Visual Review & Fix-to-10 Protocol

Before sign-off, the `UI DESIGNER` classifies the page's **Surface Mode** (`PERSUADE` | `OPERATE` | `READ` | `EXPERIENCE`) and scores it from `0-10` across 7 passes:
1. **Pass 1 - Visual Hierarchy & 3-Second Squint Test (`0-10`)**: Does the primary focal point win immediately when squinting at the screen?
2. **Pass 2 - Typography, Rhythm & Numeric Alignment (`0-10`)**: Scale contrast, line width (`60ch-75ch`), `tabular-nums`, Sentence case, zero `...` clipping.
3. **Pass 3 - Spatial Harmony & Concentric Geometry (`0-10`)**: Concentric radii ($R_{\text{outer}} = R_{\text{inner}} + P$), consistent control heights, zero nested cards.
4. **Pass 4 - Color Discipline, Contrast & Dark/Light Parity (`0-10`)**: WCAG AA/AAA contrast, brand-authentic palette, `1px` specular dark-mode borders.
5. **Pass 5 - Motion Physics & Tactile Ergonomics (`0-10`)**: `transform`/`opacity` only, `scale(0.95)` entry, `active:scale-[0.98]`, `>= 44px` touch targets.
6. **Pass 6 - Anti-Slop & Subtraction (`0-10`)**: Zero Claude-default cream/terracotta, zero fake eyebrow pills, Verb-Toast symmetry.
7. **Pass 7 - Brand Cohesion & Goodwill Reservoir (`0-10`)**: Preserves user Goodwill `>= 85/100`.

- **Mandatory Fix-to-10 Gate**: Every shipped screen must achieve an overall score **`>= 8.5/10`** with **no single pass `< 7/10`**. If any pass scores below `8/10`, the `UI DESIGNER` immediately fixes the CSS/JSX in the same turn to bring it to `9-10/10`.
