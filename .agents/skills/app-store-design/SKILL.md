---
name: app-store-design
description: App Store, Mac App Store, and Google Play Store Marketing Screenshot & Release Asset Architecture distilled from ParthJadhav/app-store-screenshots, Apple App Store Connect & Google Play Console Specifications, and top global app launches (Superlist, Arc, Headspace, Gentler Streak, Linear). Covers the Ad-Not-Documentation Principle, 1-Second 160px Thumbnail Squint Test, 6-8 Slide Narrative Arc, Headline Copy Iron Rules, Connected-Canvas Cross-Screen Composition, Store-Ready Resolution Matrices (iPhone 6.9"/6.5", iPad 13", Mac 16:10, App Store Creative Assets 5244x2950, Android Phone/Tablet, 1024x500 Feature Graphic, 24-bit Opaque RGB PNGs), 14-Locale + RTL Adaptation, and Brand-Specific Storefront Decks for DING OS, Trip Express, OneUID, and SHAN. Use whenever designing, generating, auditing, or exporting mobile/desktop app store screenshots, feature graphics, or store launch assets.
---

# App Store, Mac App Store & Google Play Design System (`app-store-design`)

Distilled from **ParthJadhav/app-store-screenshots** (`Connected-Canvas Screenshot Editor, 18 Visual Style Specs & Copy Ideas Library`), **Apple Human Interface Guidelines & App Store Connect Asset Specs**, **Google Play Console Store Listing Standards**, and **Benchmark App Store Decks** (`Superlist`, `Linear`, `Arc Search`, `Headspace`, `Gentler Streak`, `Airbnb`, `Stripe Dashboard`).

---

## 1. Core Philosophy: Screenshots Are Advertisements, Not Documentation

1. **Sell the Outcome, Not the Raw Settings Screen**:
   - Every store screenshot is a high-converting **billboard**, not a user manual. Never show an unexplained settings page or empty form. Every slide sells **one unmistakable user outcome** or kills **one acute pain point**.
2. **The 1-Second `160px` Thumbnail Squint Test (Mandatory Gate)**:
   - Over 80% of App Store and Google Play impressions happen on search result pages where slides are shrunk to **`~160px` wide**.
   - Before exporting any slide, shrink it to `160px` width and squint:
     - Can a user read the headline in under **1 second** without zooming?
     - Is the primary UI focal point inside the device frame immediately legible?
     - If not, the headline has too many words, the font weight is too thin, or text-to-background contrast is too weak.
3. **Density Inside the Device, Sparsity Outside**:
   - **Inside the device frame**: Show rich, authentic, realistic operational data (live orders, folio splits, seatmaps, itineraries, verified passkeys - never `"Lorem ipsum"` or `"Test User"`).
   - **Outside the device frame**: Strictly **1 headline** (occupying the top `30%-40%` of the canvas), **1 optional short eyebrow badge**, and **1 primary visual composition**. Never place bullet lists, multi-sentence paragraphs, or competing logos outside the device bezel.
4. **The Background Is a Designed Surface**:
   - Never use accidental default `#FFFFFF` white with a bare phone and bare black text. Every deck uses a deliberate architectural surface palette derived from the brand's Design Language (`Tactile Precision` Slate/Amber for DING OS, `Kinetic Horizon` Daylight/Ocean for Trip Express, `Cryptographic Minimal` Obsidian/Monochrome for OneUID, `Quiet Architectural Luxury` Warm Stone/Espresso/Champagne for SHAN).

---

## 2. The 6-to-8 Slide Narrative Arc & Proof Anchoring

Apple App Store allows up to 10 slides and Google Play allows up to 8 slides. Our canonical store launch deck uses **6 to 8 slides** structured as a deliberate commercial story:

| Slide Slot | Role | Layout Archetype | Commercial Job |
| :--- | :--- | :--- | :--- |
| **Slide #1** | **Hero & Primary Value Prop** | `hero` (Big headline top + anchored hero device + proof badges) | The **only** slide 70% of visitors inspect closely. State the #1 category-defining benefit and concentrate **all** trust/proof badges here (never scatter small badges across slides 2-8). |
| **Slide #2** | **Core Differentiator** | `device-bottom` or `connected-bridge` (Cross-screen pair with Slide #1) | What makes this app 10x better than legacy alternatives (e.g., `"0% Commission Direct Orders"` or `"1-Tap Group Checkout"`). |
| **Slide #3** | **Real-Time Speed / AI Power** | `device-top` (Flipped rhythm: device top, headline bottom) or `callout-loupe` | Highlight the signature interaction or AI automation using a **Magnifier Loupe (`1.8x-2.5x` zoom)** over the exact UI detail. |
| **Slide #4** | **Cross-Role / Multi-Device Sync** | `two-devices` (Layered front + back devices or Folded + Open) | Show how front-desk, kitchen/counter, and mobile staff stay in sync in real time. |
| **Slide #5** | **Financial / Security Trust** | `device-bottom` (Inverted dark/light contrast slide) | Showcase ledger accuracy, instant e-invoicing, escrow protection, or hardware-bound passkey security. |
| **Slide #6** | **Ecosystem & Offline Resilience** | `split-landscape` or `hero` | Highlight QR Wi-Fi auto-connect, ESC/POS thermal printing, eSIM/boarding passes, or multi-leg Butler sync. |
| **Slide #7 (Closer)** | **Feature Wall / Mosaic** | `feature-wall` or `phone-mosaic` | Close with a bold typographic capability grid or multi-screen mosaic that proves comprehensive platform depth. |

### Layout Rhythm Law
- **Never repeat the exact same device placement 3 times in a row.** Alternate between `hero`, `device-bottom`, `device-top`, `two-devices`, and `inverted` (dark/light contrast) slides so scanning the horizontal strip feels dynamic and intentional.

---

## 3. Headline Copywriting Iron Rules (`Copy Ideas` Engine)

1. **One Idea Per Headline (Zero `"and"`, Zero `/` or `&`)**:
   - Never join two claims in one screenshot headline. If a headline needs `"and"`, split it into two slides or cut the weaker half.
2. **3-to-5 Words Per Line, Maximum 2-3 Lines**:
   - Use short, punchy 1-2 syllable verbs and concrete nouns.
   - Keep **Sentence case** (never `ALL CAPS` headlines, never split-color/single-italic AI-slop word gimmicks inside headings).
3. **Three Proven Headline Formulas**:
   - **Formula A - State the Commercial Outcome**: *"Keep 100% of every direct order."* / *"Settle open tabs in two taps."*
   - **Formula B - Paint the Operational Moment**: *"Scan at the table. Fires to the counter."* / *"One passkey for every check-in."*
   - **Formula C - Kill the Legacy Pain**: *"No OTA commissions. No manual entry."* / *"Zero re-typing from inbox to folio."*

| Weak (Documentation / AI Slop) | Strong (Store-Ready Ad Copy) | Why It Wins |
| :--- | :--- | :--- |
| *"Manage bookings, POS orders, and CRM in one AI platform"* | *"Run counter, rooms, and CRM in one place"* | Concrete nouns, single rhythm, scannable in 0.8s |
| *"Advanced AI email ingestion and automated parsing"* | *"Forward any booking email. AI builds the order."* | Shows cause and effect instead of abstract tech jargon |
| *"Multi-currency travel booking and eSIM marketplace"* | *"Book tours, transfers, and eSIMs in one tap"* | Buyer-centric outcome, zero buzzwords |

---

## 4. Connected-Canvas & Cross-Screen Composition Rules

When designing a connected strip (`connectedCanvas: true` where elements bridge across adjacent slide boundaries):
1. **Restraint Budget (`Max 1-2 Cross-Screen Bridges per Deck`)**:
   - In a 6-8 slide deck, use at most **1 or 2** cross-screen bridges (typically bridging **Slide #1 -> Slide #2** or **Slide #3 -> Slide #4**). Bridging every seam turns the deck into a gimmick.
2. **The `10%-30%` Non-Critical Bleed Rule**:
   - Let a secondary device frame, floating notification card, or subtle architectural background line bridge `10%-30%` across the seam between two adjacent slides.
   - **Strictly Forbidden Across Seams**: **NEVER** split a headline, price, KPI number, legal disclosure, or primary CTA across two slides.
3. **Standalone Crop Integrity**:
   - Every individual exported PNG (`01.png`, `02.png`, ...) must still read as a 100% complete, balanced advertisement when viewed alone in App Store search results.

---

## 5. Exact Store-Ready Export Resolution Matrix & Technical Hygiene

Always design at the highest canonical resolution for each device class and export **24-bit Opaque RGB PNGs (Zero Alpha Channel - Apple App Store Connect rejects transparent PNGs)**.

### 5.A. Apple App Store (iOS / iPadOS / watchOS / tvOS)
| Device Slot | Canonical Export Resolution (Portrait) | Landscape Resolution | Notes |
| :--- | :--- | :--- | :--- |
| **iPhone 6.9" (Mandatory Primary)** | `1320 x 2868 px` | `2868 x 1320 px` | iPhone 16 Pro Max / 17 Pro Max slot (App Store Connect auto-scales down to 6.5"/6.3"/6.1" if enabled) |
| **iPhone 6.5" (Fallback Primary)** | `1284 x 2778 px` | `2778 x 1284 px` | Accepted universally by App Store Connect |
| **iPhone 6.3" / 6.1"** | `1206 x 2622 px` / `1125 x 2436 px` | `2622 x 1206 px` | Optional dedicated crops |
| **iPad Pro 13" (Mandatory iPad)** | `2064 x 2752 px` | `2752 x 2064 px` | Required whenever `supportsTablet: true` (e.g., Counter Terminal & Seatmap views) |
| **iPad Pro 12.9" (2nd-6th Gen)** | `2048 x 2732 px` | `2732 x 2048 px` | Legacy iPad Pro slot |
| **App Store Creative Assets** | Universal: `5244 x 2950 px` | Header: `3840 x 1646 px` · Search (3:2): `3840 x 2560 px` | Keep all text inside Apple's centered safe area |

### 5.B. Mac App Store (`macOS` / Tauri Desktop Builds)
| Device Slot | Aspect Ratio | Canonical Export Resolutions |
| :--- | :--- | :--- |
| **Mac Desktop (`16:10` Mandatory)** | `16:10` | `2880 x 1800 px` (Retina Primary), `2560 x 1600 px`, `1440 x 900 px`, `1280 x 800 px` |

### 5.C. Google Play Store (`Android`)
| Asset Slot | Canonical Export Resolution | Aspect / Rules |
| :--- | :--- | :--- |
| **Android Phone (Portrait)** | `1080 x 1920 px` (or `1440 x 2560 px` 2x) | `9:16` portrait, 2-8 screenshots required |
| **7" Tablet** | `1200 x 1920 px` (Portrait) / `1920 x 1200 px` (Landscape) | Required for tablet optimization badge |
| **10" Tablet** | `1600 x 2560 px` (Portrait) / `2560 x 1600 px` (Landscape) | Showcase Counter/Kiosk/Seatmap multi-pane UI |
| **Play Store Feature Graphic** | `1024 x 500 px` | Mandatory store header banner; bold brand lockup + 1-line value prop, no tiny phone text |

### 5.D. Export Pipeline Technical Guardrails
1. **Opaque 24-Bit RGB Flattening**: Always composite slides onto an explicit solid/gradient background canvas (`backgroundColor` set on root node) and export as 24-bit RGB PNG with no alpha transparency.
2. **Async Image Decode Verification**: Before triggering `html-to-image` (`toPng`) or Playwright screenshot capture, await ` Promise.all(Array.from(document.images).map(img => img.decode().catch(() => {}))) ` and `document.fonts.ready` so Safari/WebKit never exports blank device screens or fallback fonts.
3. **14-Locale & RTL (`ar`) Bundle Organization**:
   - Export directory structure: `<platform>/<device>/<WxH>/<locale>/<NN>-<layout>.png` (e.g., `ios/iphone/1320x2868/vi/01-hero.png`).
   - Transcreate headlines culturally per locale (never machine-translate word-for-word; keep German/French/Russian/Vietnamese headlines concise so they never wrap onto 4 lines).
   - For Arabic (`ar`), set `dir="rtl"` on caption containers and verify that directional badges and cross-screen bridges read naturally from right to left.

---

## 6. Brand-Specific App Store Deck Specifications Across Our 4 Ecosystems

| Ecosystem App | Visual Style Preset | Primary Surface & Accent | Hero Slide #1 Headline & Focus |
| :--- | :--- | :--- | :--- |
| **1. DING OS** (`app.getding.io` + Desktop Kiosk) | **Swiss Grid Bold / Tactile Precision** | Slate `#0F172A` & `#F8FAFC` + Signal Amber `#F59E0B` & Emerald `#10B981` | • **Slide 1**: *"AI commerce and operations OS"* (Counter dispatch + live 880Hz order alert).<br>• **Slide 2**: *"Keep 100% of direct orders"* (QR self-ordering + 0% direct fee).<br>• **Slide 3**: *"Forward any email. AI builds the booking."* (Universal Ingest).<br>• **Slide 4**: *"One catalog for 13 sectors"* (Spaces, Realty, Clinics, Dining, Sports, Mobility).<br>• **Slide 5**: *"Own 100% of your customer CRM"* (VIP tiers + Member Cashback).<br>• **Slide 6**: *"Tasks, KPIs, and staff attribution"* (Live Kanban + `booking.owner`). |
| **2. Trip Express** (`trip.express/mobile`) | **Kinetic Horizon / Editorial Travel** | Daylight `#F8FAFC` & Deep Ocean `#0F172A` + Trust Blue & Warm Amber | • **Slide 1**: *"Tours, transfers, stays, and eSIMs in one tap"* (Discovery + instant confirmation).<br>• **Slide 2**: *"Group checkout with live seat and slot locks"* (`GRP-` multi-experience cart).<br>• **Slide 3**: *"Instant e-tickets and encrypted vouchers"* (Offline-ready QR pass).<br>• **Slide 4**: *"AI travel concierge in 14 languages"* (Tailored itineraries). |
| **3. OneUID** (`uid.one/uid-app`) | **Midnight Glow Pro / Cryptographic Minimal** | Obsidian `#010102` & Surface `#171717` + Crisp Monochrome `#FFFFFF` | • **Slide 1**: *"Zero-knowledge passkey identity"* (Hardware-bound biometric sign-in).<br>• **Slide 2**: *"Scan to sign in across every device"* (Instant QR challenge verification).<br>• **Slide 3**: *"Selective disclosure. Zero tracking."* (Tenant-isolated `sub` privacy). |
| **4. SHAN** (`shan.one`) | **Quiet Architectural Luxury** | Obsidian `#0A0A0A` & Warm Stone `#F6F4F0` + Champagne Gold `#C5A572` | • **Slide 1**: *"Your private AI Butler and sovereign guild"* (Invite-only `Voyager · Élite · Privé`).<br>• **Slide 2**: *"Private aviation, yachts, and sanctuary estates"* (4-stage bespoke escrow).<br>• **Slide 3**: *"Every leg of your journey, orchestrated live"* (Auto-cascading itinerary sync). |
