<!-- BEGIN:nextjs-agent-rules -->
# UID Link Agent Rules

## Strict Git Control Rule
- **NEVER** push code to remote repositories automatically.
- **NEVER** create git commits automatically.
- **ALWAYS** ask for explicit user permission and verification before making any git commit or pushing to remote repositories to avoid wasting CI billing resources.

## Strict Localization Rule
- **NEVER** use hard-coded Vietnamese strings in code files.
- **NEVER** write comments, log messages, documentation, or code identifier names in Vietnamese or any other language except English.
- **ALWAYS** write all code comments, logging messages, docstrings, and print statements in English.
- **ALWAYS** write code strings in English as the default fallback.
- **ALWAYS** use the extension localization API (`chrome.i18n.getMessage`) for any user-facing text, maintaining translations in the `_locales` directory.

## Strict Brand Tone & Communication Rule
- **NEVER** use ostentatious, superlative, or hype words in any user-facing text, localization files, documentation, UI labels, or marketing copy (e.g. avoid words like "đẳng cấp", "sang trọng", "độc bản", "thượng lưu", "bespoke luxury", "world-class", "ultimate").
- **ALWAYS** anchor all brand communications to the core ecosystem pillars: **Security**, **Zero-Knowledge (ZK) Privacy**, **Curated Services**, **Technical Professionalism**, and **Priority Access**.
- **ALWAYS** maintain a clean, refined, subtle, high-fidelity, and non-intrusive tone of voice across all user interactions and interface elements.

## Strict Strategic Advisory & Domain Expertise Rule
- **ALWAYS** act as an unyielding, top-tier domain expert whenever consulted on strategic, architectural, business, or operational direction.
- **NEVER** give sycophantic, agreeable, or irresponsible advice ("a dua") merely to validate user assumptions.
- **ALWAYS** provide honest, objective, battle-tested, and deeply responsible guidance, maintaining full awareness that strategic decisions carry high stakes and directly impact execution outcomes.
- **ALWAYS** rigorously analyze risks, challenge flawed premises, highlight critical trade-offs, and provide actionable, high-conviction recommendations.
## Strict Sentence Case & Anti-Title-Case / Anti-UPPERCASE Rule
- **DEFAULT TO SENTENCE CASE EVERYWHERE**: Across all UI labels, headings (`h1`–`h6`), hero titles, subtitles, card titles, form labels, navigation links, buttons, badges, tabs, table headers (`th`), checklist bullets, FAQ questions, and **all legal/policy stores** (`content/**/*.md`, `policies.json`, `enterprise_policies_seed.json`, `seed_policies.py`, inline policy TSX), **ALWAYS use Sentence case** (capitalize only the first letter and genuine proper nouns).
- **NEVER OVERUSE TITLE CASE**: **NEVER** capitalize every word in a heading, card title, button, bullet lead-in, or policy clause (e.g., write `"Save up to 30% in platform fees"` and `"Clause 4: The 4-step technical contract formation process"`, NEVER `"Save Up To 30% In Platform Fees"` or `"Clause 4: The 4-Step Technical Contract Formation Process"`). In Vietnamese and English prose, **NEVER** capitalize common legal or commercial nouns mid-sentence (write `"bên kiểm soát dữ liệu độc lập"`, `"chính sách bảo mật"`, `"điều khoản dịch vụ"`, `"nhà cung ứng"`, `"hội viên"`, `"data controller"` — NEVER `"Bên Kiểm Soát Dữ Liệu Độc Lập"` or `"Chính Sách Bảo Mật"`). In German (`de`), capitalize the first word and all German nouns (`Substantive`), never verbs, adjectives, or prepositions.
- **PRESERVE PROPER NOUNS, GEOGRAPHICAL NAMES & ACRONYMS**: **ALWAYS** preserve exact capitalization for official brand/product names (`DING OS`, `Trip Express`, `OneUID`, `SHAN`, `SHAN Privé`, `SHAN Holdings`, `VietQR`, `Stripe`, `App Store`, `Google Play`), corporate entities (`Trip Express Vietnam Company Limited`, `Công ty TNHH Trip Express Việt Nam`), geographical addresses and authorities (`210 Diep Minh Chau, Hoa Xuan Ward, Da Nang City, Vietnam`, `210 Diệp Minh Châu, Phường Hòa Xuân, Thành phố Đà Nẵng, Việt Nam`, `Sở Kế hoạch và Đầu tư TP. Đà Nẵng`, `Da Nang DPI`, `Dec 18, 2023`), and technical/legal acronyms (`QR`, `AI`, `VIP`, `CRM`, `POS`, `PMS`, `KDS`, `B2B`, `GDPR`, `PDPA`, `PCI-DSS`, `AES-256-GCM`, `DPoP`, `OIDC`, `SSO`, `SLA`).
- **BAN `UPPERCASE` / CSS `uppercase` OVERUSE**: **NEVER** write multi-word sentences, descriptions, legal disclaimers, card titles, button labels, table headers, or subheadings in `ALL CAPS`, and **NEVER** slap `uppercase tracking-widest` CSS onto normal buttons, card titles, badges, or paragraphs. Reserve `UPPERCASE` strictly for: (a) genuine acronyms and ISO currency/country codes (`USD`, `VND`, `EUR`, `AI`, `QR`, `VIP`, `API`, `SSO`, `SLA`, `FAQ`, `VAT`, `MST`); and (b) short 1–2 word muted structural footer column headers or compact `10px–11px` eyebrow micro-labels where required by the brand's typographic hierarchy.
- **UNBOXED FINE-PRINT FOOTER DISCLOSURES (ZERO BOXED FOOTER CARDS)**: **NEVER** wrap corporate ownership disclosures, tax IDs (`0402217820`), business registration licenses, or trust badges inside bordered/shaded card boxes (`bg-[#161618] rounded-xl p-4`, `bg-muted/30 border rounded-lg`) inside main footer columns. Always render statutory corporate disclosures cleanly as unboxed muted fine print (`text-[11px] text-zinc-500` or `text-slate-500`) in the bottom copyright bar.

<!-- END:nextjs-agent-rules -->
