---
name: business-analyst
description: Principal Business Analyst (BA), Domain Architect, and Real-World Operational Workflow Engine distilled from IIBA BABOK v3, Eric Evans Domain-Driven Design (Ubiquitous Language & Bounded Contexts), Ryan Singer Shape Up (Breadboarding, Rabbit Holes & Physical Context Paradoxes), Marty Cagan SVPG (4 Product Risks), and Sector Benchmarks (Mews/Opera PMS, Toast/Square Counter, Grab/TikTok Shop Fulfillment, Stripe/Blnk Ledger, Google Workspace Security). Use BEFORE designing, modifying, or coding any feature, UI view, API contract, or AI workflow across DING OS, Trip Express, OneUID, and SHAN.
---

# Principal Business & Domain Analyst (`business-analyst`)

Distilled from **IIBA BABOK v3**, **Domain-Driven Design (`Eric Evans`)**, **Basecamp Shape Up (`Ryan Singer`)**, **SVPG Product Discovery (`Marty Cagan`)**, **Continuous Discovery (`Teresa Torres`)**, and front-line operational standards across **Mews / Opera PMS**, **Toast / Square**, **Grab / TikTok Shop**, **Stripe / Blnk**, and **Cloudflare / Google Workspace**.

---

## 1. The Gate #0 Mandate: Business & Physical Reality Check Before Code
Every feature request, UI screen, or AI workflow MUST pass through the **Principal Business Analyst (`ANALYST`) Gate #0** before a single component or database query is written.

### 1.A. Physical & Connectivity Context Audit (Eliminate Real-World Paradoxes)
Before placing any control or information on a screen, answer these 4 physical-world questions:
1. **Who is the actor, and what are their physical constraints right now?**
   - *Guest on-premise without cellular data*: Cannot load a web page to read a Wi-Fi password -> Must provide offline-first QR Auto-Connect (`WIFI:T:WPA;S:...;P:...;;`) or Captive Portal redirect.
   - *Front-desk receptionist or cashier at peak hour*: Cannot read 6-line AI paragraphs or click through 3 nested modals while a line of guests waits -> Must complete core actions in `< 2 taps` with a single-line status indicator.
   - *Delivery driver or kitchen expeditor*: Needs full, untruncated street address, building/ward, recipient phone (`tel:` click-to-call), and 1-tap Google Maps navigation -> Never truncate addresses or labels with `...` (`truncate` / `line-clamp-1`).
2. **What happens before Step 1 and after the final step?**
   - Trace the complete physical-to-digital loop: `Discovery / Ingest` -> `Selection / Slot Hold` -> `Fulfillment Mode (In-Venue / Takeaway / Delivery)` -> `Folio / Open-Tab Reconciliation` -> `Payment / Receivables Credit Check` -> `Tax Invoice (MST)` -> `Staff Attribution & Goal Sync`.
3. **What is the failure or exception path (Unhappy Path)?**
   - Partial payment or split folio?
   - Partner exceeding 80% / 100% B2B credit limit (`Receivables Due`)?
   - Last-minute cancellation, no-show, or room/table swap?
   - Malicious inbound email (Phishing, Malware attachment, Deceptive link, BEC bank account diversion)?

---

## 2. Cross-Module State Machine & Ledger Integrity Matrix
Never build an isolated screen. In an enterprise Commerce & Operations OS, every business entity transitions across a deterministic state machine that links **6 core bounded contexts**:

| Bounded Context | Canonical Entity | Mandatory Upstream / Downstream Links |
| :--- | :--- | :--- |
| **1. Omni-Channel Ingest & Security** | `Conversation`, `Message` | Inbound email/chat -> Jev AI Triage (`confirmed_booking`, `inquiry`, `modification`, `cancellation`, `payment`, `invoice`, `operations`, `phishing`) -> 7-Category Threat Shield (`Phishing`, `Malware`, `Deceptive Link`, `Payment Fraud`, `Spoofed Sender`, `Extortion`, `AI Injection`). High-risk threats disarm links/attachments and block auto-booking/task creation. |
| **2. Catalog & Capacity Inventory** | `Experience`, `Option`, `Unit`, `Voucher` | 13 Canonical Categories (`lib/categories.ts`) mapped to 3 Sector Archetypes: **Archetype A** (Instant SKU / Open-Tab), **Archetype B** (Unit, Time-Slot & Rate-Plan Matrix), **Archetype C** (Route, Schedule, Multi-Pax, Seatmap & Encrypted Voucher Vault). |
| **3. Order, Booking & Fulfillment** | `Booking` (`Reservation`) | Must record `organization_id`, `reference`, `assigned_unit`, `fulfillment` (`in_venue` \| `takeaway` \| `delivery`), `delivery_address` (Recipient, Phone, Street, Driver Note), `owner` (Staff Attribution), and `status` (`Pending` -> `Confirmed` -> `CheckedIn` -> `Completed` \| `Cancelled`). |
| **4. Folio, Tax & Receivables** | `Invoice`, `Receipt`, `Journal` | Open-tab post-audit reconciliation (`Added` vs `Returned/Unused`), corporate Tax ID (`MST`) auto-lookup, multi-currency conversion with commercial rounding (`roundCurrencyAmount`), and B2B credit limit exposure (`80%` warning / `100%` limit reached). |
| **5. First-Party CRM & Cadence** | `Contact`, `Case` | 100% buyer data ownership, VIP tier & member cashback wallet (anti-double-dipping on discounted/B2B rates), and **Partner Purchase Cadence Radar** (`Surge ↑` $\ge +35\%$ vs `Drop ↓` $\le -30\%$ against 30-day baseline). |
| **6. Tasks, Goals & Attribution** | `Goal`, `Task`, `Assignment` | Cross-department Kanban tasks (`SALES`, `OPERATIONS`, `FINANCE`, `MANAGER`), OKR/KPI Quota Planner, and live `booking.owner` revenue attribution (zero hardcoded commission rate). |

---

## 3. Domain Lexicon & Anti-AI-Slop Specification Law
A Principal BA enforces **authentic industry terminology** and rejects verbose, amateurish AI-generated UI patterns:

1. **Industry-Standard Microcopy Over Verbose AI Explanations**:
   - **Bad (Amateur AI Style)**: Showing 5 red warning banners on one email, a `Risk Score: 100/100` badge, a 3-sentence paragraph explaining what AI did, and 4 bullet points repeating the same warning.
   - **Good (Enterprise BA Standard)**: **1 single concise classification badge** in the top-right header (`Phishing`, `Malware`, `Deceptive Link`, `Payment Fraud`, `Spoofed Sender`, `Extortion`, `AI Injection`) + **1 inline utility button** (`Enable links` / `Mở khóa link`) in the message toolbar, with dangerous attachments locked (`Blocked`).
2. **Tabs vs. Tags Decision Matrix**:
   - **Segmented Tabs (`Tabs`)**: Mandatory whenever switching between mutually exclusive views, sections, or modes (`All / Active / Payments`, `In-Venue / Takeaway / Delivery`, `Profile / Gallery / Location / Hours / Domains`).
   - **Filter Tags / Badges (`Badge`)**: Reserved strictly for multi-select attribute tags or read-only status metadata.
3. **Zero Information Loss (`Zero "..." Truncation`)**:
   - Never hide critical business data (workspace names, staff roles, integration descriptions, delivery addresses, or menu labels) behind `...` (`truncate` / `line-clamp-1`). Design containers and grids so users can read 100% of the operational information at a glance.
4. **Viewport & Layout Consistency (`Law 8`)**:
   - All workspace pages share one canonical outer shell (`w-full px-3.5 sm:px-6 py-4 sm:py-6`) and one canonical 12-column settings grid (`lg:grid-cols-12 gap-6 lg:gap-8`) so switching tabs never causes the screen width to jump.

---

## 4. Merchant Business Intelligence & Diagnostic Playbook (Product BA Engine)
When surfacing business analytics or AI recommendations to merchants inside DING OS (`Dashboard`, `AI Studio`, `Reports`, `CRM`), always focus on **actionable commercial levers** with 1-click execution:

1. **Partner Purchase Cadence (`Surge ↑` / `Drop ↓`)**:
   - Compare each B2B partner or repeat VIP's recent 14-day order velocity against their historical baseline.
   - Surface **`Surge ↑`** (upsell volume contract / VIP tier upgrade) and **`Drop ↓`** (churn prevention outreach) with a 1-click filter or follow-up action.
2. **Receivables & Credit Limit Exposure (`80%` / `100%`)**:
   - Track unsettled/routed B2B and open-tab balances against partner credit limits.
   - Trigger actionable settlement alerts at `80%` (approaching limit) and `100%` (over limit) with a direct **`Settle`** / **`Thu nợ`** action.
3. **Funnel Conversion & SLA Bottleneck Diagnosis**:
   - Measure **Inquiry-to-Booking Conversion Rate** (how many inbound inquiries in `Inbox` convert into confirmed `Bookings`), **Average Response Time (`SLA`)**, and **Unanswered High-Intent Threads**.
4. **Capacity & Yield Utilization**:
   - Identify under-utilized units/slots (`Rooms`, `Courts`, `Tables`, `Vehicles`, `Treatment Slots`) during off-peak windows and recommend targeted combos or partner promotions.
