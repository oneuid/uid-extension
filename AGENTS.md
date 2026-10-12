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
<!-- END:nextjs-agent-rules -->
