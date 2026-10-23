---
name: senior-craft
description: Senior Engineering Craftsmanship distilled from Karpathy Skills, Ponytail, Superpowers, Matt Pocock, Graphify, and Taste Skill. Enforces the Lazy Senior Dev Decision Ladder (YAGNI, repo reuse, platform primitives), Surgical Changes, Codebase Knowledge-Graph Mapping, Ubiquitous Domain Language, Anti-Slop UI Craftsmanship, and Goal-Driven Verification. Use across all tasks before designing, coding, or refactoring.
---

# Senior Engineering Craftsmanship (`senior-craft`)

Distilled from **Karpathy Skills** (`multica-ai/andrej-karpathy-skills`), **Ponytail** (`DietrichGebert/ponytail`), **Superpowers** (`obra/superpowers`), **Matt Pocock Skills** (`mattpocock/skills`), **Graphify** (`Graphify-Labs/graphify`), and **Taste Skill** (`Leonxlnx/taste-skill`).

---

## 1. Think Before Coding & Spec Grilling (Karpathy + Matt Pocock)
- **Surface Assumptions Explicitly**: Do not guess silently when requirements are ambiguous. If multiple interpretations exist, surface the tradeoff concisely or grill the spec before writing code.
- **Push Back on Complexity**: If a requested approach introduces unnecessary tables, abstractions, or edge cases, propose the simpler architectural path immediately.
- **Ubiquitous Domain Language (1 Canonical Word)**:
  - Use a single canonical domain noun across database models, serializers, API payloads, and UI stores:
    - Financial amounts: `subtotal`, `discount`, `net`, `tip`, `tax`, `total`, `rate` (NEVER write freshman-style compound identifiers like `invoiceAmountUsd`, `tipAmountUsd`, `resolvedTotalUsd`, `defaultTipRate`, or `calculatedTaxValue`).
    - Identifiers & references: `reference` (NEVER `ref`, `booking_ref`, `invoice_ref`, `channel_ref`, `order_ref`), `organization_id` (NEVER `org_id` or `tenant_id`).
    - Tax providers: `viettel`, `misa`, `vnpt`, `stripe` (NEVER `viettel_sinvoice`, `misa_meinvoice`, `stripe_tax`).

---

## 2. The Lazy Senior Dev Decision Ladder (Ponytail + Karpathy Simplicity)
*"He says nothing. He writes one line. It works."*

Before writing a single line of code, climb this 4-step ladder in strict order:
1. **Step 1 — Do we need new code or schema at all? (YAGNI)**:
   - Never add speculative features, unrequested configuration flags, or premature abstractions.
   - Never create a second `JSONField` on a Django model (`Organization.metadata`, `Booking._metadata`, `Journal._metadata` already exist) or add new tables when an existing canonical model (`Organization`, `Unit`, `Booking`, `Invoice`, `Receipt`, `Journal`, `Case`) already solves it.
2. **Step 2 — Can we reuse an existing primitive in the ecosystem?**:
   - Check `@/components/ui/*` and `trip.express/web` first. Always clone proven UI components, stores, and patterns before inventing a new widget.
3. **Step 3 — Can the platform or standard library do it natively?**:
   - Prefer native HTML/CSS/Web APIs, SQL `Exists`/`Subquery` expressions, and Python `stdlib`/`Decimal` over 300-line custom helpers.
4. **Step 4 — Write 50 lines instead of 200 (Zero Compromises on Safety)**:
   - Write the shortest, flattest code that solves the exact problem.
   - **Never cut**: multi-tenant `organization_id` RLS scoping, input validation, `transaction.atomic()` state safety, error handling, or keyboard/screen-reader accessibility.

---

## 3. Codebase-as-Knowledge-Graph Navigation (Graphify)
- **Trace the Graph Before Editing**: Treat the codebase as a deterministic dependency graph rather than isolated text files.
- **Map God Nodes & Shared Contracts**: Before modifying a shared model, serializer, store, or type (`Organization`, `Unit`, `Booking`, `Invoice`, `Receipt`, `Reservation`), trace all callers, API routes, and UI consumers first so changes remain 100% atomic across producers and consumers.
- **Zero Duplicate Logic**: Never create parallel helper files (`*-v2.ts`, `*-helper.ts`, `*-service.ts`) when a canonical module (`lib/services/api.ts`, `apps/finances/services/tax.py`) already owns that domain node.

---

## 4. Surgical Changes Only (Karpathy Surgical Discipline)
- **Touch Only What You Must**: Every changed line must trace directly to the user's request.
- **Zero Drive-By Refactors**: Do not reformat, rename, or reorganize unbroken adjacent code unless asked.
- **Clean Up Your Own Orphans**: If your edit renders an import, variable, or helper unused, remove that dead code immediately.

---

## 5. Anti-Slop UI Craftsmanship (Taste Skill)
- **Ban Generic AI UI Tropes**:
  - Zero marketing fluff in operational headers (`"0% Ads"`, `"AI-Powered Next-Gen Terminal"`).
  - Zero nested cards (`Card` inside `Card` inside `Card`) — use a single flat card container (`rounded-2xl border p-6`) and separate inner sections with `gap`, `grid`, or `border-t`.
  - Zero inline status badges jammed next to card titles; keep card headers strictly `[Icon + 2-3 Word Title]` on the left and a single primary control (`<Switch>` or `<Button size="sm">`) on the right.
  - Zero raw HTML form controls (`<input>`, `<select>`, `<textarea>`); always use `@/components/ui/*` primitives.
- **Financial & Data Precision**:
  - Always apply `tabular-nums` (`font-mono`) on prices, quantities, timestamps, and tax/tip breakdowns.
  - Hide zero-value optional rows cleanly (e.g., hide `Tip` row when `tip === 0`) to keep receipts and folios crisp.

---

## 6. Goal-Driven Execution & Red/Green Verification (Superpowers + Karpathy)
- **Define Verification Criteria First**: Formulate concrete, testable success criteria before editing files.
- **Mandatory Pre-Completion Verification**:
  - Frontend: Run `npx tsc --noEmit --incremental false` and verify zero type errors.
  - Backend: Run Python AST compilation and targeted test suites (`pytest` / `manage.py test`), verifying `select_related`/`prefetch_related` query hygiene and `organization_id` isolation.
  - i18n: When touching user-facing copy, update all **14 canonical locales** (`ar`, `de`, `en`, `es`, `fr`, `it`, `ja`, `ko`, `pt`, `ru`, `th`, `vi`, `zh-hans`, `zh-hant`) atomically.
