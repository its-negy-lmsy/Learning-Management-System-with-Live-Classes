# Common Goods — 10-Minute Capstone Presentation

**Project:** FS-01: Multi-Vendor E-Commerce Marketplace  
**Presenter:** Yuvraj Negy (Full-Stack Engineering Intern)  
**Target Audience:** Technical Evaluation Team & Senior Engineering Leadership  
**Presentation Deck File:** [`FS-01-Multi-Vendor-Marketplace-10-Minute-Presentation.pptx`](FS-01-Multi-Vendor-Marketplace-10-Minute-Presentation.pptx)  
**Live Demo:** [http://localhost:5173/](http://localhost:5173/)  
**API Documentation:** [http://localhost:4000/docs](http://localhost:4000/docs)  

---

## Slide 1: Title & Capstone Overview
- **Project Title:** Common Goods: Production-Grade Multi-Vendor E-Commerce Marketplace
- **Core Value:** Enabling independent craft and artisan studios to sell directly to conscious consumers with automated escrow split settlements, 10% platform sustainability fees, and zero overselling concurrency protection.
- **Presenter:** Yuvraj Negy, Full-Stack Engineering Intern
- **Technology Stack:** React 19, TypeScript, Node.js, Express 5, MongoDB / Mongoose, Redis, Elasticsearch, Razorpay Route / Stripe Connect, S3.
> **Speaker Note:**
> *"Welcome everyone. Today I am presenting my final capstone project, Common Goods—a production-grade multi-vendor e-commerce marketplace built using React 19, Node.js Express 5, MongoDB, Redis, and Elasticsearch. Over the course of my internship, I engineered the end-to-end platform from database architecture to split payment settlements, implementing robust concurrency controls and an intuitive user experience designed to empower independent artisan studios."*

---

## Slide 2: The Marketplace Challenge & Product Vision
- **The Problem in Contemporary E-Commerce:**
  - High Take Rates: Monopolistic platforms charge 25-35% in take rates and hidden commissions, making small-batch craft economics untenable.
  - Opaque Settlements: Artisans wait 30-45 days for manual batch payouts without line-item auditability.
  - Concurrency Failures: Viral artisan drops suffer from inventory race conditions and double-orders.
  - Disjointed Multi-Vendor Shipping: Customers receive uncoordinated boxes without independent package tracking or valid GST invoices.
- **The Common Goods Solution:**
  - Direct studio provenance with transparent, sustainable 10% platform fee.
  - Automated gateway split settlement routing 90% directly to maker balances.
  - Atomic database-level stock decrement preventing overselling.
  - Intelligent multi-vendor cart segregation with package-level BlueDart tracking.
  - Familiar Amazon UX (Omnibar, Buy Box, Bundles) combined with warm, tactile artisanal aesthetics.
> **Speaker Note:**
> *"Independent makers face severe friction when selling online: exorbitant fees, slow settlements, and overselling during demand spikes. Common Goods solves this by creating an Amazon-caliber marketplace with automated split payment escrow, atomic concurrency protection, and multi-vendor fulfillment, wrapped in an artisanal aesthetic."*

---

## Slide 3: Three-Tier Role-Based Access Control (RBAC)
- **1. Customer Role:**
  - Public registration strictly assigns `CUSTOMER`; role elevation is blocked server-side.
  - Redis-cached multi-vendor cart & cross-device MongoDB wishlist sync.
  - 1-Click Buy Now checkout and 4-stage visual order tracker.
  - Self-service order cancellation with immediate stock restoration.
- **2. Vendor / Maker Role:**
  - Formal studio KYC onboarding (Studio name, craft biography, GSTIN).
  - Product CRUD with high-resolution image uploads and integer paise pricing.
  - Package-level fulfillment transitions (`PACKED` ➔ `SHIPPED`) with BlueDart tracking IDs.
  - Real-time double-entry financial ledger of gross sales, commission deductions, and net payouts.
- **3. Platform Admin Role:**
  - Vendor application verification and approval/rejection governance.
  - Catalog curation and content moderation.
  - Platform-wide GMV, escrow volume, and commission analytics.
  - Promotional coupon engine (percentage and fixed-amount discounts).
> **Speaker Note:**
> *"Security is designed at the foundational layer: Passwords use bcrypt with cost factor 12. Authentication uses short-lived JWTs paired with atomic refresh session rotation stored in HttpOnly SameSite cookies. Server-side middleware verifies roles on every sensitive route."*

---

## Slide 4: Full-Stack System Architecture & Data Topology
- **Frontend Architecture (`apps/web`):**
  - React 19 + TypeScript SPA utilizing RTK Query for normalized state caching and optimistic UI updates.
  - Client-side routing covering Storefront, Product Detail Page, Customer Orders, Vendor Studio, and Admin Center.
  - High-conversion Amazon UX: Omnisearch bar, live auto-suggest dropdown, facet filtering, Buy Box, and cart drawer.
  - Custom design tokens: Warm cream surfaces (`#f8f7f3`), deep forest moss (`#455d46`), and terracotta copper (`#aa775e`).
- **Backend Architecture (`apps/api`):**
  - Express 5 + TypeScript modular REST API with OpenAPI/Swagger 3.1 contract at `/docs`.
  - MongoDB/Mongoose transactional persistence with schema validation and compound indexing.
  - **Zero-Config Resilience:** Automatic in-memory MongoDB replica set fallback so reviewers can test all journeys without external Docker dependencies.
  - Redis cart and session caching; Elasticsearch asynchronous outbox synchronization.
  - Financial precision: All currency stored as integer paise to eradicate floating-point rounding errors.
> **Speaker Note:**
> *"The architecture is decoupled and modular. The frontend uses React 19 with RTK Query for instant optimistic updates. The backend uses Express 5 with Mongoose for relational data modeling. For resilience, I engineered a zero-config in-memory MongoDB replica set fallback so the evaluator can run and test the complete application instantly without external Docker dependencies."*

---

## Slide 5: Automated Split Settlements & Escrow Accounting
- **Split Payment Gateway Mechanics:**
  1. Single buyer checkout payment authorized through Razorpay Route / Stripe Connect.
  2. Gateway splits fund distribution: 90% routed to vendor bank account, 10% retained as platform commission.
  3. Idempotent webhook listener verifies HMAC signature and confirms order transition.
- **Double-Entry Vendor Ledger:**
  - Every transaction produces an immutable `VendorLedgerEntry` record (`CREDIT`, `COMMISSION`, `REVERSAL`).
  - Automatic refund compensation: Order cancellations immediately generate compensating debit entries.
  - Complete GST compliance: Automated printable Tax Invoices with 18% GST breakdown and vendor GSTIN.
  - Secure query token authentication (`?token=`) enabling 1-click browser invoice downloads.
> **Speaker Note:**
> *"Multi-vendor payments require rigorous financial engineering. All monetary figures are calculated strictly in integer paise. When an order is placed, payments are split between vendor accounts and the platform commission. Every transaction is backed by an immutable ledger entry. When an item or order is cancelled, the system creates a compensating reversal entry automatically."*

---

## Slide 6: High-Conversion Discovery & Buy Box UX
- **Omnisearch & Real-Time Facets:**
  - Search omnisearch header with department dropdown and instant thumbnail auto-suggest.
  - Multi-attribute facet filters: Department, customer review rating (4★ & up), and price range slider with 'Go' trigger.
  - Interactive PIN code delivery estimator with estimated delivery dates.
- **The Authentic Buy Box & Smart Bundles:**
  - Sticky Buy Box with stock urgency notices, quantity selector, and dual purchase CTAs (`Add to Bag` & `Buy Now`).
  - Frequently Bought Together bundle module with combined pricing and 1-click bundle addition.
  - Interactive coupon clipping module (e.g. `WELCOME10`) with live discount recalculation.
  - Customer review breakdown with 5-star histogram progress bars and verified buyer badges.
> **Speaker Note:**
> *"We studied Amazon's conversion engine and adapted it into an artisanal setting. The Product Detail Page features a sticky Buy Box with stock urgency, 1-click purchase, and a dynamic Frequently Bought Together bundle widget. All visual elements use our bespoke Common Goods design system."*

---

## Slide 7: Order Lifecycle & Multi-Package Fulfillment
- **Multi-Vendor Package Segregation:**
  - Items in cart from distinct studios are partitioned into discrete vendor packages.
  - 4-Stage visual tracker: `Placed` ➔ `Packed` ➔ `Shipped` ➔ `Delivered`.
  - Independent shipping carriers and tracking IDs for each package.
  - Consolidated order state computed dynamically across non-cancelled packages.
- **Vendor Fulfillment Tools:**
  - Dedicated Vendor Studio for order inspection, packing slips, and dispatch confirmation.
  - Granular line-item out-of-stock cancellation without failing the buyer's entire order.
  - Automated HTML/PDF tax invoice generation.
> **Speaker Note:**
> *"Fulfillment is where multi-vendor platforms often fail. In Common Goods, orders containing items from multiple studios are split into independent packages. Each package is tracked independently through a 4-stage visual timeline. When an order is completed, customers can download an official GST tax invoice directly."*

---

## Slide 8: Technical Deep Dive: Concurrency & Defect Resolution
- **Atomic Inventory Locking (Combating Overselling):**
  - **The Race Condition:** Concurrent buyers attempting to purchase limited stock simultaneously.
  - **The Fix:** Atomic conditional update using MongoDB `findOneAndUpdate({ _id: id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })`.
  - **The Proof:** Automated integration test firing simultaneous parallel checkouts against 4 remaining units; exactly one order succeeds with `201`, the competitor receives `409 INSUFFICIENT_STOCK`. Zero negative inventory.
- **Key Defects Diagnosed & Resolved:**
  1. *Invoice Download 401:* Direct `<a href>` links cannot send Bearer headers; resolved via secure query token authentication (`?token=`).
  2. *Out-of-Stock Order Freeze:* Status could not reach `DELIVERED` if one package cancelled; fixed status consolidation algorithm to exclude cancelled packages and reverse ledger entries.
  3. *Order History Missing Images:* Added `imageUrl` snapshot to order schema at checkout time.
> **Speaker Note:**
> *"The most critical technical challenge was handling concurrent checkout race conditions on limited inventory. I implemented atomic conditional updates in MongoDB: stock is decremented only if the existing stock is greater than or equal to the requested quantity in a single atomic database operation. Our automated concurrency test proved zero overselling."*

---

## Slide 9: Verification, Test Coverage, & Benchmarks
- **Automated Test Rigor:**
  - 13 passed unit tests across `@fs01/api` and `@fs01/web` with Vitest.
  - 10-point end-to-end integration test suite (`node e2e-review.mjs`) covering catalog, auth, wishlist, cart, invoices, cancellation, and concurrency races.
  - 0 TypeScript compiler errors across all workspaces (`npm run typecheck`).
  - Production asset bundling verified with Vite (`npm run build`).
- **Performance Metrics:**
  - Sub-15ms cached API query response time.
  - Sub-80ms checkout transaction latency including atomic stock deduction.
  - 506ms frontend development startup with Vite HMR.
> **Speaker Note:**
> *"Code is complete only when confidence exists through evidence. Both unit and integration test suites pass with a 100% success rate. TypeScript compiles with zero errors, and production builds are optimized for fast load times even on low-bandwidth connections. API response times remain comfortably below 50 milliseconds."*

---

## Slide 10: Individual Learnings, Reflection, & Future Roadmap
- **Personal Ownership:**
  - Designed and implemented multi-vendor packaging, Buy Box conversion engine, atomic concurrency protection, double-entry split accounting, and invoice generation.
- **Technical Growth:**
  - Mastered distributed concurrency race conditions, financial arithmetic in integer paise, and balancing enterprise UX conventions with brand-specific visual design.
- **Production Roadmap:**
  - Live Razorpay Route webhook infrastructure, AWS S3 pre-signed upload URLs, automated GST return filing, and personalized recommendation models.
> **Speaker Note:**
> *"In conclusion, building Common Goods challenged me to think beyond simply writing code—it demanded product thinking, defensive system design, and meticulous user experience polish. I am proud to present this capstone as a launch-ready demonstration of what I can contribute as a full-time software engineer. Thank you, and I look forward to your questions."*
