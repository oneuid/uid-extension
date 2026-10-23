# Concise & Professional Naming Standard (All Repositories)

All code across `getding.io`, `api.getding.io`, `trip.express`, `uid.one`, and `shan` MUST strictly follow concise, idiomatic, professional naming (Ubiquitous Domain Language). Never use verbose, overly explicit ("freshman essay") identifiers.

## 1. Files & Modules (1 Word Preferred)
- Rely on folder structure for domain context; never repeat parent directory names or prefixes (`workspace-`, `saas-`, `merchant-`, `admin-`) in filenames.
- **Good**: `billing.tsx`, `invoice.py`, `journal.py`, `client.tsx`, `page.tsx`, `manager.tsx`, `settlement.tsx`, `receipt.tsx`
- **Forbidden**: `workspace-billing-client.tsx`, `saas-invoice-generator.ts`, `customer-tax-profile-modal.tsx`

## 2. Functions, Methods, Components & Types (1–2 Words)
- Omit redundant domain nouns (`Saas`, `Workspace`, `Tenant`, `Customer`, `Guest`, `Document`, `Details`) when the module or class already provides context.
- **Good**:
  - Types/Interfaces: `Billing`, `Invoice`, `InvoiceItem`, `Seller`, `Sector`
  - Components: `BillingView`, `BillingPage`, `Manager`, `Settlement`, `Receipt`
  - Functions/Methods: `getBilling`, `saveBilling`, `saveInvoice`, `getInvoices`, `sync_collection`, `issue_commission`, `issue_prive`, `_billing`, `_invoices`, `_settle_folio`
- **Forbidden**:
  - `SaasInvoice`, `SaasInvoiceLine`, `TenantBillingProfile`, `WorkspaceBillingClient`, `_extract_saas_billing_profile`, `sync_booking_folio_tax_invoice`, `getNonCompetingAffiliateSuggestions`, `_issue_folio_documents`

## 3. Fields, JSON Keys, Props & Variables (Anti-Freshman Naming Rule)
- Strip redundant prefixes, suffixes (`Amount`, `Value`, `Usd`, `RatePercent`), and adjectives (`resolved`, `calculated`, `default`, `current`) when scoped inside a function, entity, or payload:
  - **Financial & Settlement Variables**:
    - **Good**: `subtotal`, `discount`, `net`, `tip`, `tax`, `total`, `rate`, `tipRate`, `taxRate`, `inclusive`
    - **Forbidden**: `invoiceTotalUsd`, `invoiceAmountUsd`, `tipAmountUsd`, `resolvedTotalUsd`, `resolvedDiscountUsd`, `defaultTipRate`, `invoice_amount`, `calculated_tax_amount`
  - **Provider & Connector Keys**:
    - **Good**: `viettel`, `misa`, `vnpt`, `stripe`, `issue`
    - **Forbidden**: `viettel_sinvoice`, `misa_meinvoice`, `vnpt_invoice`, `stripe_tax`, `lookup_tax`
  - **Entity & Payload Keys**:
    - **Good**: `billing`, `invoice`, `invoices`, `tax_id`, `company`, `email`, `address`, `folio`, `scope`, `settlement`, `cycle`, `seller`, `subject`
    - **Forbidden**: `saas_billing`, `saas_invoices`, `customer_tax_id`, `guest_folio`, `tax_invoice_details`, `raw_subject`
- **Canonical `reference` Rule (Never `ref`)**:
  - Always use the full word `reference` across all database columns, JSONB metadata, API payloads, and TypeScript interfaces.
  - **Good**: `reference`, `booking_reference`, `invoice_reference`, `journal_reference`
  - **Forbidden**: `ref`, `inv_ref`, `invoice_ref`, `booking_ref`, `channel_ref`, `order_ref`
