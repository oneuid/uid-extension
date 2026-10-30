---
name: legal-compliance
description: Enterprise Legal, Regulatory Compliance, Anti-Litigation Copywriting, Comparative Advertising Substantiation, Nominative Fair Use, GDPR and PDPA Data Controller Separation, AI Liability Shield, and Single-Concept Policy Architecture (distilled from Stripe, Apple, Linear, FTC Advertising Substantiation, GDPR, PDPA, and EU AI Act). Use whenever writing or auditing marketing claims, pricing comparisons, Terms of Service, Privacy Policies, Cookie Policies, or AI and payment disclaimers across DING OS, Trip Express, OneUID, and SHAN.
---

# Legal Counsel and Regulatory Compliance Skill (`legal-compliance`)

Distilled from **Stripe, Apple, and Vercel Enterprise Legal Standards**, **FTC Comparative Advertising Principles**, **Nominative Fair Use Doctrine**, and **GDPR, CCPA, and PDPA Data Privacy Frameworks**.

Whenever writing, reviewing, or updating marketing copy, comparison matrices, onboarding flows, checkout disclosures, or legal policy pages (`Terms`, `Privacy`, `Cookies`, `Refunds`), apply the following **8 Ironclad Legal Guardrails**.

---

## 1. Single-Concept & Sentence-Case Policy Architecture (Stripe and Apple Standard — Zero `&`, Zero `/`, Zero Title Case Overuse)
Top-tier enterprise legal documents (Stripe, Apple, Linear, Vercel) never use messy compound headings with ampersands (`&`), slashes (`/`), or unnatural Title Case (`Clause 4: The 4-Step Technical Contract Formation Process`, `Điều 3: Các Hạng Hội Viên, Phí Hội Viên Và Điều Khoản Thanh Toán`).
1. **Sentence-Case Headings & Clauses**:
   - Every policy title, clause heading (`#`, `##`, `###`), table header, and bold bullet lead-in (`**1.1 Intermediary capacity:**`) across all policy stores (`content/**/*.md`, `policies.json`, `enterprise_policies_seed.json`, `seed_policies.py`, inline policy TSX) MUST use **Sentence case** (capitalizing only the first letter and genuine proper nouns/acronyms like `DING OS`, `Trip Express`, `OneUID`, `SHAN`, `GDPR`, `PDPA`, `PCI-DSS`, `AES-256-GCM`, `DPoP`).
   - **Never Capitalize Common Legal Nouns Mid-Sentence**: In Vietnamese and English policy body text, write `"bên kiểm soát dữ liệu độc lập"`, `"chính sách bảo mật"`, `"điều khoản dịch vụ"`, `"nhà cung ứng"`, `"hội viên"`, `"data controller"` — NEVER `"Bên Kiểm Soát Dữ Liệu Độc Lập"` or `"Chính Sách Bảo Mật"`.
   - **Terms of Service Canonical Sections**:
     1. `1. Overview` (`1. Tổng quan`)
     2. `2. Services` (`2. Dịch vụ`)
     3. `3. Customer data` (`3. Dữ liệu khách hàng`)
     4. `4. AI features` (`4. Tính năng AI`)
     5. `5. Payments` (`5. Thanh toán`)
     6. `6. Subscriptions` (`6. Gói thuê bao`)
     7. `7. Intellectual property` (`7. Sở hữu trí tuệ`)
     8. `8. Disclaimers` (`8. Tuyên bố miễn trừ`)
     9. `9. Liability` (`9. Trách nhiệm pháp lý`)
     10. `10. Governing law` (`10. Luật áp dụng`)
   - **Privacy Policy Canonical Sections**:
     1. `1. Data controller` (`1. Chủ sở hữu dữ liệu`)
     2. `2. Information collected` (`2. Dữ liệu thu thập`)
     3. `3. Data isolation` (`3. Cô lập dữ liệu`)
     4. `4. Data processing` (`4. Xử lý dữ liệu`)
     5. `5. Data security` (`5. Bảo mật dữ liệu`)
     6. `6. Data retention` (`6. Lưu trữ dữ liệu`)
     7. `7. Contact` (`7. Liên hệ`)
   - **Cookie Policy Canonical Sections**:
     1. `1. Overview` (`1. Tổng quan`)
     2. `2. Essential cookies` (`2. Cookie thiết yếu`)
     3. `3. Telemetry` (`3. Dữ liệu kỹ thuật`)
     4. `4. Preferences` (`4. Tùy chọn trình duyệt`)
2. **Zero Redundant Metadata Boxes & Unboxed Footer Disclosures**: State the operating legal entity, tax ID, and headquarters once in `1. Overview` (or `1. Data controller`) and contact details in the final clause. In site footers, render corporate ownership and registration disclosures as clean, unboxed muted fine print in the bottom copyright bar — never inside a bordered card box in the brand column.

---

## 2. Anti-Litigation Comparative Copy (FTC Substantiation)
1. **Mandatory Range Qualifiers ("Up to", "Typical", "Estimated")**:
   - **NEVER** state an absolute, unqualified financial saving or revenue lift as a guaranteed outcome (Forbidden: `"Save 30% Fees"`, `"Tiết kiệm 30% Phí"`, `"Keep Your 30% Margin"`).
   - **ALWAYS** qualify numerical savings and performance metrics with **"up to"** (*"Save up to 30% Fees"*, *"Tiết kiệm đến 30% Phí"*, *"Keep up to 30% More Margin"*).
2. **No Competitor Disparagement in Comparative Claims**:
   - In comparative marketing headlines, hero sections, and comparison matrices (`why_us`), **DO NOT** disparage or accuse specific named third-party trademarks.
   - Instead, use **industry-standard category nouns**:
     - English: *"third-party marketplaces, OTAs, social commerce platforms, and delivery apps"*
     - Vietnamese: *"các sàn trung gian, OTA, sàn thương mại xã hội và ứng dụng giao hàng"*
3. **Nominative Fair Use for Technical Interoperability Only**:
   - Third-party brand names may **ONLY** be mentioned when factually describing technical format compatibility or user-initiated workflow integrations, protected by a Nominative Fair Use disclaimer in the Terms of Service.

---

## 3. Data Privacy Shield: Independent Data Controller Separation
1. **Merchant as Independent Data Controller**:
   - The Merchant owns and controls their first-party customer list, order history, and loyalty rules.
   - The Merchant is **100% solely responsible** for obtaining lawful buyer consent (Opt-In) before sending promotional messages, loyalty notifications, or re-selling campaigns, and for complying with anti-spam and data protection laws (GDPR, CCPA, PDPA, Decree 13/2023/ND-CP).
2. **Platform as Data Processor**:
   - DING OS (`getding.io`) processes buyer data strictly on behalf of the Merchant according to the Merchant's configuration and assumes **zero liability** for unauthorized marketing or spam conducted by a Merchant.

---

## 4. Assistive AI, Order Reconciliation, and Complete Liability Exemption Shield
1. **No Autonomous Price Invention**:
   - AI Sales Specialist and AI Concierge operate strictly on the catalog prices, rules, and inventory configured by the Merchant or Supplier.
2. **Probabilistic Assistive Nature**:
   - AI chat consultations, product recommendations, upsell suggestions, quote captures (`capture_inquiry`), order drafting (`create_order`), and automated email extractions are **probabilistic, assistive operational tools**. AI outputs may contain inaccuracies, misinterpretations, or omissions and never constitute binding legal, medical, allergen, or financial commitments.
3. **Mandatory Merchant Order Reconciliation (`Đối chiếu đơn hàng`)**:
   - Every AI-assisted order, quote inquiry, booking, or email ingestion triggers a dual-modality alert (880Hz chime and visual notification banner) on the Merchant dashboard specifically so the Merchant and its staff can **audit, reconcile, and confirm** all items, quantities, custom specifications, allergen requirements, prices, taxes, and customer details prior to preparation, dispatch, or settlement.
   - The Merchant is the **sole final decision-maker** and bears **100% ultimate responsibility** for every order, quote, and customer interaction.
4. **Complete Platform Exemption in All Circumstances**:
   - Under no circumstances and under no legal theory (whether in contract, tort, negligence, strict liability, or otherwise) shall the platform (`TRIP EXPRESS VIETNAM COMPANY LIMITED` / `CÔNG TY TNHH TRIP EXPRESS VIỆT NAM`) be liable for any errors, omissions, or hallucinations produced by AI during consultation or order placement, or for the Merchant's failure to audit and reconcile orders with the customer prior to fulfillment.

---

## 5. Non-Custodial Payment Shield
1. **DING OS (`getding.io` Direct QR and Payment Links)**:
   - DING OS is a **software technology provider, not a bank, money transmitter, or escrow agent**.
   - Dynamic QR codes and payment links route funds directly between the buyer and the Merchant's designated bank account or licensed payment processor.
   - DING OS never takes custody of Merchant order proceeds and is not liable for buyer chargebacks, bank settlement delays, or refund disputes.
2. **Trip Express (`trip.express` Marketplace Intermediary Shield)**:
   - Trip Express acts as a technology marketplace connecting travelers with independent third-party mobility, hospitality, and experience operators (`Suppliers`), who bear sole responsibility for physical fulfillment, safety, licensing, insurance, and on-site service quality.

---

## 6. Zero-Knowledge Identity Shield (`uid.one`)
1. **Cryptographic Authentication Scope**:
   - OneUID (`uid.one`) provides federated OIDC authentication (`sub` subject identifier) and WebAuthn passkey verification.
   - Biometric data never leaves the user's local device hardware enclave.
   - Relying Party applications are independently responsible for their own session management and downstream data handling.

---

## 7. Mandatory Liability and Indemnification Clauses
Every ecosystem property (`getding.io`, `trip.express`, `uid.one`, `shan`) MUST maintain clear clauses covering:
1. **Comparative Savings and Trademark Disclaimer**: Clarifying that fee-saving percentages (*"up to 30%"*) reflect typical industry commission ranges rather than a guaranteed financial return, and that third-party trademarks belong to their respective owners.
2. **AI Output Disclaimer and Complete Exemption**: Disclaiming all warranties regarding the accuracy or completeness of AI-generated consultations, translations, quote captures, or order drafts, and exempting the platform in all circumstances from any liability arising from AI outputs or unverified orders.
3. **Merchant Indemnification for AI and Fulfillment**: The Merchant agrees to defend, indemnify, and hold harmless the platform from any buyer, guest, or third-party claims arising out of Merchant products, pricing errors, unverified AI-assisted consultations or orders, custom AI Studio configurations (custom skills, FAQs, SOPs, or disabled tool confirmation guardrails), tax obligations, or unlawful customer marketing.
4. **Limitation of Liability Cap**: Excluding indirect, incidental, consequential, or punitive damages, and capping aggregate platform liability to the total fees paid by the claimant in the preceding twelve (12) months (or $100 USD for free-base accounts).
5. **Force Majeure**: Protecting the platform against liability from upstream telecom, cloud, DNS, email provider, LLM provider, or banking network disruptions.

---

## 8. Multi-Locale Synchronization and Corporate Entity Naming Rule (14 Locales)
1. **14-Locale Synchronization**:
   - Synchronize all legal qualifiers and policy updates across all **14 international locales**: `ar`, `de`, `en`, `es`, `fr`, `it`, `ja`, `ko`, `pt`, `ru`, `th`, `vi`, `zh-hans`, `zh-hant`.
2. **Language-Matched Corporate Entity Naming (No Parenthetical Bilingual Mixing)**:
   - **Vietnamese (`vi`)**: Always use the official Vietnamese legal name **`CÔNG TY TNHH TRIP EXPRESS VIỆT NAM`** (Mã số thuế: `0402217820`, Địa chỉ: `210 Điệp Minh Châu, Thành phố Đà Nẵng, Việt Nam`).
   - **English (`en`) and All Other Locales**: Always use the official English legal name **`TRIP EXPRESS VIETNAM COMPANY LIMITED`** (Tax ID: `0402217820`, Headquarters: `210 Diep Minh Chau, Da Nang City, Vietnam`).
   - **STRICTLY FORBIDDEN**: **NEVER** combine both names in parentheses such as `TRIP EXPRESS VIETNAM COMPANY LIMITED (CÔNG TY TNHH TRIP EXPRESS VIỆT NAM)`.
