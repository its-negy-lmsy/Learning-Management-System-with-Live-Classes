# Capstone Individual Reflection

**Project:** FS-01 — Multi-Vendor E-Commerce Marketplace (Common Goods)  
**Author:** Yuvraj Negy  
**Role:** Full-Stack Software Engineering Intern  
**Date:** November 2026  
**Repository:** [github.com/its-negy-lmsy/FS-01](https://github.com/its-negy-lmsy/FS-01)  

---

## 1. Executive Summary & Personal Ownership

As the primary full-stack engineer on this project, I owned the design, implementation, and verification of the Common Goods multi-vendor marketplace from end to end. My responsibility was not merely to produce functional endpoints, but to architect a production-grade, highly resilient platform that solves real business friction for independent artisan studios and conscious buyers.

### Key Features & Systems I Personally Architected and Implemented:
1. **Three-Tier Role-Based Security:** Engineered custom JWT authentication paired with hashed atomic refresh token rotation delivered exclusively through HttpOnly, SameSite cookies. Built server-side role enforcement preventing privilege escalation.
2. **High-Conversion Amazon UX with Artisanal Aesthetics:** Designed and built the complete client interface in React 19, including the search Omnibar with department dropdown and live auto-suggest, the 2-column facet filter engine (star ratings, price sliders, department categories), the sticky Buy Box with 1-click purchase, and the Frequently Bought Together bundle recommendation system.
3. **Atomic Concurrency Control (Zero Overselling):** Replaced naive stock decrement logic with atomic database-level operations using MongoDB's `findOneAndUpdate` with conditional stock guards, completely preventing race conditions during flash-sale conditions.
4. **Automated Split Payments & Vendor Escrow Accounting:** Built the multi-vendor payment flow using integer paise precision, automatically routing 90% of subtotal amounts to maker ledgers while deducting the 10% platform commission. Engineered compensating ledger reversal entries for cancellations.
5. **Multi-Package Order Lifecycle & Fulfillment:** Created the 4-stage visual tracking pipeline (`Placed` ➔ `Packed` ➔ `Shipped` ➔ `Delivered`) partitioned by vendor, with independent carrier tracking IDs and granular out-of-stock item cancellations.
6. **GST-Compliant Tax Invoices:** Built the server-side HTML/PDF tax invoice generation engine with 18% GST itemized breakdown and solved browser anchor tag authentication limitations via secure query tokens (`?token=`).
7. **Zero-Config In-Memory Database Fallback:** Engineered an automated in-memory MongoDB replica set fallback so reviewers and evaluators can immediately boot and test all user journeys without external Docker installations.

---

## 2. Technical Concepts Learned & Deepened

### Atomic Database Operations & Concurrency Control
Before this project, I understood concurrency in theory, but implementing it under high-throughput conditions forced me to confront subtle race conditions. When two buyers attempt to purchase the last unit of a product at the exact same millisecond:
- *Naive code:* Reads `product.stock`, checks `stock > 0`, and then writes `stock = stock - 1`. If two requests read before either writes, both succeed, resulting in negative inventory and customer disappointment.
- *Atomic implementation:* I utilized MongoDB's conditional atomic operator:
  ```typescript
  const updated = await Product.findOneAndUpdate(
    { _id: item.productId, stock: { $gte: item.quantity } },
    { $inc: { stock: -item.quantity } },
    { new: true }
  );
  if (!updated) {
    throw new AppError('INSUFFICIENT_STOCK', 409, `Stock depleted for ${item.name}`);
  }
  ```
  This guarantees that stock reservation succeeds for exactly one buyer and immediately fails with `409 Conflict` for the other, maintaining absolute database consistency.

### Integer Precision in Financial Computing
I eliminated all floating-point math for pricing and calculations across the platform. Storing currency as standard floats (e.g., `₹28.99`) inevitably introduces binary floating-point rounding errors (e.g., `0.1 + 0.2 === 0.30000000000000004`). By enforcing integer paise throughout the database schemas, API contracts, and ledger entries (e.g., `289900` paise for `₹2,899.00`), calculations for 10% platform commission, 18% GST splits, and promotional discount deductions remain 100% mathematically exact to the single paisa.

### Optimistic UI & Normalized State Management
Integrating Redux Toolkit and RTK Query deepened my appreciation for caching policies and cache invalidation tags. Using tags such as `['Cart', 'Order', 'Wishlist', 'Product']`, whenever a customer cancels an order or clips a coupon, all relevant UI widgets update instantly across the application without jarring full-page reloads.

---

## 3. Key Architectural Tradeoffs & Engineering Decisions

### 1. In-Memory Zero-Config Replica Set vs. Strict Docker Dependency
- *The Tradeoff:* A production deployment typically expects a dedicated MongoDB cluster, Redis instance, and Elasticsearch node. However, forcing an evaluation team to install Docker, configure replica sets, and troubleshoot local network containers creates friction.
- *The Decision:* I designed an environment-aware database connector in `apps/api/src/db.ts`. It first attempts to connect to local/production MongoDB; if unreachable, it dynamically initializes an in-memory MongoDB replica set with automatic catalog seeding. This gave me the best of both worlds: full production code compatibility and zero setup friction for evaluators.

### 2. Bespoke Artisanal Aesthetic vs. Literal Amazon Replication
- *The Tradeoff:* Amazon's UX (Omnibar, Buy Box, 1-Click Buy Now, Frequently Bought Together) is arguably the highest-converting e-commerce interface in the world. However, copying Amazon's literal visual style (harsh `#ffd814` yellow buttons, dark navy headers, and `amazonartisan.in` wordmark) alienated the boutique, considered identity of independent artisan studios.
- *The Decision:* I preserved 100% of the Amazon UX structure and conversion mechanisms, but re-skinned the entire aesthetic into our bespoke Common Goods design system: warm cream backgrounds (`#f8f7f3`), deep forest moss primary buttons (`#455d46`), warm terracotta secondary actions (`#aa775e`), and editorial typography (`Playfair Display` and `DM Sans`). This achieved high conversion usability while establishing a distinct, premium brand identity.

---

## 4. Hardest Defects Diagnosed & Resolved

### Defect 1: Browser Invoice Download 401 Unauthorized
- *Symptom:* Clicking the "Download Tax Invoice" button in the order history failed with `401 UNAUTHENTICATED`.
- *Root Cause:* Direct browser downloads triggered via `<a href="/api/v1/orders/:id/invoice" download>` cannot inject custom HTTP headers (`Authorization: Bearer <token>`).
- *Resolution:* I updated the authentication middleware (`apps/api/src/auth.ts`) to inspect `req.query.token` as a secure fallback when the Bearer header is absent, and appended `?token=${encodeURIComponent(token)}` in the client download links.

### Defect 2: Out-of-Stock Package Cancellation Deadlock
- *Symptom:* If a vendor cancelled an out-of-stock item, the order status could never transition to `DELIVERED` because the fulfillment state engine expected all packages to complete.
- *Root Cause:* The aggregate status calculator did not discount `CANCELLED` packages.
- *Resolution:* I restructured the fulfillment transition state machine in `apps/api/src/app.ts` (`PATCH /fulfillment`). When an item is cancelled, the system marks the item `CANCELLED`, restores the physical stock count in the catalog, generates a compensating ledger reversal, and computes order completion strictly across remaining non-cancelled packages.

---

## 5. Verification & Test Evidence

I verified all aspects of my implementation through automated unit and integration suites:

```powershell
# 1. Run Unit Tests across API and Web
npm test
# Result: 11 passed in @fs01/api, 2 passed in @fs01/web (13 total)

# 2. Run TypeScript Compilation
npm run typecheck
# Result: 0 errors across both workspaces

# 3. Run Production Asset Build
npm run build
# Result: Vite production client built in 2.71s (484 KB JS / 144 KB gzip)

# 4. Run End-to-End Integration & Concurrency Suite
node e2e-review.mjs
# Result: All 10 integration scenarios PASSED, including simultaneous checkout race tests.
```

---

## 6. What I Would Improve in the Next Iteration
1. **Live Gateway Webhooks:** Move from the signed mock payment adapter to live production Razorpay Route webhook verification with automated retry queues.
2. **AWS S3 Direct Uploads:** Implement pre-signed S3 upload URLs so client images stream directly to cloud object storage rather than passing through API buffers.
3. **Automated GST E-Invoicing:** Integrate with the government GST API portal for automated IRN (Invoice Reference Number) generation on multi-vendor dispatches.

---

## 7. Conclusion
Building the Common Goods marketplace has been a transformative capstone experience. It taught me to think like a product founder, design defensively like a senior infrastructure engineer, and obsess over pixel-level UI details like a designer. I am eager to bring this craftsmanship, curiosity, and execution rigor to a full-time software engineering role.
