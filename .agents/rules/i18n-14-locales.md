# Full 14-Locale Exhaustive i18n Synchronization Law

The entire ecosystem (`DING OS`, `Trip Express`, `OneUID`, and `SHAN`) is standardized on **14 canonical international locales**:
1. `ar` (Arabic)
2. `de` (German)
3. `en` (English)
4. `es` (Spanish)
5. `fr` (French)
6. `it` (Italian)
7. `ja` (Japanese)
8. `ko` (Korean)
9. `pt` (Portuguese)
10. `ru` (Russian)
11. `th` (Thai)
12. `vi` (Vietnamese)
13. `zh-hans` (Simplified Chinese)
14. `zh-hant` (Traditional Chinese)

## Mandatory Constraints (Zero `en`/`vi`-Only Edits)
- **STRICT BAN ON `en`/`vi`-ONLY UPDATES**: Whenever adding, modifying, or refactoring translation keys, pricing tiers, UI labels, checkout fee explanations, badges, or error messages, agents and subagents **MUST NEVER update only `en` and `vi`**.
- **SYNCHRONOUS 14-LOCALE PARITY**: Every single change to an i18n file MUST be applied across all **14 locale files** in the same turn with accurate, native, idiomatic translations matching the product's tone and Sentence case rules.
- **AUTOMATED CI / RELEASE GATE**: `python3 scripts/release.py` enforces 100% key parity across all 14 locales before any version bump or release is permitted.
