# Architectural & Feature Audit Log

**Project:** Microgreens E-Commerce (`Tiny Floramicro Greens`)  
**Framework:** Next.js 16.4.4 (App Router), React 19.3.0, Prisma ORM, PostgreSQL  
**Audit Updated:** November 2026  

---

## 1. System Architecture & Standards

- **Strict Client & Server Separation:**
  - Client components explicitly declare `"use client"` at the top of the file.
  - No direct Prisma or database invocations inside client components; all mutations and queries route cleanly through secured backend endpoints (`/api/...`).
  - Next.js 16 PPR compliance: runtime `params` promises in dynamic routes and dynamic database calls (e.g. `FeaturedProducts` on the home page) are wrapped in `<Suspense fallback={...}>`.
- **State Management & Hydration:**
  - Cart storage uses `useSyncExternalStore` with an immutable cached empty snapshot (`EMPTY_ARRAY`) to eliminate infinite re-render loops and SSR hydration mismatches.
  - Server-calculated pricing ensures single source of truth for subtotals, free shipping thresholds, and tax/totals.
- **Design System Consistency:**
  - Uses CSS Modules with standardized design tokens:
    - `--forest: #24452f`
    - `--green: #315c3b`
    - `--cream: #f8f6ef`
    - `--ivory: #f3f1e8`
    - `--text: #1b2e20`
    - `--muted: #5a6b5a`

---

## 2. Product Catalog & Strict Backend Error Handling

### Elimination of Offline Fallback Modes
- Per production standards, offline fallback mock responses in API route handlers have been completely removed:
  - `GET /api/products`, `POST /api/products`
  - `GET /api/products/[id]`, `PATCH /api/products/[id]`, `DELETE /api/products/[id]`
  - `GET /api/categories`, `POST /api/categories`
  - `GET /api/categories/[id]`, `PATCH /api/categories/[id]`, `DELETE /api/categories/[id]`
  - `GET /api/orders`, `POST /api/orders`
  - `GET /api/featured`, `PUT /api/featured`
- If the database service or connection is unavailable, endpoints return a proper HTTP 500 status code with a descriptive JSON error message (`{ message: "Internal server error: Database service unavailable" }`).
- Client interfaces gracefully catch error responses and present actionable notification banners to the administrator.

---

## 3. Database Schema & Data Models

### Prisma Schema (`prisma/schema.prisma`)
- **`User`**: `id`, `email` (unique), `passwordHash`, `name`, `phone`, `role` (`CUSTOMER` / `ADMIN`), `createdAt`, `updatedAt`, `carts`, `orders`.
- **`Role`**: Enum with `CUSTOMER` and `ADMIN`.
- **`Cart` & `CartItem`**:
  - `Cart`: `id`, `userId` (nullable for guest carts), `guestToken` (for anonymous carts), `createdAt`, `updatedAt`, `items`.
  - `CartItem`: `id`, `cartId`, `productId`, `quantity`, `createdAt`, `updatedAt` with composite unique constraint `[cartId, productId]`.
- **`Order` & `OrderItem`**:
  - `Order`: `id`, `orderNumber` (unique), `userId` (optional), `customerName`, `customerEmail`, `customerPhone`, `shippingAddress`, `subtotal`, `shippingFee`, `total`, `status` (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), `createdAt`, `updatedAt`.
  - `OrderItem`: `id`, `orderId`, `productId`, `quantity`, `price` (recorded snapshot at purchase), `total`.
- **`Category` & `Product`**:
  - `Category`: `id`, `name`, `description`, `products`.
  - `Product`: `id`, `name`, `description`, `price`, `weight`, `image`, `stock`, `isActive`, `isFeatured`, `categoryId`, `createdAt`, `updatedAt`.
- **`StoreSettings` (`store_settings`)**:
  - `id`: Primary key.
  - `store_name`: Default `"Tiny Flora Microgreens"`.
  - `contact_email`: Default `"hello@tinyflora.com"`.
  - `contact_phone`: Default `"+91XXXXXXXXXX"`.
  - `whatsapp_number`: Default `"+91XXXXXXXXXX"`.
  - `address`: Default `"Lucknow, Uttar Pradesh"`.
  - `instagram_url`, `facebook_url`: Social link fields.
  - `delivery_charge`: Default `40.00` (Decimal).
  - `free_delivery_threshold`: Default `499.00` (Decimal).
  - `currency`: Default `"INR"`.
  - `announcement_text`: Default `"Fresh harvest available!"`.
  - `business_hours`: Default `"Mon - Sat: 9:00 AM - 7:00 PM"`.
  - `minimum_order_amount`: Default `0.00`.
  - `delivery_information`: Default `"Same-day harvest & delivery within 24-48 hours."`.

---

## 4. Admin Dashboard Metrics & Interfaces

### Dynamic Delivery Calculation
- Delivery charges (`delivery_charge`: ₹40) and threshold (`free_delivery_threshold`: ₹499) are fetched dynamically from `StoreSettings` via `/api/settings` and computed on the backend in `/api/cart` and `/api/orders`.
- The checkout page reflects dynamic calculation directly from CartContext and backend API sync.

### Customers Management Page (`/admin` -> `Customers` tab)
- Full customer directory view powered by `GET /api/customers` (Admin-only).
- Displays customer name, email, phone, registered date, total orders placed, and cumulative purchase value.

### Product Modal Cleanliness
- Removed `+ New` button from the Category selector in the Add Product modal for clean UX.

### Action Button & Featured Toggle Behavior
- Right-clicking specifically on the action button (`💬`) marks the product as featured / unfeatured.
- Left-clicking the action button opens the dropdown menu with the option "Mark as Featured" / "Unfeature".
- Exceeding the 3 featured items ceiling displays the hover tooltip warning with auto-dismissal.

---

## 4. Admin Dashboard Metrics & Interfaces

### Screenshot-Accurate Dashboard Layout (`/admin`)
- **Fixed & Non-Scrollable Dark Sidebar (`#12161f`):**
  - Brand header with Admin SVG icon & `Tinyflora` title.
  - Wire-like tree branch connectors (`.treeBranchNav`, `.treeBranchItem`) matching user design.
  - Collapsible navigation groups:
    1. **`Dashboard`** (Store Management, Categories, Order Management, Analytics, Reports).
    2. **`Inventory`** (Current stock, Low-stock products [filters stock < 10], Stock adjustments [inert], Stock movement history [inert]).
    3. **`Customers`** (Customer details, Contact info, Order history, Total purchases [all inert pending dev]).
    4. **`Orders`** (All Orders, Order details, Payment status, Status updates, Cancellation & refunds).
    5. **`Settings`** (Store details, Contact information, Delivery settings [active with direct sub-tab routing], Payment configuration [COD / Manual], Admin account [active]).
  - Fixed viewport height (`height: 100vh; overflow: hidden`), ensuring only main content scrolls.
- **Top Metrics Overview Cards (Live Calculated):**
  - **Total Revenue:** Sum of recorded orders.
  - **Total Orders:** Real total count of orders.
  - **Pending Orders:** Count of pending orders awaiting fulfillment.
  - **Total Products:** Total count of catalog products.
  - **Low-Stock Alerts:** Real-time count of products with stock < 10.
- **Store Settings Management (`/admin` -> `Settings` Tab):**
  - Partitioned into 3 intuitive tabs:
    1. **General Settings:** Store Name, Announcement Text, Currency, Business/Harvesting Hours.
    2. **Products & Delivery:** Standard Delivery Charge (₹), Free Delivery Threshold (₹), Minimum Order Amount (₹), Delivery & Harvesting Information.
    3. **Contact & Social:** Contact Email, Phone, WhatsApp, Physical Address, Instagram URL, Facebook URL.
  - Backed by `GET /api/settings` and `PATCH /api/settings` connected to `store_settings` table.
  - Instant site-wide synchronization:
    - `/api/cart` and `/api/orders` dynamically fetch live delivery charge and threshold.
    - `CartContext` dynamically consumes the live delivery settings on checkout.
    - `Footer` dynamically fetches `/api/settings` to display live store address, phone, email, and social links.
    - `/contact` page directly reads live settings via `getStoreSettings()` server helper.
- **Hassle-Free 3-Slot Featured Products UX:**
  - Top showcase card explicitly manages strictly 3 slots:
    - **Empty Slot:** Displays `+ Assign Slot #X` button opening a visual product picker modal.
    - **Filled Slot:** Displays product thumbnail, name, price, `⇄ Change` button, and `✕` remove button.
    - **Picker Modal:** Full catalog product list with live search, displaying thumbnail, title, category, and price with a 1-click `⭐ Select` button that immediately assigns the product to that slot.
  - Secondary shortcuts preserved:
    - Inline star indicator beside product name in the catalog table.
    - Right-click on circular action button (`💬`) to toggle featured status.
    - "Mark as Featured" / "Unfeature" option in the action dropdown menu.
- **Table Action Buttons & Confirmation Popups:**
  - Quick inline action buttons:
    - ✎ Edit Product -> opens Edit Product Modal.
    - ⏻ Status Toggle -> opens confirmation popup: "Do you want to make this product active/inactive?".
    - 🗑 Delete Product -> opens confirmation popup: "Do you really want to delete this product? You can make it inactive instead." (with "Make Inactive Instead", "Delete Anyway", and "Cancel").
  - Circular action menu button (`💬`) offering the complete options dropdown.
- **Category Management View (`Categories` Tab):**
  - View all categories with assigned product count.
  - `+ New Category` modal for creation.
  - ✎ Edit Category modal to update name and description.
  - 🗑 Delete Category: checks assigned product count; warns if category contains products or confirms deletion if unused.

---

## 5. Deployment Readiness, Supabase Integration & UI Polishing

- **Supabase PostgreSQL Ready:**
  - `prisma/schema.prisma` configured with dual datasources (`url = env("DATABASE_URL")` with pooler and `directUrl = env("DIRECT_URL")` for direct connection and schema changes).
  - `.env.example` created with production connection string documentation and parameter placeholders.
- **Automated Seeding System (`prisma/seed.js`):**
  - Run with `npm run seed` or `npx prisma db seed`.
  - Reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` to securely create the primary admin user with hashed credentials.
  - Automatically provisions `demo` / `demo` testing credentials.
  - Seeds default store settings record if not present.
  - Provisions 5 distinct product categories:
    1. *Fresh Microgreens*
    2. *Microgreen Mixes*
    3. *Gourmet Herb Greens*
    4. *Grow Trays & Live Kits*
    5. *Organic Seeds & Supplies*
  - Provisions 22 complete microgreen products with pricing, portion weights, stock levels, featured flags, descriptions, and high-resolution photography.
  - 100% idempotent via `upsert` and unique checks.
- **Zero-Emoji Professional Vector UI:**
  - All unicode emojis replaced across the application with high-quality Feather/Lucide-style vector inline SVGs ([`src/components/Icons.js`](file:///d:/microgreen-ecom/website/src/components/Icons.js)).
  - Clean SVG replacements for lock screens, warning tooltips, sidebar groups (Inventory, Customers, Orders, Settings, Sign Out), table actions (edit, delete, power toggle, more dots, featured stars), settings sub-tabs, upload triggers, and storefront footer items (location, mail, phone, benefits).
- **Comprehensive Runbook:**
  - [`DEPLOYMENT.md`](file:///d:/microgreen-ecom/website/DEPLOYMENT.md) created with step-by-step instructions for Supabase connection, GitHub push, EC2 environment setup, PM2 process management, and Nginx reverse proxy.

---

## 6. Verification & Quality Metrics

- **ESLint:** 0 errors, 0 warnings across all files in `src/`.
- **Next.js Production Build:** Webpack compilation and static prerendering verified for all 25 routes.

---

## 7. Authentication, Session Handling & Production EC2 Access

### Root Cause Analysis of EC2 "Restricted Access" Bug
1. **Plain HTTP vs. `Secure` Cookie Flag:**
   - In production on EC2 without an active SSL/TLS certificate (accessed via `http://<ec2-ip>:3000` or raw IP), setting `secure: process.env.NODE_ENV === "production"` caused the browser to enforce RFC 6265bis strict cookie policies.
   - Per RFC 6265bis, modern web browsers **silently reject** cookies bearing the `Secure` attribute when received over an unencrypted plain HTTP connection.
   - Consequently, the browser never saved the `auth_token` cookie. Subsequent requests to `/api/auth/me` or `/admin` transmitted no credentials, causing `getAuthUser` to return `null` and locking the admin out with a "Restricted Access" screen.
   - **Resolution:** Introduced dynamic HTTPS request protocol detection via `isHttpsRequest(request)` in [`src/lib/auth.js`](file:///d:/microgreen-ecom/website/src/lib/auth.js). It checks `x-forwarded-proto === "https"`, `request.nextUrl.protocol === "https:"`, and optional explicit override `process.env.COOKIE_SECURE === "true"`. This guarantees cookies are accepted when accessed directly via EC2 HTTP while preserving full SSL security when placed behind an HTTPS reverse proxy (e.g. Nginx with Let's Encrypt).

### Header User Initials & Dropdown Fix
2. **Dynamic Session Sync & Header Re-render:**
   - The user initials dropdown in [`src/components/Header/UserDropdown.js`](file:///d:/microgreen-ecom/website/src/components/Header/UserDropdown.js) previously fetched `/api/auth/me` only once on mount. During Next.js client-side route transitions, the root `Header` is not remounted, causing the guest state to remain cached.
   - Added active session verification on `pathname` change, as well as listeners for window `"auth-changed"` and `"focus"` events.
   - Added `{ cache: "no-store" }` and `Cache-Control: no-store, no-cache, must-revalidate` to `/api/auth/me` to prevent browser HTTP caching of guest status.
   - Ensured the dropdown displays user name, email, role badge, a non-responsive "My Profile" link, an admin "Dashboard" button (if role is `ADMIN`), and an active "Log out" action that clears the cookie and broadcasts the session update.

### Auth Route Guards
3. **Guarding `/login` and `/signup` from Authenticated Access:**
   - Added automated mount-time session verification to both [`src/app/(auth)/login/page.js`](file:///d:/microgreen-ecom/website/src/app/(auth)/login/page.js) and [`src/app/(auth)/signup/page.js`](file:///d:/microgreen-ecom/website/src/app/(auth)/signup/page.js).
   - If an authenticated session is detected, administrators are immediately redirected to `/admin` and customer accounts to `/shop`. Authenticated users can no longer view or re-submit the login or signup forms.

### Seeding Dual Admin Accounts
4. **Credential Provisioning in `prisma/seed.js`:**
   - Configured idempotent seeding for both:
     - Primary Admin: `manas@gmail.com` with password `adbYVIUawo2375` (or custom overrides from `.env`).
     - Test Admin: `demo` with password `demo`.
   - Both accounts are automatically created with `Role.ADMIN` and full dashboard access.

---

## 8. Responsive Modern Mobile & Tablet Admin Panel

- **Desktop Integrity Preserved:**
  - Viewports wider than `950px` maintain the exact existing enterprise desktop layout: fixed 260px dark sidebar on the left, right-hand main content area, with zero hamburger or backdrop elements.
- **Mobile & Tablet Modern Drawer Architecture (`<= 950px`):**
  - **Slide-out Drawer:** On mobile and tablet screens, the dark sidebar transforms into an off-canvas slide-out drawer (`position: fixed; width: 280px; max-width: 84vw; height: 100dvh; z-index: 1000; transform: translateX(-100%); transition: transform 0.28s ease;`).
  - **Backdrop Overlay:** A semi-transparent blurred backdrop (`mobileBackdrop`) mounts when the drawer is open. Tapping the backdrop or the close button (`✕`) dismisses the drawer smoothly.
  - **Top Mobile Header Bar:** Added a hamburger menu toggle button (`☰`) next to the page title in `.topHeaderLeft` so managers can toggle the drawer at any time.
  - **Scrollable Sidebar Content:** Added `overflow-y: auto` to `.sidebar` on mobile screens so all nested navigation groups (Dashboard, Inventory, Customers, Orders, Settings, Sign Out) can be scrolled without being clipped.
  - **Auto-Close on Navigation & Resize:** Tapping any destination link automatically closes the mobile drawer, and expanding the window back to desktop size cleanly resets the drawer state.
  - **Responsive Tables & Modals:** Data tables wrap in `.tableWrapper` with touch horizontal scrolling (`overflow-x: auto; min-width: 680px`), while modals and grids adapt responsively to viewport constraints.
