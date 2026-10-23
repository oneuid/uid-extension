---
name: oidc-identity
description: >-
  Zero-Knowledge OIDC / OAuth2.1 Identity Provider, WebAuthn Passkeys,
  Instant Staff Session Revocation, Step-Up Authentication, and Tenant SaaS Subscription Billing
  (distilled from `ory/hydra`, `auth0/agent-skills`, `autentico-auth/autentico`, and `openaccountant/skills`).
  Use this skill whenever working on authentication, OIDC/OAuth2 flows, JWT `sub` claims,
  passkeys, session cookies, or tenant SaaS tax invoicing in `uid.one` (`uid-core`, `uid-web`, `uid-app`).
---

# Zero-Knowledge OIDC Identity & Tenant SaaS Billing Skill (`uid.one`)

Distilled from **`ory/hydra`** (OpenID Certified OAuth2/OIDC Server), **`auth0/agent-skills`** (OIDC/OAuth2.1 & Step-Up Security Patterns), **`autentico-auth/autentico`** (Passkey/WebAuthn Lifecycle), and **`openaccountant/skills`**.

---

## 1. Zero-Knowledge Cross-Layer Identity Architecture (`sub`)

1. **Immutable `sub` Claim Join Key**:
   - `uid.one` acts strictly as the Zero-Knowledge SSO & Cryptographic Identity Provider for the ecosystem (`getding.io`, `trip.express`, `shan.estate`).
   - Downstream applications join users ONLY via the immutable OIDC `sub` (`User.uid`) claim — never by mutable email or primary key.
2. **Zero Merchant CRM / Guest PII Storage**:
   - `uid.one` NEVER stores hospitality guest folios, travel itineraries, or merchant CRM profiles.
3. **HttpOnly Session & Refresh Token Rotation**:
   - Access tokens are short-lived RS256 JWTs verified via JWKS (`/.well-known/jwks.json`).
   - Refresh tokens rotate atomically in `HttpOnly; Secure; SameSite=Lax` cookies.

---

## 2. Instant Staff Session Revocation & Step-Up Authentication (`auth0/agent-skills`)

1. **Instant Deprovisioning & Global Token Revocation**:
   - Hospitality and retail venues experience high staff turnover. When an organization owner removes a staff member or revokes their role, `uid-core` immediately invalidates all active refresh tokens and sessions for that `sub` + `organization_id` across Web and Mobile (`app.getding.io`, `uid.app`).
2. **Step-Up Authentication for High-Risk Financial Mutations**:
   - Sensitive admin actions — updating a merchant `Payment QR`, changing E-Invoice provider credentials (`viettel`, `misa`, `vnpt`, `stripe`), or initiating a bank `Payout` — require recent authentication (`acr` / Passkey / OTP step-up verification).

---

## 3. Tenant SaaS Subscription & Tax-Inclusive Invoicing (`Organization.metadata.billing` & `billing.Invoice`)

1. **Zero Core Schema Bloat & Tax-Inclusive Pricing**:
   - All `uid.one` subscription plans (`Free`, `Business`, `Enterprise`) are **100% Tax-Inclusive**.
   - Tenant corporate tax profile is stored in `Organization.metadata.billing` (`company`, `tax_id`, `email`, `address`, `country`).
   - Official SaaS tax invoices use canonical `reference: "UID-YYMMDD-######"`, `scope: "saas"`, `cycle`, `plan`, `subtotal`, `tax`, `total`, `currency`, `status`, `seller`, `buyer`, and `items`.
   - Supports domestic (`viettel`, `misa`, `vnpt`) and international (`stripe`) E-Invoice connectors in Admin settings.
2. **Concise Naming & Canonical `reference` Rule**:
   - Use concise 1–2 word identifiers: `Billing`, `Invoice`, `InvoiceItem`, `BillingView`, `Invoices`, `saveBilling`, `reference`, `viettel`, `misa`, `vnpt`, `stripe`.
