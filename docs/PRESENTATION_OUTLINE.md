# 10-Minute Capstone Presentation Deck: FS-01 Multi-Vendor Marketplace

**Presenter:** Yuvraj Negi  
**Project:** FS-01 · Common Goods Multi-Vendor E-Commerce Marketplace  
**Evaluation:** Final Internship Capstone Review  
**Allocated Duration:** 10 Minutes  

---

## Slide Breakdown & Speaker Timings

### Slide 1: Title & Executive Summary (0:00 - 1:00)
- **Title**: Common Goods — High-Throughput Maker-First Multi-Vendor E-Commerce
- **Presenter**: Yuvraj Negi (Full-Stack Engineering Intern)
- **The Problem**: Traditional marketplaces are monolithic, vendor-hostile, and suffer from inventory race conditions during flash sales. Independent artisans need a curated, maker-first platform with transparent payouts and atomic checkout.
- **Key Metric**: Zero overselling guarantee via atomic optimistic concurrency control.

### Slide 2: Core User Journeys & Product Identity (1:00 - 2:30)
- **Visuals**: Storefront homepage, artisan story cards, and dynamic filter controls.
- **Three Persona Portals**:
  1. *Curious Buyers*: Editorial discovery, multi-vendor cart grouping, real-time stock availability, and instant checkout.
  2. *Artisan Vendors*: Product inventory management, order fulfillment tracking, and settlement dashboard.
  3. *Marketplace Administrators*: Vendor approval workflows, product moderation queue, and transaction reconciliation.

### Slide 3: System Architecture & Technology Stack (2:30 - 4:00)
- **Architecture Diagram**:
  - Frontend: React, TypeScript, Vite, Redux Toolkit, RTK Query.
  - Backend: Node.js, Express, TypeScript, Zod request schema validation.
  - Primary Storage: MongoDB with Mongoose ODM (normalized collections for Users, Vendors, Products, Orders, Carts).
  - High-Speed Caching: Redis for session carts and product cache.
  - Search Projections: Elasticsearch outbox pattern for full-text search and facet filters.
  - Payment Engine: Razorpay Route multi-split transfers with webhook signature verification.

### Slide 4: Multi-Vendor Cart & Atomic Checkout (4:00 - 5:30)
- **Deep Dive**: Multi-vendor item grouping, tax/shipping allocation, and atomic inventory decrement.
- **Race Condition Prevention**:
  ```typescript
  const updated = await Product.findOneAndUpdate(
    { _id: item.productId, stock: { $gte: item.quantity } },
    { $inc: { stock: -item.quantity } },
    { new: true }
  );
  if (!updated) throw new InsufficientStockError(item.productId);
  ```
- **Compensating Rollback Saga**: If item $N$ in a multi-item cart fails to decrement, items $1$ through $N-1$ are restored immediately, ensuring atomic consistency without requiring distributed two-phase commits.

### Slide 5: Payment Settlement & Financial Integrity (5:30 - 7:00)
- **Integer Paise Representation**: All monetary values are strictly represented in integer paise (cents), preventing IEEE 754 floating-point precision drift.
- **Razorpay Route Integration**:
  - Customer captures payment.
  - Marketplace deducts platform commission (e.g. 10%).
  - Vendor transfers created with `on_hold: true` until product shipment.
  - Webhook validation using cryptographic HMAC-SHA256 signatures (`order.paid`, `payment.failed`, `refund.processed`).

### Slide 6: Security & Identity Architecture (7:00 - 8:00)
- **Role-Based Access Control (RBAC)**: Strict server-side middleware (`requireRole('CUSTOMER' | 'VENDOR' | 'ADMIN')`). Public requests can never self-assign privileged roles.
- **JWT with Rotating Refresh Sessions**: Short-lived access tokens (15 minutes) coupled with atomic single-use refresh tokens stored in HttpOnly, SameSite cookies with SHA-256 database hashing.
- **Defense in Depth**: Helmet security headers, CORS origin whitelisting, and Redis-backed rate limiting.

### Slide 7: Test Results & Performance Metrics (8:00 - 9:00)
- **Automated Test Results**:
  - 13 passed unit and commerce tests (`vitest`).
  - End-to-end integration suite passed (`e2e-review.mjs`): health check, catalog search, authentication, multi-vendor cart add, concurrency race test, and webhook reconciliation.
  - Concurrency validation: 10 parallel checkout requests against a single in-stock item resulted in exactly 1 successful order and 9 clean out-of-stock rejections with zero negative inventory.

### Slide 8: Future Roadmap & Reflection (9:00 - 10:00)
- **Next Iterations**: Self-service automated customer return workflows, WebSocket push feeds for vendor orders, and multi-currency global tax calculation.
- **Closing Reflection**: Developing a production-grade multi-vendor marketplace taught me the importance of data consistency, defensive financial programming, and user experience polish.
