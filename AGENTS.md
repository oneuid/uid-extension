<!-- BEGIN:nextjs-agent-rules -->
# UID Link Agent Rules

## Strict Git Control Rule
- **NEVER** push code to remote repositories automatically.
- **NEVER** create git commits automatically.
- **ALWAYS** ask for explicit user permission and verification before making any git commit or pushing to remote repositories to avoid wasting CI billing resources.

## Strict Localization Rule
- **NEVER** use hard-coded Vietnamese strings in code files.
- **ALWAYS** write code strings in English as the default fallback.
- **ALWAYS** use the extension localization API (`chrome.i18n.getMessage`) for any user-facing text, maintaining translations in the `_locales` directory.
<!-- END:nextjs-agent-rules -->
