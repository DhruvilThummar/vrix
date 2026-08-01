# VRIX Platform: Full Scope of Deliverable Pages Mapped

This document serves as a comprehensive guide to the **VRIX Storefront & Admin Platform**, mapping each storefront and administration page, explaining their operational mechanics, how to toggle features on or off, and how to register new pages.

---

## 🛍️ Client Storefront Pages

### 1. ` / ` (Homepage)

* **What is in this page:**
  * **Banner Hero Slider:** Elegant luxury banner slider highlighting collections with high-quality media.
  * **Custom Collections Layout:** Visually distinct grids showing featured architectural jewelry collections.
  * **Philosophy Details:** A dynamic brand value grid showing details like craft, legacy, and design values.
  * **Categories Explorer:** Quick navigation tabs/blocks to filter by jewelry category (Rings, Necklaces, Bracelets, etc.).
* **Admin Management:** Controlled via `/admin/homepage` and `/admin/cms`. Slider image/texts and featured collection keys are managed here.
* **How to Toggle Visibility:** Toggled via the `/admin/homepage` dynamic categories/collection organizer or the navigation manager.

### 2. `/search` (Dynamic Search Catalog)

* **What is in this page:**
  * Interactive product catalog queryable by keywords, materials, or collections.
  * Dynamic filtering controls and active currency conversions (INR, USD, EUR) automatically formatted.
* **Admin Management:** Synchronized with the Products Catalogue database (`/admin/products`). Any hidden product (toggled in product settings) is filtered out.

### 3. `/collections` (Catalog Collections Hub)

* **What is in this page:**
  * Visual index page presenting all active luxury jewelry collections.
* **Admin Management:** Collections are toggled and created in `/admin/collections` or `/admin/navigation` for custom category layouts.

### 4. `/collections/[slug]` (Specific Collection Layouts)

* **What is in this page:**
  * Paginated/infinite-scroll views of products within a specific collection (e.g., *Silent Center*).
* **Admin Management:** Items assigned to a collection will appear here instantly when marked as "Visible".

### 5. `/product/[id]` (Interactive Product Detail Page)

* **What is in this page:**
  * Interactive Product Detail Page featuring image galleries, metal/materials swatches, size selectors, live stock status, engraving inputs, gift note custom text box, and SKU.
* **Admin Management:** Admin products manager (`/admin/products`) configures available sizes, engraving options, gift options, and image URLs.

### 6. `/modular-builder` (Drag-and-Drop Customizer Builder)

* **What is in this page:**
  * Interactive customization studio where clients visually build modular jewelry items.
* **Admin Management:** Toggleable settings under the Custom Pages CMS.

### 7. `/bespoke` (Solitaire Selector Configurator)

* **What is in this page:**
  * Luxury ring builder featuring shape selectors (Round, Oval, Emerald, Pear), metal/alloy switches, live carats range sliders, and price updates based on customization.
* **Admin Management:** Custom parameters managed under `/admin/cms` (Bespoke Atelier tab), which controls base price, available carats range, default carat, and allowable metals.

### 8. `/vrix-plus` (Exclusive Loyalty Member Page)

* **What is in this page:**
  * Landing page for VRIX+ membership benefits, joined date trackers, and exclusive member-only pricing.
* **Admin Management:** Program names, tagline, welcome gifts, and member benefits copy are set under `/admin/cms` (VRIX+ tab).

### 9. `/cart` (Bag Item Summary)

* **What is in this page:**
  * Shopping bag containing selected pieces, order summary calculations, metal swatches chosen, gift wrapping add-ons, and promo code inputs.
* **Admin Management:** Gift wrapping cost and promo codes are managed under `/admin/cms` (Gift Wrapping) and `/admin/marketing` (Redeem Codes) respectively.

### 10. `/checkout/shipping` & `/checkout/payment`

* **What is in this page:**
  * Shipping address inputs, shipping tier selectors, and Razorpay payment gateway SDK integration.
* **Admin Management:** Webhooks, transaction processing logs, and payment configurations are managed via `/admin/security`.

### 11. `/wishlist`

* **What is in this page:**
  * Locally and user-account cached saved items list for premium customers.

### 12. `/story` (Brand Narrative) & `/journal` (Style Guides Editorial)

* **What is in this page:**
  * `/story`: Beautiful editorial outlining VRIX design ethos, craft, and history.
  * `/journal`: Style guides, editorials, and design articles.
* **Admin Management:** Manage brand ethos copy under `/admin/cms` (Story tab) and write/publish journal articles under `/admin/cms` (Journal tab).

---

## ⚙️ Administration Dashboard Pages

### 1. `/admin` (Sales & Activity Overview)

* **Dashboard Stats:** Live revenue tracker, total orders counter, pending fulfillment metrics, catalog item statuses (out of stock, hidden), and active coupon logs.
* **Quick Actions:** Shortcuts for creating products, managing CMS systems, setting promo codes, and processing orders.

### 2. `/admin/products` (Catalog Database Manager)

* Add, edit, archive, and delete products. Set metals, custom engraving fields, pricing, and stock.
* **Toggle Visibility:** Double-click visibility switches to hide or show items in the storefront.

### 3. `/admin/homepage`

* Manage the homepage hero carousel, select featured products, rearrange collections layout, and configure philosophy cards.

### 4. `/admin/cms` (Settings & General Copy Panel)

Contains multiple configuration tabs:

* **Story:** Editorial body content, banner images, and ethos grids.
* **Legal:** Manage Markdown copies for Privacy Policies, Refund Rules, and Terms.
* **Journal:** Article creator, editor, and publisher.
* **Bespoke Atelier:** Settings for `/bespoke` (metal colors, default carats, minimum and maximum carat limits, base pricing).
* **VRIX+:** Configure the loyalty banner image, tagline, benefits list, and pricing structures.
* **Custom Pages:** Content configuration for custom pages (Careers, Craftsmanship, Sustainability).
* **Gift Wrapping:** Toggle state, title, descriptive copy, price, and image.
* **Announcement Bar:** Global scrolling bar toggle, custom scroll interval, font sizes, background colors, and message lines stack.

### 5. `/admin/navigation` (Routing & Menu Header Links)

* Organize the client-facing main menu navigation tree. Easily reorder menu items, delete links, or configure path routings.

### 6. `/admin/orders` (Order Processing & Fulfilment)

* Access all incoming order receipts, assign staff to deliveries, view shipping addresses, and monitor payment signatures.

### 7. `/admin/delivery` (Agents Portal)

* OTP Verification log monitoring for assigned agents to confirm secure handoffs of luxury items.

### 8. `/admin/security` (API Credentials Portal)

* Control API toggle keys and credential forms for Cloudinary, Razorpay, Nodemailer SMTP servers, Truecaller, and Google Client IDs.

### 9. `/admin/media` (Media Library)

* Integrated assets manager storing brand imagery and product photos.

---

## 📦 Delivery Portal: Operational Instructions

VRIX utilizes a secure, OTP-verified system for physical delivery of high-value jewelry. Follow these instructions to manage the workflow:

### 1. Registering Delivery Staff
1. Go to the **Delivery Staff** panel (`/admin/delivery`) in the sidebar.
2. Click **+ Add Delivery Staff**.
3. Provide the name, email address, and select a role:
   * **Agent:** Authorized to conduct deliveries and perform OTP handoffs.
   * **Manager:** Authorized to assign packages and view verification histories.
4. Click **Save**.

### 2. Assigning Orders to Delivery Agents
1. Go to the **Orders** screen (`/admin/orders`).
2. Click on the order you wish to assign.
3. Locate the **Assigned Agent** dropdown field under order info.
4. Select your registered delivery agent and click **Update Assignment**. The order will automatically sync to their specific delivery agent portal.

### 3. Delivery Agent Login (OTP Authentication)
1. Delivery agents open the portal at `/delivery` on their mobile devices or tablets.
2. The agent enters their registered email address and clicks **Send Access OTP**.
3. A 6-digit passcode is sent to their inbox. Entering this code signs them in. No passwords are required.
4. Once logged in, the agent will see their custom list of assigned deliveries and shipping addresses.

### 4. OTP Handoff Verification
1. Upon arriving at the customer's location, the agent taps the order on their screen and clicks **Verify Handoff**.
2. The system triggers a unique delivery validation code (OTP) via SMTP/SMS to the customer's contact details.
3. The customer receives the OTP code and shares it with the agent.
4. The agent enters the code in the delivery portal:
   * **Valid OTP:** The order is instantly marked as **Delivered**, and a secure log record is registered.
   * **Invalid OTP:** Handoff is blocked, preventing package misplacement or security breaches.

---

## ⚙️ How to Toggle (Turn On / Off) Features

You can turn off pages/features dynamically in two ways:

### A. Disable Storefront Links (Dynamic Navigation Toggling)

1. Navigate to `/admin/navigation`.
2. Find the page you wish to deactivate (e.g., VRIX+ Club).
3. Click the **Delete** button next to its link to remove it from the header menu.
4. If you want to add it back later, click **Add Link**, label it, set the path back (e.g. `/vrix-plus`), and click **Save Changes**.

### B. Toggle Feature Settings (CMS Toggles)

1. Navigate to `/admin/cms`.
2. Select the corresponding tab:
   * **Bespoke Atelier:** Set **Bespoke Enabled** toggle (On/Off).
   * **Gift Wrapping:** Toggle **Gift Wrapping Enabled** (On/Off).
   * **Announcement Bar:** Toggle **Announcement Bar Enabled** (On/Off).
3. Click **Save CMS Settings** at the bottom of the page to apply.

---

## ➕ How to Add a New Page to the Admin Panel

If you want to add a new admin page (e.g. `/admin/new-feature`):

### Step 1: Create the Next.js Route

Create a new directory and a `page.tsx` file inside `Frontend/src/app/(admin)/admin/`:

```bash
# Example Directory structure:
Frontend/src/app/(admin)/admin/new-feature/page.tsx
```

### Step 2: Add Link to Admin Layout Navigation Sidebar

Open `Frontend/src/app/(admin)/layout.tsx` where the sidebar menu is defined:

1. Search for the admin links array or JSX list.
2. Add the new item to the navigation list:

   ```tsx
   { label: "New Feature", href: "/admin/new-feature", icon: "featured_seasonal" }
   ```

### Step 3: Register Quick Actions in the Admin Dashboard Overview

Open `Frontend/src/app/(admin)/admin/page.tsx`:

1. Search for `const quickLinks = [...]` (line 58).
2. Append your new action page link:

   ```tsx
   { label: "New Feature", href: "/admin/new-feature", icon: "settings_suggest", desc: "Manage new feature settings" }
   ```
