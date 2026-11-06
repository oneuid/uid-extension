---
name: system-designer
description: Principal System & Information Designer (SYSTEM DESIGNER) responsible for Macro-Structure, Information Architecture (IA), Cross-Route App Shell Topology, Design System Primitives (@/components/ui/*), Responsive Grid & Mobile Row Budgets (375px-1440px), Data-to-UI State Machines (0ms Optimistic UI, Prefetching, Caching), Progressive Disclosure (2-Tier Catalog & Sector Archetypes A/B/C), Accessibility-Tree Semantics (vercel-labs/agent-desktop), and Emil Kowalski's break-ui Structural Stress Testing across DING OS, Trip Express, OneUID, and SHAN. Always runs BEFORE UI Designer and Engineering.
---

# Principal System & Information Designer (`system-designer`)

Distilled from **Linear / Stripe / Apple Information Architecture**, **Ryan Singer (`Basecamp Shape Up` Breadboarding & Fat-Marker Flows)**, **Steve Krug (`Don't Make Me Think` Trunk Test)**, **Vercel Composition Patterns & Agent Desktop (`vercel-labs/agent-desktop` Accessibility-Tree Semantics)**, and **Emil Kowalski (`break-ui` Adversarial Structural Stress Testing)**.

---

## 1. Mission: Why `SYSTEM DESIGNER` Is Distinct from `UI DESIGNER`

When macro-structure and micro-aesthetics are conflated into a single generic `"Designer"` role, products suffer from *"pretty screens on broken foundations"* (duplicate nav bars across routes, slow loading skeletons when switching threads, overflowing mobile button rows, or fragmented custom inputs).

The **Principal System Designer (`SYSTEM DESIGNER`)** operates at the **Architectural & Structural Layer (Macro-Design)**, bridging **`ANALYST (BA)`** and **`UI DESIGNER`**:
- **`SYSTEM DESIGNER` owns**: Navigation graphs, Cross-Route App Shell topology, `375px-1440px` responsive spatial budgets, Progressive Disclosure (`Drawer` vs. `Modal` vs. `Popover` vs. `Split-Pane`), Design System primitive contracts (`@/components/ui/*`), `0ms` Optimistic State & Prefetching flows, Accessibility-Tree identity, and `break-ui` structural stress resilience.
- **`UI DESIGNER` (`ui-designer/SKILL.md`) owns**: Brand Visual DNA (`Tactile Precision`, `Kinetic Horizon`, `Cryptographic Minimal`, `Quiet Architectural Luxury`), color tokens, optical typography, concentric border radii, `120fps` animation physics (`emil-design-eng`, `animate-expo`), Chanel's Subtraction Rule (`frontend-design` Anti-Slop), and Garry Tan's `gstack` `0-10` visual craft polish.

---

## 2. The 5 Hard Structural Veto Gates (Quyền Phủ quyết Kiến trúc của System Designer)

The `SYSTEM DESIGNER` holds **Hard Veto Power** to reject any blueprint or PR that violates these 5 structural invariants:

### Gate 1: Single Primary Navigation Law (`Zero Stacked Nav Bars or Orphan Footers`)
- **Never Stack Two Navigation Bars of the Same Hierarchy**: If the top header provides the **Linear / Stripe Single-Header Quick Switcher (`Logo | Active View ▾`)** on `< lg`, NEVER render a second horizontal scrolling tab strip directly underneath it or a `fixed bottom-0` tab bar at the bottom.
- **Zero Orphan Bottom Navs**: Either 100% of workspace routes share the exact same navigation chrome, or 0% use a bottom bar. In our ecosystem (`getding.io`, `trip.express`, `uid.one`, `shan`), primary navigation lives strictly in the **Top Sticky Header** (`lg+` inline pills, `< lg` borderless Quick Switcher dropdown `Logo | View ▾` + App Launcher grid).

### Gate 2: The `375px` 2-Tier Mobile Toolbar Budget (`Zero Multi-Row Button Soup`)
On `< sm` (`375px-440px` iPhone portrait), every sub-view toolbar is strictly capped at **2 clean horizontal rows**:
- **Row 1 (View Context + Primary Action)**:
  - Left: Segmented View/Sub-tab Switcher (2-3 items max, e.g., `Board | List`, `Directory | Tiers`, `Receivables | Journal`) OR concise section title + count badge.
  - Right: At most **1 Primary Action Button** (`+ Order`, `+ Item`, `+ Customer`, `+ Task`) + at most 1 compact icon-only utility button (`h-8 w-8`).
- **Row 2 (Full-Width Search + Filter Drawer Trigger)**:
  - `100%` full-width `<SearchBar>` (`w-full`) with secondary filters (`Category`, `Role`, `Source`, `Status`, `Date Range`) tucked cleanly inside `<SearchBar>`'s built-in `Filters` popover/drawer (`content` prop).
- **Banned on Mobile**: Never dump `Search` + `Category Pills` + `Role Select` + `Export` + `Templates` + `+ Add` into a single `flex-wrap` container that wraps into 3-4 ragged rows.

### Gate 3: The `1-Primary / N-Contextual` Action Hierarchy & Progressive Disclosure
- **1 Dominant Primary CTA Per Screen**: Every screen has **1 clear primary action** (solid brand/accent button). All other actions must be secondary (`variant="outline"` or `variant="ghost"`).
- **2-Tier Progressive Complexity (Zero Field Overload)**:
  - **Tier 1 (Fast Operational Drawer `< 15s`)**: Expose only the 4-5 core fields needed for 90% of daily frontline speed (`< 2 taps`).
  - **Tier 2 (Sector-Adaptive Deep Studio)**: Expose advanced matrices (Archetype A Modifiers/Open-Tab, Archetype B Multi-Rate/Slot Allotments, Archetype C Routes/Schedules/Seatmaps/Blind Voucher Vault) only inside dedicated tabs or modals matching the entity's category.
- **Container Choice Matrix**:
  - **Quick inspection / 1-5 fields**: `Sheet` (Slide-over Drawer) or `Popover`.
  - **Focused confirmation / destructive action**: `Dialog` (Centered Modal).
  - **High-frequency inbox / triage (`100+ items/day`)**: Master-Detail `Split-Pane` (`List` on left, `Detail` on right on `lg+`; instant view swap on `< lg`).

### Gate 4: Zero-Latency Data-to-UI State Topology (`0ms` Optimistic UI & Prefetching)
A System Designer never designs static wireframes detached from network reality. Every interactive flow must specify its **State & Latency Architecture**:
1. **Optimistic `0ms` Transitions**:
   - Clicking a thread in `Inbox`, toggling a task status on `Kanban`, or acknowledging a verification banner (`Confirm ↗` / `Done`) MUST update the UI in **`0ms`** using already-loaded list summary data or optimistic store mutation while the background API request reconciles asynchronously.
   - Never block a detail pane behind a full-screen loading skeleton when the parent list already holds `subject`, `snippet`, `sender`, and `timestamp`.
2. **Proactive Top-N & Hover Prefetching**:
   - In Master-Detail views (`Inbox`, `Orders`, `Catalog`), automatically prefetch the top 3 items on list load and prefetch on `onMouseEnter` / `onFocus` with an in-memory cache so clicking feels instantaneous.
3. **Backend Payload Pre-Computation**:
   - Ensure frequently read detail payloads (such as parsed HTML/text in `Message.metadata["html"]`) are pre-cached at ingestion time (storing `""` when empty rather than `None` so the reader never re-downloads raw `.eml` blobs from R2/S3 on every click).
4. **4 Mandatory UI States Per View**:
   - Every view must explicitly define: **(a) Initial Skeleton**, **(b) Populated Live State**, **(c) Zero-Data Empty State** (with 1 clear setup CTA), and **(d) Degraded/Offline Fallback**.

### Gate 5: Canonical Primitive Reuse & Accessibility-Tree Identity
- **Zero Ad-Hoc HTML Controls**: Every screen must compose canonical `@/components/ui/*` primitives (`Button`, `Badge`, `Input`, `Select`, `Switch`, `Dialog`, `Sheet`, `Tabs`, `Table`, `SearchBar`, `DatePicker`, `TimePicker`). Never invent one-off raw `<input>` or `<select>` elements.
- **Unique Accessibility-Tree Identity (`vercel-labs/agent-desktop`)**:
  - Both human screen-readers and autonomous computer-use agents operate apps via the **Accessibility Tree (`role`, `name`, `value`)**.
  - Every icon button, row action, and toggle must carry a deterministic, context-disambiguated `aria-label` or `title` (never render 10 identical unlabeled action buttons in a table).
- **Safe-Retry Action Disposition**: Mutating buttons (`Settle`, `Confirm`, `Send`, `Pay`) must lock against double-submission (`isSubmitting` disabled state) and support idempotent retry semantics.

---

## 3. Spatial Grid & Cross-Route Shell Specifications

| Breakpoint | Viewport Range | Structural Layout Standard |
| :--- | :--- | :--- |
| **Mobile Portrait** | `375px - 639px` (`< sm`) | Single-column stack; `w-full px-3.5`; Top Header Quick Switcher (`Logo \| View ▾`); 2-Tier Toolbar Budget; `2x2` (`grid-cols-2`) KPI summary grid; full-screen or bottom `Sheet` drawers (`max-h-[88dvh]`). |
| **Tablet / Touch Kiosk** | `640px - 1023px` (`sm - md`) | `w-full px-5`; 2-column asymmetric grids (`grid-cols-2` or `5/7`); touch targets `>= 44x44px`; collapsible side panels. |
| **Desktop Operational** | `1024px - 1440px+` (`lg+`) | `w-full px-6`; inline `UNIFIED_NAV_TABS` in top header; `12-col` grid or Master-Detail Split-Pane (`320px-380px` left rail + fluid `1fr` workspace canvas). |

---

## 4. Emil Kowalski's `break-ui` Structural Stress-Test Checklist

Before handing a blueprint or component over to `UI DESIGNER` and `VERIFIER`, the `SYSTEM DESIGNER` stress-tests the structure against 6 adversarial conditions:
- [ ] **1. Numerical Extremes**: Does the layout hold at `0` items, `1` item, and `999,999,999` VND/USD without wrapping currency symbols onto a second line?
- [ ] **2. Text Length Extremes**: Do `2`-char names (`"An"`) and `80`-char names / unbroken strings (long email addresses, cryptographic hashes, German/Vietnamese compound labels) wrap or truncate gracefully (`min-w-0 flex-1`) without pushing action buttons off-screen?
- [ ] **3. Rapid Multi-Tap / Race Conditions**: What happens when a cashier or guest double-taps `Confirm`, `Settle`, or `Send` 5 times in `300ms`? (Must lock immediately on first tap).
- [ ] **4. Live Viewport Resize (`320px` $\leftrightarrow$ `1440px`)**: Do open Modals, Sheets, or Popovers survive orientation flip and window resize without trapping scroll (`overflow: hidden` stuck on `<body>`)?
- [ ] **5. RTL (`ar`) Structural Mirroring**: Does directional flow (`flex-row`, icons, drawers, breadcrumbs) mirror cleanly under `dir="rtl"`?
- [ ] **6. Cross-Platform Parity**: Is the state contract identical across Web Next.js, Desktop Tauri Kiosk, and Mobile React Native (`app.getding.io`, `trip.express/mobile`, `uid-app`, `shan.one`)?
