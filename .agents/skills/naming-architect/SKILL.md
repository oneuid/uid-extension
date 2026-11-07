---
name: naming-architect
description: Principal Naming Architect & Identifier Gatekeeper (LEXICON) distilled from Rob Pike & Ken Thompson (Go & Unix Naming Discipline), Stripe API Design, Linear Engineering, and Martin Fowler Ubiquitous Language. Governs allocation and approval of all file names, route paths, database columns, classes, functions, variables, and JSON keys across DING OS, Trip Express, OneUID, and SHAN. Enforces 1-word file names, 1-2 word function/type names, context-aware prefix stripping, and automated AST length/token auditing. Use BEFORE creating or renaming any file, function, class, component, hook, store field, or API endpoint.
---

# Naming Architect & Identifier Gatekeeper (`naming-architect` / `LEXICON`)

## 1. Mission & Hard Veto Authority
The **Naming Architect (`LEXICON`)** holds **Hard Veto Power** over every identifier introduced across `ding`, `trip`, `uid`, and `shan`.
Verbose, multi-clause identifiers (`isSystemOrNoReplyEmail`, `is_self_forwarding_mailbox`, `_sync_peer_conversation_reply`, `harvest_and_sync_contacts`, `maskEmailForColleague`) are a primary tell of uncurated AI code. They bloat imports, wrap lines, obscure domain logic, and drift across tiers.

**Core Law (Rob Pike's Go Proverb)**:
> *"The greater the distance between a name's declaration and its uses, the longer the name should be — **but never repeat the package, module, or receiver type in the name**."*
- Inside `apps/sales/services/intent.py`, the module is already `intent`: write `check_risk()`, `is_no_reply()`, `is_self_mail()`, `reply_policy()`, `reply_target()` — NEVER `inspect_phishing_risk()`, `is_automated_sender()`, `is_self_forwarding_mailbox()`, `evaluate_reply_policy()`.
- Inside `lib/store/membership.ts`, the module is already `membership`: write `isNoReply()`, `parseContact()`, `maskEmail()`, `maskPhone()`, `upsertContact()` — NEVER `isSystemOrNoReplyEmail()`, `parseContactIdentity()`, `maskEmailForColleague()`, `upsertContactFromMessage()`.

---

## 2. Strict Token & Character Budgets

| Artifact | Max Words | Max Chars | Canonical Examples | Banned Anti-Patterns |
| :--- | :---: | :---: | :--- | :--- |
| **File / Directory** | **1 word** (max 2) | `14` | `inbox.py`, `intent.py`, `outbound.py`, `compose.tsx`, `billing.tsx` | `workspace-billing-client.tsx`, `saas-invoice-service.ts` |
| **API Route Segment** | **1 word** | `14` | `/api/inbox/support`, `/api/qr/inspect`, `/v1/cases/` | `/api/ding/workspace-cases`, `/v1/inbox/root-support-ticket/` |
| **Class / Component / Type** | **1–2 words** | `18` | `Composer`, `SupportView`, `PartnerEntry`, `Invoice`, `BillingView` | `WorkspaceBillingClient`, `PartnerDirectoryEntry`, `RootSupportTicketView` |
| **Function / Method / Hook** | **1–2 words** (hard cap 3) | `20` | `isNoReply`, `isSelfMail`, `checkRisk`, `syncContacts`, `useDirectory`, `_sync_peer`, `_upsert_partner` | `isSystemOrNoReplyEmail`, `is_self_forwarding_mailbox`, `_sync_peer_conversation_reply` |
| **Field / Prop / JSON Key** | **1–2 words** | `16` | `reference`, `organization_id`, `subtotal`, `tax`, `total`, `passport` | `booking_ref`, `invoiceAmountUsd`, `customer_tax_id`, `raw_subject` |
| **Local Variable** | **1 word** (max 2) | `14` | `org`, `conv`, `msg`, `peer`, `risk`, `policy`, `target` | `existingConversationRecord`, `resolvedRecipientEmailAddress` |

---

## 3. The 5 Naming Distillation Rules

### Rule 1: Strip Module & Receiver Echoes
Never repeat the enclosing directory, file name, or model name inside the function or field name:
- In `apps/sales/views/inbox.py`:
  - `_sync_peer(conv, msg)` instead of `_sync_peer_conversation_reply(conversation, outbound_msg)`
  - `_upsert_partner(...)` instead of `_upsert_root_tenant_contact(...)`
  - `_purge(conv)` instead of `_purge_conversation_permanently(conversation)`
- In `apps/sales/services/outbound.py`:
  - `self_mailboxes(org_id)` instead of `get_organization_self_mailboxes(organization_id)`

### Rule 2: Ban Conjunctions (`Or`, `And`, `With`, `For`, `From`, `To`) in Function Names
A function name with `Or` / `And` / `For` / `From` almost always leaks implementation details instead of stating the domain concept:
- `isSystemOrNoReplyEmail` $\rightarrow$ **`isNoReply`**
- `harvest_and_sync_contacts` $\rightarrow$ **`sync_contacts`**
- `maskEmailForColleague` $\rightarrow$ **`maskEmail`**
- `maskPhoneForColleague` $\rightarrow$ **`maskPhone`**
- `upsertContactFromMessage` $\rightarrow$ **`upsertContact`**
- `buildMatrixFromFormula` $\rightarrow$ **`buildMatrix`**

### Rule 3: Use Canonical Verbs (`1 Verb + 1 Noun`)
Standardize on a tight vocabulary of verbs across Python and TypeScript:
- **Boolean predicates (`is_*` / `has_*` / `can_*`)**: `is_no_reply` / `isNoReply`, `is_self_mail` / `isSelfMail`, `is_bank` (instead of `is_official_bank_sender`), `has_hold` (instead of `_has_transactional_hold`).
- **Lookups & Resolvers**: `resolve_root` (instead of `resolve_root_organization`), `reply_target` (instead of `resolve_reply_target`), `reply_policy` (instead of `evaluate_reply_policy`), `check_risk` (instead of `inspect_phishing_risk`).
- **Mutations**: `sync_peer`, `sync_contacts`, `upsert_partner`, `upsertContact`, `purge_conv`.

### Rule 4: Canonical Domain Nouns (Zero Synonym Drift)
- Always use `reference` (never `ref`, `booking_ref`, `invoice_ref`).
- Always use `organization_id` (never `org_id` in DB/API payloads, never `tenant_id`).
- Always use `subject` (never `raw_subject`).
- Always use `subtotal`, `discount`, `net`, `tip`, `tax`, `total`, `rate` (never `amountUsd`, `taxValue`).

### Rule 5: Pre-Commit AST Audit (`scripts/naming_audit.py`)
Before committing new or modified code, run:
```bash
python3 /home/s/Projects/getding.io/.agents/skills/naming-architect/scripts/naming_audit.py <paths...>
```
to verify zero new functions, classes, or files violate the token/length budget.
