# Capstone Individual Reflection Report

**Intern Name:** Yuvraj Negi  
**Email:** zitusyuvraj@gmail.com  
**Track:** Full-Stack Engineering Internship  
**Project:** FS-01 · Multi-Vendor E-Commerce Marketplace (Common Goods)  
**Submission Date:** November 20, 2026  

---

## 1. What I Owned & Delivered

As the lead full-stack engineer on the Multi-Vendor E-Commerce Marketplace capstone, I owned the system design, database modeling, commerce APIs, and artisan-themed frontend:

- **Monorepo Architecture & Data Modeling**: Developed the architecture spanning `@fs01/api` (Node.js, Express, TypeScript, Mongoose) and `@fs01/web` (React, TypeScript, Redux Toolkit, RTK Query). Designed normalized MongoDB schemas for Users, Vendors, Products, Orders, Carts, and Reviews.
- **Multi-Vendor Cart & Idempotent Checkout**: Implemented multi-vendor cart logic grouping items by maker, calculating shipping and taxes accurately, and enforcing atomic inventory decrements during order creation.
- **Optimistic Concurrency & Stock Protection**: Solved overselling during concurrent checkout spikes using atomic MongoDB conditional updates (`$inc: { stock: -qty }` where `stock >= qty`) with automatic rollback compensation.
- **Search Projections & Redis Caching**: Built high-speed product catalog caching with Redis and Elasticsearch outbox projections for full-text search, auto-suggestions, and category filtering.
- **Payment Gateway Integration (Razorpay Route)**: Implemented Razorpay Route multi-split payments supporting marketplace commission deductions, direct vendor transfers with settlement holds, and signature-verified webhook handlers (`order.paid`, `payment.failed`, `refund.processed`).
- **Artisanal Maker-First UI/UX**: Crafted a bespoke e-commerce interface featuring an earthy editorial palette, accessible typography, responsive product filtering, dynamic cart drawers, and separate portals for Customers, Vendors, and Administrators.

---

## 2. Technical Skills Learned & Deepened

- **Distributed Transactions & Sagas**: Learned how to handle multi-step checkouts across multiple vendors without distributed two-phase commits by employing compensating transactions and idempotency keys.
- **Elasticsearch Query DSL & Synced Projections**: Implemented outbox patterns to synchronize MongoDB product mutations to Elasticsearch indexes with fuzzy matching and facet aggregations.
- **JWT Authentication with Rotating Refresh Sessions**: Deepened security expertise with short-lived access tokens (15m) and atomic single-use refresh tokens stored in HttpOnly, SameSite cookies with SHA-256 database hashing.
- **High-Precision Financial Accounting**: Enforced integer representation (paise/cents) across all monetary fields to completely eliminate IEEE 754 floating-point rounding errors in order totals and commission payouts.

---

## 3. Key Challenges & Technical Decisions

### Challenge 1: Multi-Vendor Inventory Race Conditions
- **Problem**: When multiple customers attempt to purchase the final unit of an artisan product simultaneously, naive read-then-write logic results in negative inventory.
- **Options Considered**:
  1. Distributed Redis locks across checkout sessions.
  2. Database table-level locks.
  3. Atomic conditional queries with rollback compensation.
- **Decision & Implementation**: Utilized MongoDB atomic conditional operations:
  ```typescript
  const updated = await Product.findOneAndUpdate(
    { _id: item.productId, stock: { $gte: item.quantity } },
    { $inc: { stock: -item.quantity } },
    { new: true }
  );
  if (!updated) throw new InsufficientStockError(item.productId);
  ```
  If any subsequent item in a multi-item order fails, previously decremented items are compensated immediately, guaranteeing consistent stock levels.

### Challenge 2: Secure Multi-Split Vendor Payouts
- **Problem**: Calculating and settling individual vendor payments while holding payouts until product delivery confirmation.
- **Decision & Implementation**: Leveraged Razorpay Route split transfers. Upon customer payment capture, the marketplace automatically calculates platform commission (e.g. 10%) and creates vendor transfer transfers with `on_hold: true`. Once delivery is confirmed or return windows expire, settlement holds are lifted via scheduled API calls.

---

## 4. Verification & Testing Evidence

All systems were thoroughly validated using automated unit tests, integration suites, and end-to-end commerce checks:

```powershell
# 1. Full workspace typecheck:
npm run typecheck
# Result: 0 errors across @fs01/api and @fs01/web

# 2. Automated unit & commerce tests:
npm test
# Result: 13 passed (4 test files: commerce rules, payment webhooks, Express app, web utils)

# 3. Comprehensive End-to-End Suite:
node e2e-review.mjs
# Result:
# - Health check /ready: OK
# - Catalog fetch & product filters: OK (12 items)
# - Customer auth & JWT refresh: OK
# - Multi-vendor cart add/update: OK
# - Concurrent checkout race test: Passed (zero overselling)
# - Razorpay webhook signature verification: OK
# - Vendor dashboard metrics & order status updates: OK
```

---

## 5. What I Would Improve With Another Iteration

1. **Automated Return & Refund Workflows**: Build self-service customer return workflows with automated shipping label generation and webhook-triggered partial refunds.
2. **Real-Time Vendor Order Notifications**: Integrate WebSocket feeds or server-sent events (SSE) for instant sound and push notifications when new orders are placed.
3. **Advanced Maker Analytics**: Provide vendors with cohort retention charts, average order value (AOV) tracking, and inventory restock prediction models.
