---
name: sre-infra
description: Principal SRE, DevOps, Edge & Cloud Reliability Architect distilled from Google SRE Book, Cloudflare Workers & Email Routing Architecture, Docker/Compose Production Engineering, Gunicorn/Uvicorn/Nginx Upstream Tuning, Cloudflare R2 / S3 Object Storage Lifecycle, and Zero-Downtime Multi-Repo Deployment Hygiene. Use whenever designing, debugging, or deploying edge workers, email ingestion pipelines, file uploads, static assets, CDN caching, Docker containers, database migrations, or production server rollouts across DING OS, Trip Express, SHAN, and OneUID.
---

# Principal SRE, DevOps & Edge Reliability Architecture (`sre-infra`)

Distilled from **Google Site Reliability Engineering (SRE)**, **Cloudflare Workers & Email Routing Best Practices**, **Docker & Gunicorn/Uvicorn Production Tuning**, **Cloudflare R2 / AWS S3 Object Storage Architecture**, and real-world production post-mortems across `ding`, `trip`, `shan`, and `uid`.

---

## 1. Edge-to-Origin Upstream Contract (Preventing `421` / `502` / `504` Failures)

Every request or email crossing from an Edge Worker (e.g., Cloudflare Email Worker `workers/ingest/index.js`) or CDN proxy into a Django origin (`api.getding.io`, `api.trip.express`, `api.uid.one`) must obey strict payload, timeout, and status-code contracts:

1. **Payload Ceiling Alignment (`DATA_UPLOAD_MAX_MEMORY_SIZE`)**:
   - Never leave Django's default `DATA_UPLOAD_MAX_MEMORY_SIZE = 2.5 MB` when receiving raw MIME emails (`raw_mime`) or multi-file JSON payloads from Cloudflare Workers.
   - Base64-encoded attachments inflate size by ~33%. Always align the Edge Worker truncation threshold (`MAX_RAW_MIME_BYTES = 15 MB`) with Django's `DATA_UPLOAD_MAX_MEMORY_SIZE = 35 MB` (`36700160`) and `FILE_UPLOAD_MAX_MEMORY_SIZE = 35 MB` so the origin never rejects valid payloads with `400 RequestDataTooBig` (which causes Cloudflare Email Worker to return `421 4.3.0 Upstream error` to Gmail/SMTP senders).
2. **SMTP Retry vs. Permanent Drop Semantics**:
   - In Cloudflare Email Workers (`message.setReject()`), only trigger SMTP rejection or retry on genuine transient origin unavailability (`502`, `503`, `504`).
   - If the origin returns `400`/`413` due to oversized `raw_mime`, retry once immediately with `raw_mime: ""` (preserving parsed headers, text, HTML, and metadata) so the email is still delivered into the tenant's Inbox instead of bouncing back to the customer.
3. **Decouple Slow I/O from Database Transactions (`transaction.on_commit`)**:
   - Never perform synchronous S3/R2 network uploads (`boto3.put_object`), outbound SMTP (`send_mail`), webhook dispatches, or LLM HTTP calls inside an open `transaction.atomic()` block.
   - Hold row locks (`select_for_update()`) for `< 50ms` of pure database state transition; push R2 uploads, email dispatch, and AI enrichment outside the lock or onto `transaction.on_commit()`.

---

## 2. Object Storage (Cloudflare R2 / S3) & Attachment Hygiene

1. **Zero-Junk Storage Gate (`is_inline` Pre-Filter)**:
   - Never blindly upload every MIME part of an inbound email to R2/S3.
   - Filter out inline HTML/signature assets (`Content-Disposition: inline`, `Content-ID` referenced in `<img src="cid:...">`, Outlook/Apple Mail `image001.png`..`image099.jpg`, and tiny `< 8 KB` untitled decorative icons) via `is_inline()` before touching object storage. Resolve inline `cid:` images into inline `data:image/...;base64,...` URIs inside sanitized HTML and only upload genuine customer attachments (PDFs, contracts, vouchers, high-res photos) to R2.
2. **Tenant-Scoped Object Keys & Presigned Access**:
   - Prefix every R2/S3 object key with `organization_id` (`inbox/{org_id}/{conv_id}/{uuid}_{filename}`) and serve private attachments strictly via authenticated views or short-lived presigned URLs (`expires <= 900s`).

---

## 3. Static Assets, Docker Mounts & CDN Cache-Busting

1. **`static/` vs. `staticfiles/` Parity in Django Containers**:
   - When a production container or Nginx volume serves from `STATIC_ROOT` (`staticfiles/`), updating source files in `static/images/` alone will not update the live site unless `collectstatic` runs or `staticfiles/images/` is synced in lockstep.
   - Whenever updating brand logos, favicons, or admin icons in `trip.express/x`, `api.getding.io`, or `uid.one/uid-core`, always verify both `static/images/` and `staticfiles/images/` are byte-identical (`md5sum`).
2. **Deterministic CDN Cache-Busting (`?v=N`)**:
   - Cloudflare CDN and browser caches aggressively cache `/static/images/favicon.svg` and `/static/images/logo-icon.svg`.
   - Whenever replacing static brand assets at the same filename path, bump the query version parameter (`?v=4` $\rightarrow$ `?v=5`) in `UNFOLD` (`SITE_ICON`, `SITE_LOGO`, `SITE_FAVICONS`) and HTML `<link rel="icon">` metadata so all edge PoPs and browsers fetch the fresh asset immediately.

---

## 4. Production Server Protection & Sequential Deployment (`128.199.99.9`)

1. **Sequential Multi-Repo Push Law (Zero Concurrent Build Storms)**:
   - Never `git push` multiple heavy repositories simultaneously. Push sequentially (1 repository at a time, or max 2 lightweight repos) to prevent concurrent GitHub Actions SSH deployments and Docker container restarts from saturating CPU/RAM/Swap on the production server.
2. **Pre-Built Container Images & Safe Pruning**:
   - Build Next.js and Django images in CI (GHCR) rather than running `next build` on the production VPS.
   - Use isolated temporary Docker auth configs (`export DOCKER_CONFIG=$(mktemp -d)`) and safe image pruning (`docker image prune -f`, never `-af` while containers are recreating).
3. **Zero-Downtime Database Migrations**:
   - Enforce expand-and-contract migrations: new columns must be nullable or have lightweight defaults (`default=dict`, `default=""`), indexes on large tables must use `AddIndexConcurrently`, and code must tolerate both old and new schema states during rolling container restarts.
4. **Post-Deploy Live Telemetry Check**:
   - After every production push, verify container health (`docker ps`), memory headroom (`free -m`), and live HTTP `200 OK` responses on health/version endpoints (`/api/version`, `/v1/health/`).
