# Common Goods — Multi-Vendor E-Commerce Marketplace (FS-01)

> **Zitus Internship Capstone Project FS-01**  
> **Lead Software Engineer:** Yuvraj Negy (Full-Stack Engineering Intern)  
> **Submission Date:** November 20, 2026  
> **Tech Stack:** React 19, Vite, TypeScript, Redux Toolkit, Node.js, Express 5, MongoDB (with Zero-Config In-Memory Fallback), Redis, Elasticsearch, Razorpay Route / Stripe Connect, Tailwind CSS / Vanilla Design Tokens

[![Tests](https://img.shields.io/badge/tests-13%20passed-brightgreen.svg)](docs/TEST_REPORT.md)
[![E2E Scenarios](https://img.shields.io/badge/e2e%20review-10%2F10%20passed-brightgreen.svg)](docs/TEST_REPORT.md)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue.svg)](tsconfig.json)
[![Security Audit](https://img.shields.io/badge/vulnerabilities-0-brightgreen.svg)](package.json)

---

## 1. Executive Summary & Vision

**Common Goods** is a production-grade Amazon-style multi-vendor marketplace designed for independent artisans, craft studios, and conscious consumers. The platform enables multiple independent makers to onboard, list handcrafted products, manage inventory, and fulfill orders, while customers enjoy an intuitive, Amazon-inspired shopping experience with an artisanal aesthetic (earthy tones, forest greens, terracotta accents, warm typography).

The platform automatically handles order splitting, takes a 10% platform commission on every transaction, routes 90% net earnings to individual vendor escrow accounts (via Razorpay Route / Stripe Connect architecture), reserves inventory atomically to prevent overselling under high concurrency, and generates downloadable GST tax invoices with QR verification.

---

## 2. Key Features Breakdown

### Customer Experience
- **Amazon-Inspired Storefront**: High-converting hero banner, category carousels, artisan spotlights, and Deal of the Day.
- **Search & Filtering**: Real-time auto-suggest, category filtering (Home & Living, Accessories & Wear, Apothecary & Wellness, Stationery & Paper), customer review filters, price range sliders, and Elasticsearch outbox sync.
- **Amazon-Style Buy Box & Product Detail**: Fast pincode delivery estimator (e.g. `110001` Delhi), stock urgency counters ("Only 6 left in stock - order soon"), seller attribution, quantity selector, and one-click "Add to Cart" / "Buy Now".
- **Cart & Slide-Out Drawer**: Instant Redis-cached cart state, coupon code applicator (`WELCOME10` for 10% off), delivery fee calculation, and order total breakdown.
- **Customer Orders & 4-Stage Visual Tracker**: Real-time order tracking timeline stepping through `PLACED` ➔ `PACKED` ➔ `SHIPPED` ➔ `DELIVERED`, complete with courier tracking IDs and simulated status advancement.
- **GST Tax Invoices**: Downloadable PDF tax invoices featuring vendor GSTIN, customer shipping address, itemized HSN breakdown, and QR code verification.
- **Wishlist & Verified Reviews**: Persistent customer wishlist synced with MongoDB, star ratings (1–5 stars), headline, and written review submissions.

### Vendor Studio (Seller Central)
- **Vendor Onboarding & Profile**: Artisans submit business details, shop name, slug, bio, and linked settlement account credentials (`acc_demo_xxx`).
- **Product Management (CRUD)**: Vendors create and update product listings with multi-image support, stock quantities, MSRP, selling price in paise, and category tags.
- **Inventory Ledger**: Real-time stock status monitoring with automated low-stock warnings.
- **Financial Split & Escrow Ledger**: Automated visibility into gross merchandise sales, 10% platform deduction, and 90% net pending/cleared payouts.

### Platform Administration (Admin Command Center)
- **Vendor Moderation**: Review pending artisan shop applications and toggle `APPROVED` / `REJECTED` status.
- **Product Moderation**: Inspect newly submitted or modified product listings before publishing to the live marketplace catalog.
- **Financial Analytics**: Live gross merchandise value (GMV), net platform fee revenue, active vendor counts, total orders, and payment method breakdown.
- **Audit Logging**: Structured audit trail logging administrative moderation events with request IDs and timestamps.

---

## 3. System Architecture & Tech Stack

```
                              ┌──────────────────────────────────┐
                              │     React 19 + Vite Frontend     │
                              │ (Redux Toolkit, RTK Query, CSS3) │
                              └─────────────────┬────────────────┘
                                                │ REST API / JSON
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Express 5 Monolithic REST API                          │
│                                                                                 │
│   ┌───────────────┐   ┌────────────────┐   ┌───────────────┐   ┌────────────┐   │
│   │  Auth & RBAC  │   │ Catalog Engine │   │ Cart & Orders │   │ Payments & │   │
│   │ (JWT + Cookie)│   │ (Buy Box, S3)  │   │ (Atomic Res.) │   │ Split/GST  │   │
│   └───────┬───────┘   └────────┬───────┘   └───────┬───────┘   └─────┬──────┘   │
└───────────┼────────────────────┼───────────────────┼─────────────────┼──────────┘
            │                    │                   │                 │
            ▼                    ▼                   ▼                 ▼
   ┌─────────────────┐  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐
   │  MongoDB Atlas  │  │  Elasticsearch  │ │  Redis Session  │ │ Razorpay /    │
   │ (or In-Memory)  │  │  (Sync Outbox)  │ │   (Cart Cache)  │ │ Stripe Connect│
   └─────────────────┘  └─────────────────┘ └─────────────────┘ └───────────────┘
```

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, React Router 7, Redux Toolkit, RTK Query, Lucide Icons | Responsive client application with Amazon UX pattern and bespoke artisan styling. |
| **Backend API** | Node.js 22, Express 5, TypeScript, Zod, Helmet, CORS, Cookie-Parser | Modular REST API with strict request validation and defense-in-depth security. |
| **Database** | MongoDB / Mongoose (with automated In-Memory fallback for zero-config demo) | Document models for Users, Vendors, Products, Orders, Payments, Ledgers, Reviews, Coupons. |
| **Caching** | Redis (with in-memory Map fallback) | High-throughput cart caching and session key storage. |
| **Search Engine** | Elasticsearch 8 (with outbox worker sync and MongoDB regex fallback) | Fuzzy full-text product search across titles, descriptions, and categories. |
| **Payments** | Razorpay Route & Stripe Connect Architecture | Escrow split payments: 10% platform fee, 90% vendor linked account transfer. |
| **Storage & Docs** | S3 adapter, PDFKit invoice generation, Swagger UI (OpenAPI 3.1) | Clean storage abstraction and interactive API docs at `/docs`. |

---

## 4. Deliverables Checklist & Directory Structure

All capstone deliverables required for evaluation are located in the `deliverables/` folder:

- **10-Minute Presentation Slide Deck**: [`deliverables/FS-01-Multi-Vendor-Marketplace-10-Minute-Presentation.pptx`](deliverables/FS-01-Multi-Vendor-Marketplace-10-Minute-Presentation.pptx)  
  *(Professional 10-slide PowerPoint covering Problem, Market Opportunity, Architecture, Concurrency, Split Payments, Demo, Results, and Future Roadmap)*
- **Presentation Companion Deck**: [`deliverables/PRESENTATION_DECK.md`](deliverables/PRESENTATION_DECK.md)
- **Individual Reflection Report**: [`deliverables/INDIVIDUAL_REFLECTION.md`](deliverables/INDIVIDUAL_REFLECTION.md)  
  *(Detailed technical reflection by Yuvraj Negy on architectural decisions, race conditions, and personal learnings)*
- **Architecture & API Specification**: [`deliverables/ARCHITECTURE_AND_API_SPEC.md`](deliverables/ARCHITECTURE_AND_API_SPEC.md)
- **High-Resolution Screenshots**: [`deliverables/screenshots/`](deliverables/screenshots/)
  - `01_storefront_hero.png`: Home page hero banner and artisan spotlight
  - `02_catalog_showcase.png`: Multi-vendor product grid and pricing
  - `03_product_detail_buybox.png`: Buy Box, stock countdown, and pincode check
  - `04_cart_drawer.png`: Slide-out shopping bag, coupon code, and totals
  - `05_order_tracking.png`: 4-stage tracking timeline (`PLACED` ➔ `DELIVERED`)
  - `06_vendor_central.png`: Artisan studio, inventory management, and payouts
  - `07_admin_analytics.png`: Admin command center, GMV, and vendor moderation

---

## 5. Quickstart & Installation

The application includes an automated **Zero-Config In-Memory Engine** that runs out of the box with zero external dependencies (no Docker or external MongoDB required for local evaluation).

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/its-negy-lmsy/FS-01.git
cd FS-01
npm install
```

### Step 2: Environment Setup
```bash
# Copy default development environment variables
cp .env.example .env
```

### Step 3: Run Development Server
```bash
npm run dev
```

The application will start:
- **Web Storefront:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **Swagger Documentation:** [http://localhost:4000/docs](http://localhost:4000/docs)

*Note: On startup, the server automatically boots an in-memory database instance, seeds 12 handcrafted artisan products across 4 categories, and creates pre-configured demo accounts.*

---

## 6. Pre-Configured Evaluation Credentials

For seamless evaluation, use the **Instant Test Switcher** in the top navigation bar, or log in manually with the following credentials:

| Role | Email | Password | Details |
|---|---|---|---|
| **Customer** | `customer@fs01.local` | `CustomerDemo!2026` | Active shopper account with saved orders and cart |
| **Artisan Maker (Vendor)** | `maker@fs01.local` | `MakerDemo!2026` | Approved vendor (*Studio North* ceramics & lighting) |
| **Artisan Maker 2** | `nomad@fs01.local` | `NomadDemo!2026` | Approved vendor (*Nomad Workshop* waxed canvas) |
| **Platform Administrator** | `admin@fs01.local` | `AdminDemo!2026` | Full platform administrative privileges |

---

## 7. Testing & Verification

Run the comprehensive test suites:

```bash
# 1. Run all unit tests (Health, Auth, RBAC, Ledger, Currency)
npm test

# 2. Run end-to-end integration scenario suite (10/10 scenarios)
node e2e-review.mjs

# 3. TypeScript typecheck across all workspaces
npm run typecheck

# 4. Production build check
npm run build
```

Read the complete [Test & Verification Report](docs/TEST_REPORT.md) for full benchmark metrics.

---

## 8. Author & Acknowledgments

- **Lead Engineer:** Yuvraj Negy (Full-Stack Software Engineering Intern)
- **Project:** FS-01 Multi-Vendor E-Commerce Marketplace Capstone
- **Date:** November 2026
