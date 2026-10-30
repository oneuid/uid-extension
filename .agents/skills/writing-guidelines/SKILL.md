---
name: writing-guidelines
description: Enterprise UX Microcopy, Natural Editorial Voice, Single-Concept Heading Architecture, Anti-Repetition Discipline, and 14-Locale Localization Standards (distilled from Vercel Writing Guidelines, Apple HIG Microcopy, Stripe Editorial Standards, and Wikipedia Signs of AI Writing). Use whenever writing, reviewing, translating, or auditing UI labels, headings, buttons, cards, marketing copy, legal policies, or documentation across DING OS, Trip Express, OneUID, and SHAN.
metadata:
  author: antigravity
  version: "3.0.0"
---

# Enterprise UX Microcopy and Natural Editorial Voice (`writing-guidelines`)

## 1. Single-Concept Heading Law (Zero `&`, Zero `/`, Zero Compound `X and Y` Titles)
Why compound headings fail: Joining two or three nouns with `&`, `/`, or `and` (such as `Direct Payments & Taxes`, `Plans, Quotas & Custom Domains`, `Customer / Sender`, `Workspace & Staff Data`) looks cluttered, wraps unevenly in sidebars and cards, and signals indecisive information architecture.
- **The Umbrella Noun Rule (Stripe, Apple, and Linear Standard)**:
  - Every UI label, table column, tab, card heading, documentation title, legal policy clause (`<h2>`), and bullet lead-in (`<strong>`) MUST use **one single umbrella concept (1–2 words)**.
  - **NEVER** use `&` or `/` in any heading, label, badge, button, or bullet title.
  - **NEVER** replace `&` with `and` just to bypass a character check (`Direct Payments & Taxes` -> `Direct Payments and Taxes` is STILL a violation). Pick the single overarching noun (`Payments`).
- **Examples**:
  - **Forbidden**: `Scope & Operator`, `Direct Payments & Taxes`, `Plans, Quotas & Custom Domains`, `Liability, Indemnification & Law`, `Customer CRM & Loyalty`, `Security, Retention & Rights`
  - **Good**: `Overview`, `Payments`, `Subscriptions`, `Liability`, `Customer CRM`, `Data Security`, `Data Retention`

---

## 2. Zero Action-Verb Echo (Anti-Repetition Discipline)
Never repeat the primary CTA verb inside adjacent card headings, subtitles, or badges:
- **Bad (Echoing "Download")**:
  - Heading: `Download DING OS for Windows`
  - Row 1: `Windows Installer` -> `[Download]`
  - Primary CTA: `[Download (DING-OS-Setup.exe)]`
- **Good (Crisp Product Noun + Distinct Action)**:
  - Heading: `DING OS for Windows` (`DING OS cho Windows`)
  - Primary CTA: `[Download]` (`DING-OS-Setup-2.4.0.exe`)
  - Format Rows: `[.EXE]`, `[.ZIP]`, `[ARM64]`, `[x64]`, `[.DEB]`, `[AppImage]`
- **Rule**: Card titles name the **entity or edition** (`DING OS for macOS`, `Business Plan`, `Counter Terminal`). Buttons name the **action or target format** (`Download`, `App Store`, `Google Play`, `Save`, `Verify`).

---

## 3. Channel-Native Distribution Terminology
Match distribution terminology to how real users actually install software on each platform:
- **Desktop OS (`Windows`, `macOS`, `Linux`)**: Direct signed binaries (`.exe`, `.dmg`, `.deb`, `.AppImage`) and package manager CLI commands (`winget`, `brew`, `curl`).
- **Mobile OS (`iOS`, `iPadOS`, `Android`)**: Official app stores (**`App Store`** and **`Google Play`**) with automatic updates and QR workspace pairing. Never present consumer iOS or Android mobile apps as raw `.ipa` file downloads.

---

## 4. Ultra-Concise Button and Grid Title Discipline (Single-Line Alignment Law)
- **1-Word Priority (Max 2 Short Words)**: Buttons, badges, tabs, and table column headers must use 1 word (or at most 2 short words):
  - Buttons: `Download`, `App Store`, `Google Play`, `Web Terminal` (`Mở Web`), `Copy`, `Verify`, `Save`, `Connect`, `Send`, `Discard`.
  - Table Headers: `Domain`, `Type`, `Status`, `Reference`, `Customer`, `Channel`, `Unit`, `Total`.
- **Single-Line Grid Card Titles**: In 3-column and 4-column card grids, all card titles must be concise enough (<= 16 characters) to sit on a single aligned line (`whitespace-nowrap` or `truncate`) so adjacent cards never mix 1-line and 2-line headings.
- **Mandatory `whitespace-nowrap shrink-0` on Action Controls**: Every button and action link inside flex or grid cards must include `whitespace-nowrap shrink-0` so text never breaks onto two lines across any of the 14 supported locales.

---

## 5. Natural, Human-First Prose (Zero AI Slop)
Combine with `.agents/skills/humanizer/SKILL.md`:
1. **Cut Filler and Throat-Clearing**: Remove phrases like *"In order to"*, *"It is important to note that"*, *"Seamlessly empower your workflow"*, or *"Next-generation revolutionary platform"*.
2. **Concrete Numbers Over Vague Superlatives**: Write `< 15 MB RAM`, `880Hz chime`, `14 languages`, and `Save up to 30%` instead of *"ultra-lightweight"*, *"super fast"*, or *"massive savings"*.
3. **Zero Em-Dashes (Always Use `-` Instead)**: Never use the em-dash character (`\u2014`) in UI strings, translation files, notifications, or prose, as it is a signature hallmark of AI-generated text. Use a standard hyphen (`-`), a comma, or a period instead.
4. **Native Idiomatic Localization Across All 14 Locales**:
   - Do not translate word-for-word from English when it sounds robotic in Vietnamese, Japanese, Korean, or European languages.
   - Example (`vi`): Write `"DING OS cho Windows"`, `"Mở Web"`, `"Tải trực tiếp trên Apple App Store"` instead of clunky literal translations.

---

## 6. Sentence Case & Anti-Title-Case / Anti-UPPERCASE Law (Apple HIG · Stripe · Linear · Vercel Standard)
Overusing Title Case (`Capitalizing Every Single Word In Headings, Cards, And Policies`) or `ALL CAPS` (`UPPERCASE` text/CSS) destroys reading rhythm, obscures proper nouns, looks amateurish, and violates standard orthography in Vietnamese and European languages:
1. **Default to Sentence Case Everywhere (UI, Marketing, Help Center & All Policy Stores)**:
   - Apply **Sentence case** across all headings (`h1`–`h6`), hero titles, card titles, subtitles, form labels, navigation links, buttons, badges, tabs, table headers (`th`), checklist bullets, FAQ questions, and **all legal/policy stores** (`content/**/*.md`, `policies.json`, `enterprise_policies_seed.json`, `seed_policies.py`, inline policy TSX).
   - Capitalize **only the first letter** of the heading/clause/label/sentence, plus genuine **proper nouns, product/brand names, geographical names, and acronyms** (`DING OS`, `OneUID`, `Trip Express`, `SHAN`, `SHAN Privé`, `SHAN Holdings`, `VietQR`, `QR`, `AI`, `VIP`, `CRM`, `POS`, `PMS`, `KDS`, `B2B`, `GDPR`, `PDPA`, `PCI-DSS`, `AES-256-GCM`, `DPoP`, `OIDC`, `Stripe`, `PayPal`, `Wise`, `Revolut`, `Square`, `Windows`, `macOS`, `Linux`, `Android`, `iOS`, `iPadOS`, `App Store`, `Google Play`, `210 Diep Minh Chau, Hoa Xuan Ward, Da Nang City, Vietnam`, `210 Diệp Minh Châu, Phường Hòa Xuân, Thành phố Đà Nẵng, Việt Nam`, `Sở Kế hoạch và Đầu tư TP. Đà Nẵng`, `Da Nang DPI`, `Dec 18, 2023`, `Trip Express Vietnam Company Limited`, `Công ty TNHH Trip Express Việt Nam`).
   - **Never Capitalize Common Nouns Mid-Sentence**: In Vietnamese and English legal/marketing prose, never capitalize common nouns mid-sentence (write `"bên kiểm soát dữ liệu độc lập"`, `"chính sách bảo mật"`, `"điều khoản dịch vụ"`, `"nhà cung ứng"`, `"hội viên"` — NEVER `"Bên Kiểm Soát Dữ Liệu Độc Lập"`, `"Chính Sách Bảo Mật"`, `"Điều Khoản Dịch Vụ"`).
   - **Bad (`vi`)**: `"Chốt Đơn Nhanh, Giữ Chân Khách Quen Và Tính Thưởng Tự Động"`, `"Điều 3: Các Hạng Hội Viên, Phí Hội Viên Và Điều Khoản Thanh Toán"`
   - **Good (`vi`)**: `"Chốt đơn nhanh, giữ chân khách quen và tính thưởng tự động"`, `"Điều 3: Các hạng hội viên, phí hội viên và điều khoản thanh toán"`
   - **Bad (`en`)**: `"Scheduled Counter Pickup Or Direct Delivery"`, `"Clause 4: The 4-Step Technical Contract Formation Process"`
   - **Good (`en`)**: `"Scheduled counter pickup or direct delivery"`, `"Clause 4: The 4-step technical contract formation process"`
2. **German (`de`) Orthography**:
   - Capitalize the first word of a sentence/label and all German nouns (`Substantive`), never verbs (`sparen`, `behalten`), adjectives, or prepositions/conjunctions (`oder`, `und`, `für`, `mit`, `in`, `zu`, `bei`).
3. **Strict Ban on `UPPERCASE` / CSS `uppercase` Overuse**:
   - **NEVER** write multi-word sentences, descriptions, legal disclaimers, card titles, button labels, table headers, or subheadings in `ALL CAPS`, and **NEVER** apply `uppercase tracking-widest` CSS to buttons, card titles, badges, or paragraphs.
   - Reserve `UPPERCASE` strictly for: (a) genuine acronyms and ISO currency/country codes (`USD`, `VND`, `EUR`, `AI`, `QR`, `VIP`, `API`, `SSO`, `SLA`, `FAQ`, `VAT`, `MST`); and (b) short 1–2 word muted structural footer column headers or compact `10px–11px` eyebrow micro-labels where dictated by the brand's typographic scale.
4. **Unboxed Fine-Print Footer Legal Disclosures (Zero Boxed Footer Cards)**:
   - Never place corporate ownership disclosures, tax IDs (`0402217820`), or registration licenses inside bordered/shaded card boxes (`bg-[#161618] rounded-xl p-4`, `bg-muted/30 border rounded-lg`) in the footer columns. Render statutory corporate disclosures cleanly as unboxed muted fine print (`text-[11px] text-zinc-500`) in the bottom copyright bar.
