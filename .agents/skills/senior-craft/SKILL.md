---
name: senior-craft
description: Senior Engineering Craftsmanship distilled from GitHub Spec Kit (github/spec-kit Spec-Driven Development), NousResearch Hermes Agent (Closed-Loop Skill Evolution, Dialectical User Modeling, Zero-Context-Cost Script Collapse), Vercel Agent Desktop (vercel-labs/agent-desktop Accessibility-Tree Computer Use & Safe-Retry Dispositions), Marty Cagan SVPG & Linear Method (Product Management & SDLC Orchestration), IIBA BABOK v3 & Shape Up (Business & Domain Analysis), Karpathy Skills, Ponytail, Superpowers, Matt Pocock, gstack (Garry Tan), Addy Osmani Agent Skills, ECC (Everything Claude Code), claude-mem, Caveman, Graphify, Taste Skill, Hallmark, Website Cloner, Google Stitch, Playwright Skill, Claude QA Skills, and Security Red-Team. Enforces the 8-Role Executive Council conducted by the PM Maestro (Maestro / Principal PM, Analyst / Principal BA, Operator, Challenger, Innovator, Verifier / Principal QA, Sentinel / Principal AppSec & AI Red-Team, Counsel / Principal Legal), Spec-Driven Development (SDD Phase -1 Gates), Hermes Self-Improving Loop, Epistemic Workflows, Lazy Senior Dev Decision Ladder, High-Signal Communication, and Goal-Driven Verification. Use across all tasks before designing, coding, testing, or refactoring.
---

# Senior Engineering Craftsmanship (`senior-craft`)

Distilled from **Marty Cagan SVPG, Basecamp Shape Up & Linear Method** (`product-manager/SKILL.md` - Principal Product Manager & SDLC Maestro), **GitHub Spec Kit** (`github/spec-kit` - Spec-Driven Development / SDD), **Hermes Agent** (`NousResearch/hermes-agent` - Closed-Loop Skill Evolution, Honcho Dialectical User Modeling & Zero-Context-Cost Script Collapse), **Vercel Agent Desktop** (`vercel-labs/agent-desktop` - Accessibility-Tree Computer Use, Snapshot-Scoped Refs & Safe-Retry Dispositions), **IIBA BABOK v3 & Basecamp Shape Up** (`business-analyst/SKILL.md` - Real-World Operational Workflows & Cross-Module State Machines), **Karpathy Skills** (`multica-ai/andrej-karpathy-skills`), **Ponytail** (`DietrichGebert/ponytail`), **Superpowers** (`obra/superpowers`), **Matt Pocock Skills** (`mattpocock/skills`), **gstack** (`garrytan/gstack`), **Addy Osmani Agent Skills** (`addyosmani/agent-skills`), **ECC** (`affaan-m/everything-claude-code`), **claude-mem** (`thedotmack/claude-mem`), **Caveman** (`JuliusBrussee/caveman`), **Graphify** (`Graphify-Labs/graphify`), **Taste Skill** (`Leonxlnx/taste-skill`), **Hallmark** (`Nutlope/hallmark`), **Website Cloner** (`JCodesMore/ai-website-cloner-template`), **Google Stitch** (`google-labs-code/stitch-skills`), **Playwright Skill** (`testdino-hq/playwright-skill`), **Claude QA Skills** (`neonwatty/qa-skills`), and **OWASP API/LLM Red-Team Standards** (`security-redteam/SKILL.md`).

---

## 1. The 9-Role Executive Council Conducted by the PM Maestro (`Maestro · Analyst · System Designer · UI Designer · Operator · Innovator · Verifier · Sentinel · Counsel` + `gstack`) & Epistemic Engineering (`addyosmani/agent-skills`)
- **Automatic Prompt Optimization & Maestro Orchestration First (No Reminder Needed)**: For every new page, major UI overhaul, or architectural feature request across `ding`, `trip`, `shan`, and `uid`, ALWAYS synthesize an **Optimized Master Prompt & Multi-Expert Architecture Blueprint** conducted by the **Principal PM (`MAESTRO`)** through 9 simultaneous executive lenses before writing implementation code:
  0. **MAESTRO (`product-manager` - Principal Product Manager & SDLC Conductor / "Nhạc trưởng" - `product-manager/SKILL.md`)**:
     - Hold the baton across the entire software development lifecycle: lock the project-specific **Product Charter** (`ding` 4-Engine Agentic OS, `trip` Global OTA & Collection-Agent Marketplace, `shan` Private Guild & 4-Stage Bespoke Escrow, `uid` Zero-Knowledge OIDC), define **Shape Up Appetite & Scope Boundaries** (`In-Scope` vs. `Out-of-Scope` to block scope creep and feature islands), conduct the handoffs across BA -> System Designer -> UI Designer -> 3-Tier Engineering (Backend + Web + Mobile + Desktop) -> 14-Locale i18n -> AppSec -> Legal -> QA -> Release, arbitrate specialist trade-offs, and enforce the 6-point **Definition of Done (`DoD`)** (`FEATURES.md` + `scripts/release.py`).
  1. **ANALYST (`business-analyst` - Principal Business & Domain Analyst, Real-World Journey & State Machine Gatekeeper - `business-analyst/SKILL.md`)**:
     - Audit the **physical and operational reality** before designing UI or schema: eliminate real-world paradoxes (e.g., offline guests needing QR Auto-Connect Wi-Fi before loading a portal; delivery orders needing full recipient/phone/street/driver-note address books; inbound security alerts using 7 concise industry-standard threat labels in 1 single header badge instead of 6 redundant AI warning boxes). Verify cross-module state machine transitions (`Inbox` $\leftrightarrow$ `Booking` $\leftrightarrow$ `Folio/Receivables` $\leftrightarrow$ `CRM Cadence` $\leftrightarrow$ `Tasks/Goals`) and enforce authentic industry terminology over verbose AI prose.
  2. **SYSTEM DESIGNER (`system-designer` - Principal System & Information Designer, Design System & State Topology Lead - `system-designer/SKILL.md`)**:
     - Hold **Hard Structural Veto Power** over Macro-Architecture, Information Architecture (IA), Navigation Hierarchy, State Latency, and Mobile Ergonomics across `ding`, `trip`, `shan`, and `uid` via the **5 Hard Structural Veto Gates**:
       1. **Single Primary Nav Law**: Never stack multiple navigation bars of the same hierarchy (use the Single-Header Quick Switcher `Logo | View ▾` on `< lg`; zero duplicate horizontal tab strips or inconsistent bottom footer navs).
       2. **`375px` Mobile Row Density Budget**: Max 2 interactive groups per mobile row (`Row 1`: View/Sub-tab Switcher + Primary `+ Add` CTA; `Row 2`: `100%` full-width `<SearchBar>` with filters inside its popover/drawer). Ban multi-row `flex-wrap` button soup.
       3. **`1-Primary / N-Contextual` Progressive Disclosure**: At most 1 dominant primary CTA per screen; tuck secondary actions (`Templates`, `Import`, `Export`, `Matrix`) into modals, filter drawers, or desktop-only breakpoints.
       4. **Zero-Latency Data-to-UI State Topology**: Enforce `0ms` optimistic UI transitions, proactive Top-N / hover prefetching, backend payload pre-computation, and Cross-Route App Shell consistency (`w-full px-3.5 sm:px-6`).
       5. **Canonical Primitives, Accessibility-Tree Identity & `break-ui` Resilience**: Compose `@/components/ui/*` primitives, guarantee unique Accessibility-Tree labels (`vercel-labs/agent-desktop`), and pass Emil Kowalski's `break-ui` structural stress test.
  3. **UI DESIGNER (`ui-designer` & `design-language` & `app-store-design` - Principal UI, Visual & Motion Designer, Anti-Slop Gatekeeper - `ui-designer/SKILL.md`, `design-language/SKILL.md`, `app-store-design/SKILL.md`)**:
     - Hold **Hard Visual Veto Power** over Micro-Craft, Brand Visual DNA (`Tactile Precision`, `Kinetic Horizon`, `Cryptographic Minimal`, `Quiet Architectural Luxury`), Geometric Proportions (Concentric Radii $R_{\text{outer}} = R_{\text{inner}} + P$, Control Height Scale, 4-Level Surface Ladder), Optical Typography (`tabular-nums`, Sentence case, zero `/` or `&`, zero `...` clipping, Verb-Toast symmetry), Anthropic's **Two-Pass Design Plan & Chanel's Subtraction Rule** (banning the 5 Default AI Look traps including `#F4F1EA` cream + `#D97757` terracotta Claude-default, nested cards, `border-l-4`, and duplicate titles), Emil Kowalski's **`120fps` Motion Physics** (`transform`/`opacity` only, `scale(0.95)` -> `1`, `blur(2px)` crossfade bridge, 11 `mobile-native` web fixes, Reanimated 4 worklets), Garry Tan's **7-Pass `0-10` Visual Review & Fix-to-10 Loop** (`>= 8.5/10` overall and `>= 7/10` per pass), and **`app-store-design`** (`160px` thumbnail squint test).
  4. **OPERATOR (`plan-eng-review` - Operational Excellence, Unit Economics & Reliability - `backend-architecture/SKILL.md`)**:
     - Optimize for real-world frontline speed (`< 2 taps` at the front desk, cashier counter, or court kiosk), zero-downtime resilience, strict `organization_id` RLS isolation, deterministic pricing/tax/commission math, N+1 query elimination (`select_related`/`prefetch_related`), and `0` compiler errors.
  5. **INNOVATOR (`plan-ceo-review` - 10-Star Founder Vision & Asymmetric Product Leverage)**:
     - Ask Garry Tan's `/plan-ceo-review` question: *"Is this a generic CRUD form, or a 10-star commercial product experience?"* Turn standard workflows into asymmetric competitive advantages: e.g., 1-Click Markdown/Skill Playbook Ingestion in AI Studio, TikTok/Grab-style Saved Address Book for Delivery/Takeaway, Zero-API Email Ingestion, and Sponsored Cross-Merchant Concierge Commerce.
  6. **VERIFIER (`qa` - Principal QA, Functional Tester, `break-ui` Stress-Tester & Release Gatekeeper - `qa-testing/SKILL.md`)**:
     - Practice Addy Osmani's **Doubt-Driven Development** and Emil Kowalski's **`break-ui` Adversarial Stress Test**: never assume code works just because it compiled. Actively try to break your own layout and logic across mobile (`375px-440px` iPhone viewport), RTL `ar`, dark/light modes, extreme data payloads (`0`, `999,999,999`, 80-char names, rapid double-tap race conditions, `320px` -> `1440px` resize during open modals), and `Decimal` ledger invariants. Never claim completion without fresh verification evidence.
  7. **SENTINEL (`security-redteam` - Principal AppSec, Sub-24h AI Exploit Defense & Zero-Leakage Gatekeeper - `security-redteam/SKILL.md`)**:
     - Assume autonomous AI exploit agents will probe every new endpoint within hours. Enforce a **2-Tier Security Verification Cadence**:
       - **Tier 1 (Immediate Post-Feature Shift-Left Gate)**: Immediately after completing any feature/API/UI change, audit for cross-tenant BOLA/IDOR (`organization_id` root scoping), mass assignment (`no __all__` on write serializers), financial race conditions (`transaction.atomic()` + `select_for_update`), indirect AI prompt injection (`<untrusted_input>` fencing), and zero customer PII/secret leakage, running `python3 /home/s/Projects/getding.io/.agents/skills/security-redteam/scripts/security_audit.py`.
       - **Tier 2 (Periodic Deep Red-Team Audit)**: Run deep adversarial sweeps across all backend (`api.getding.io`, `trip.express/x`, `uid.one/uid-core`) and edge repositories (`--strict`) on schedule or before major releases.
  8. **COUNSEL (`legal-compliance` - Principal Legal, Trademark & Regulatory Counsel - `legal-compliance/SKILL.md`)**:
     - Enforce Nominative Fair Use on catalog listings (*"Compatible with [Brand]"* vs. unauthorized brand claims), block counterfeit/replica keywords and unsubstantiated clinical/medical claims, protect reserved well-known trademark handles on `[slug].getding.io`, distinguish fake IP extortion scams from legitimate DMCA notices, and ensure all comparative fee claims carry legally substantiated qualifiers (*"up to 30%"*).
- **Three Epistemic Engineering Habits (`addyosmani/agent-skills`)**:
  1. **Source-Driven Development**: Read the actual target file, adjacent components, and callers before proposing an edit - never guess prop signatures, store fields, or CSS classes from memory.
  2. **Constraint-Driven Development**: Lock hard physical and architectural constraints before coding (e.g., *"On `< lg` mobile (`375px-440px`), `<aside>` has zero outer card border, all 4-6 tabs must be 100% visible simultaneously via CSS Grid without `...` clipping, and `organization_id` RLS is mandatory"*).
  3. **Doubt-Driven Verification**: Treat every unverified assumption as a bug waiting to happen; verify both compiler types (`tsc --noEmit`) and real viewport geometry.
- **Spec-Driven Development (`github/spec-kit` - SDD Pipeline & Phase -1 Constitutional Gates)**:
  - **The SDD Power Inversion**: Specifications and contracts do not serve code - code serves specifications. Reject ad-hoc "vibe coding" (patching symptoms without a domain model). Follow the 6-stage SDD discipline:
    1. **`Constitution`**: Honor non-negotiable project laws (`GEMINI.md`, multi-tenant `organization_id` RLS, single-concept headings, zero `...` label truncation, `@/components/ui/*` primitives).
    2. **`Specify` (WHAT & WHY before HOW)**: Define user stories, operational scenarios, and measurable acceptance criteria before choosing implementation details.
    3. **`Clarify` (`[NEEDS CLARIFICATION]` - Zero Silent Guessing)**: Never make plausible but unverified assumptions when requirements conflict or are underspecified; surface explicit tradeoffs or questions first.
    4. **`Plan` & Phase -1 Constitutional Gates**: Every technical design must pass 3 pre-implementation gates before writing code:
       - **Simplicity Gate (Article VII)**: Minimum moving parts, zero speculative `"might-need"` features, zero future-proofing bloat.
       - **Anti-Abstraction Gate (Article VIII)**: Trust the framework and reuse single canonical domain representations (`Goal` + `Goal.metadata` instead of separate `Result`/`Metric` models; `@/components/ui/*` instead of duplicate custom widgets).
       - **Integration-First Gate (Article IX)**: Define API/store contracts first and verify against real database/compiler state rather than isolated mocks.
    5. **`Analyze` (Cross-Artifact Consistency)**: Cross-check the technical plan against the Constitution and existing codebase graph to eliminate schema drift, duplicate helpers, or security gaps before execution.
    6. **`Tasks` -> `Implement` (`[P]` Safe Parallelization)**: Decompose work into ordered, atomic tasks with strict file-ownership boundaries when running parallel subagents.
- **Ubiquitous Domain Language (1 Canonical Word)**:
  - Use a single canonical domain noun across database models, serializers, API payloads, and UI stores:
    - Financial amounts: `subtotal`, `discount`, `net`, `tip`, `tax`, `total`, `rate` (NEVER write freshman-style compound identifiers like `invoiceAmountUsd`, `tipAmountUsd`, `resolvedTotalUsd`, `defaultTipRate`, or `calculatedTaxValue`).
    - Identifiers & references: `reference` (NEVER `ref`, `booking_ref`, `invoice_ref`, `channel_ref`, `order_ref`), `organization_id` (NEVER `org_id` or `tenant_id`).
    - Tax providers: `viettel`, `misa`, `vnpt`, `stripe` (NEVER `viettel_sinvoice`, `misa_meinvoice`, `stripe_tax`).

---

## 2. The Lazy Senior Dev Decision Ladder (Ponytail + Karpathy Simplicity)
*"He says nothing. He writes one line. It works."*

Before writing a single line of code, climb this 4-step ladder in strict order:
1. **Step 1 - Do we need new code or schema at all? (YAGNI)**:
   - Never add speculative features, unrequested configuration flags, or premature abstractions.
   - Never create a second `JSONField` on a Django model (`Organization.metadata`, `Booking._metadata`, `Journal._metadata` already exist) or add new tables when an existing canonical model (`Organization`, `Unit`, `Booking`, `Invoice`, `Receipt`, `Journal`, `Case`, `Goal`) already solves it.
2. **Step 2 - Can we reuse an existing primitive in the ecosystem?**:
   - Check `@/components/ui/*` and `trip.express/web` first. Always clone proven UI components, stores, and patterns before inventing a new widget.
3. **Step 3 - Can the platform or standard library do it natively?**:
   - Prefer native HTML/CSS/Web APIs, SQL `Exists`/`Subquery` expressions, and Python `stdlib`/`Decimal` over 300-line custom helpers.
4. **Step 4 - Write 50 lines instead of 200 (Zero Compromises on Safety)**:
   - Write the shortest, flattest code that solves the exact problem.
   - **Never cut**: multi-tenant `organization_id` RLS scoping, input validation, `transaction.atomic()` state safety, error handling, or keyboard/screen-reader accessibility.

---

## 3. Codebase-as-Knowledge-Graph Navigation (Graphify)
- **Trace the Graph Before Editing**: Treat the codebase as a deterministic dependency graph rather than isolated text files.
- **Map God Nodes & Shared Contracts**: Before modifying a shared model, serializer, store, or type (`Organization`, `Unit`, `Booking`, `Invoice`, `Receipt`, `Reservation`, `Goal`), trace all callers, API routes, and UI consumers first so changes remain 100% atomic across producers and consumers.
- **Zero Duplicate Logic**: Never create parallel helper files (`*-v2.ts`, `*-helper.ts`, `*-service.ts`) when a canonical module (`lib/services/api.ts`, `apps/finances/services/tax.py`) already owns that domain node.

---

## 4. Surgical Changes Only (Karpathy Surgical Discipline)
- **Touch Only What You Must**: Every changed line must trace directly to the user's request.
- **Zero Drive-By Refactors**: Do not reformat, rename, or reorganize unbroken adjacent code unless asked.
- **Clean Up Your Own Orphans**: If your edit renders an import, variable, or helper unused, remove that dead code immediately.

---

## 5. Reference-First UI Deconstruction & Accessibility-Tree Computer Use (Website Cloner + Google Stitch + Taste Skill + `vercel-labs/agent-desktop`)
- **4-Layer Reference Deconstruction (Before Cloning or Redesigning Any Benchmark UI)**:
  When adapting world-class patterns (Facebook Manage Page, Airbnb, Asana, Linear, Stripe, Toast, Mews, or `trip.express/web`), deconstruct the reference across 4 deterministic layers before coding:
  1. **Structural Grid & Proportions**: Column ratios (`12-col` split, `5/7` asymmetric grid), sticky sidebar rails, cover-to-avatar overlap geometry, and responsive breakpoint choreography (`sm` -> `md` -> `lg`).
  2. **Surface & Token Mapping**: Map backgrounds, hairline borders, and typography directly onto our ecosystem tokens (`design-language/SKILL.md`).
  3. **Interactive State Machine**: Define empty states, inline editing, loading skeletons, and optimistic feedback before wiring handlers.
  4. **Domain Adaptation (Strip Consumer Social Bloat)**: Retain only high-leverage commercial/operational mechanics and discard consumer noise.
- **Accessibility-Tree-First UI & Safe-Retry Action Contract (`vercel-labs/agent-desktop`)**:
  - **Real UI Structure Over Pixel Guessing**: Both human screen-readers and autonomous desktop/browser computer-use agents (`agent-desktop`, Playwright ARIA snapshots, Tauri native shells) operate apps via the **Accessibility Tree (`role`, `name`, `value`, `available_actions`)**, not raw pixel coordinates.
  - **Unique Accessible Identity (Eliminate `AMBIGUOUS_TARGET`)**: Every interactive button, row action, icon button, and input must expose a deterministic semantic `role` and context-disambiguated accessible `aria-label` / `title` (never render 10 identical unlabeled icon buttons in a table or card list).
  - **Snapshot-Scoped State & Safe-Retry Disposition (`delivery` & `retry`)**: Mutating actions (checkout, order dispatch, folio settlement, draft send) must return deterministic disposition metadata so callers know whether an error was `not_delivered` (`retry: safe`) vs. `may_have_landed` (`re-read live state before retrying`).
- **Anti-Slop Guardrails**:
  - Zero marketing fluff in operational headers (`"0% Ads"`, `"AI-Powered Next-Gen Terminal"`).
  - Zero nested cards (`Card` inside `Card` inside `Card`) - use a single flat card container (`rounded-2xl border p-6`) and separate inner sections with `gap`, `grid`, or `border-t`.
  - Zero inline status badges jammed next to card titles; keep card headers strictly `[Icon + 2-3 Word Title]` on the left and a single primary control (`<Switch>` or `<Button size="sm">`) on the right.
  - Zero raw HTML form controls (`<input>`, `<select>`, `<textarea>`); always use `@/components/ui/*` primitives.
  - Hide zero-value optional rows cleanly (e.g., hide `Tip` row when `tip === 0`) to keep receipts and folios crisp.

---

## 6. Goal-Driven Execution & Red/Green Verification (Superpowers + Karpathy)
- **Define Verification Criteria First**: Formulate concrete, testable success criteria before editing files.
- **Mandatory Pre-Push CI Parity Verification**:
  - Frontend: Always run **both** `npx tsc --noEmit --incremental false` AND `pnpm lint` / `npm run lint` (plus `pnpm lint:i18n` where configured) before pushing so zero unused imports, unused variables, or lint errors reach GitHub Actions.
  - Backend: Run Python AST compilation, `flake8` (`E9,F63,F7,F82`), and targeted test suites (`pytest` / `manage.py test`), verifying `select_related`/`prefetch_related` query hygiene and `organization_id` isolation.
  - i18n: When touching user-facing copy, update all **14 canonical locales** (`ar`, `de`, `en`, `es`, `fr`, `it`, `ja`, `ko`, `pt`, `ru`, `th`, `vi`, `zh-hans`, `zh-hant`) atomically.
- **Production Server Protection & Multi-Repo Deployment Hygiene (`128.199.99.9`)**:
  - **Staggered Multi-Repo Pushes**: Never `git push` 10+ repositories simultaneously in a single burst when they deploy to the shared 8GB production server (`128.199.99.9`). Group pushes in small batches (max 2-3 repos at a time) so concurrent SSH deploy jobs do not saturate RAM/Swap.
  - **Isolated `DOCKER_CONFIG` & Zero Local Next.js `docker build` on Production VPS**: Every deploy workflow using `docker login ghcr.io` must use an isolated temporary directory (`export DOCKER_CONFIG=$(mktemp -d)`), must use `docker image prune -f` (never `-af`), and must pull prebuilt images from GHCR rather than running `docker build` (`next build`) directly on the 8GB production server.
  - **Post-Push Live Verification**: After pushing production repositories, verify server load (`uptime`, `free -m`), container health (`docker ps`), and live HTTPS `200 OK` status across production domains.
- **Zero Auto-Push on `.md` / Skill / Rule Updates (Conserve GitHub CI/CD Resources)**:
  - When updating markdown files (`*.md`, `.agents/GEMINI.md`, `.agents/rules/*.md`, `.agents/skills/**/SKILL.md`, `README.md`), sync them locally across workspace directories only - **NEVER** run `git commit` or `git push` automatically for `.md`-only changes. Wait until they are bundled with actual application code changes or when the user explicitly prompts `"push"`.

---

## 7. Closed-Loop Self-Improvement, Context-Window Economy & High-Signal Communication (`NousResearch/hermes-agent` + `ECC` + `claude-mem` + `Caveman`)
1. **Hermes Closed-Loop Skill Evolution (`NousResearch/hermes-agent`)**:
   - **Autonomous Skill Creation & Live Self-Refinement**: After solving a non-trivial architectural challenge or receiving user critique, do not let the lesson remain trapped in ephemeral chat history. Immediately codify or refine the corresponding `SKILL.md` (`agentskills.io` compatible) and propagate it across all ecosystem repositories.
   - **Dialectical User Modeling (`Honcho` Pattern)**: Continuously model the founder's product philosophy and engineering taste across sessions - proactively anticipating requirements (e.g., first-class sidebar navigation for new core modules like `Goals`, single canonical model reuse via `Goal.metadata`, zero `...` label truncation, zero em-dashes, and 5-expert executive review before coding) without waiting to be reminded.
   - **Zero-Context-Cost Script Collapse**: When performing repetitive multi-file updates (e.g., updating 14 locale JSONs or syncing skills across 26 repositories), collapse the pipeline into a single deterministic Python one-liner (`run_command`) rather than burning 20 sequential tool turns in the context window.
   - **Skeleton-First Progressive Drill (`--skeleton` -> `--root`)**: Map the high-level structure first (file outline, grep line numbers, or shallow DOM/accessibility snapshot) and drill only into the exact target line range (`StartLine`-`EndLine`).
2. **Token-Optimized High-Signal Output (`JuliusBrussee/caveman`)**:
   - Eliminate ~65% of conversational filler: zero empty pleasantries, zero repeating the user's prompt back to them, zero lengthy prose recaps of obvious code changes.
   - Keep file paths, symbol links, commands, exit codes, and architectural trade-offs 100% byte-exact.
   - **Auto-Clarity Escalation**: Automatically expand into full, unambiguous detail when explaining security risks, financial/ledger math, destructive operations, or multi-step user setup.
3. **Context-Window Discipline & Subagent Isolation (`affaan-m/ECC`)**:
   - Protect the primary context window by viewing targeted line ranges (`StartLine`-`EndLine`) rather than dumping 2,000-line files repeatedly.
   - When executing parallel, multi-file audits across independent sub-modules or repositories, delegate with strict file-ownership boundaries so subagents never collide on the same file.
