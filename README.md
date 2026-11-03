# Invoxa - Mobile & Tablet Billing Suite

**Billu** is a touch-first, mobile and tablet billing application built with **Next.js**, **Capacitor**, and **Neon Serverless PostgreSQL**.

Designed specifically for smartphones and tablets (touch-first UI, bottom navigation bar, safe-area insets, digital signature pad, tablet dual-pane live preview).

---

## 🚀 Key Features

1. **Touch-First Mobile & Tablet UI**:
   - Single-column phone view with bottom navigation bar and floating action button.
   - Dual-pane tablet split view (live synchronized bill on the right, editor on the left).
   - In-app Phone/Tablet toggle for quick testing on desktop browsers.
   - Haptic touch feedback using `@capacitor/haptics`.

2. **Complete Professional Invoicing**:
   - **Seller Profile**: Company name, logo, address, GSTIN, PAN, and phone/email.
   - **Buyer / Client Info**: Quick client selector + in-place client addition with phone and GSTIN.
   - **Item Catalog**: Products and services with HSN/SAC codes, customizable units (`pcs`, `service`, `hrs`, `kg`, `box`), and GST tax rates (0%, 5%, 12%, 18%, 28%).
   - **Calculations**: Auto subtotal, item & overall discount (% or flat), GST split (Intra-state CGST + SGST vs Inter-state IGST), and round-off adjustment.
   - **Amount in Words**: Indian numbering system (Lakhs, Crores).
   - **Bank & UPI Payment**: Bank details and dynamic UPI QR code generator for instant mobile scan-to-pay.
   - **Digital Signature**: Touch screen finger/stylus canvas drawing or saved image stamp upload.
   - **PDF Generation & Native Share**: 1-tap client-side PDF export (`jspdf` + `html2canvas`) and WhatsApp / OS Share sheet integration (`@capacitor/share`).

3. **Neon Serverless PostgreSQL + Drizzle ORM**:
   - Resilient offline-first storage with instant local caching and automatic Neon DB cloud sync.
   - Auto-creates database tables and schema migrations on first connection.
   - Built-in in-app Neon DB connection status test modal.

---

## 🛠️ Getting Started

### 1. Install Dependencies & Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your mobile browser or device simulator.

### 2. Connect Your Neon Database (Optional)
Copy `.env.example` to `.env.local` and add your Neon connection string:
```bash
cp .env.example .env.local
```
Add your URL:
```env
DATABASE_URL="postgres://user:password@ep-your-branch-id.region.aws.neon.tech/neondb?sslmode=require"
```
Once added, restart `npm run dev` and tap the **Neon DB** indicator pill in the app header to sync tables!

### 3. Build for iOS & Android via Capacitor
To build a native mobile app:
```bash
# Build static web bundle
npm run build

# Add iOS or Android platform
npx cap add ios
npx cap add android

# Sync web assets to native project
npx cap sync

# Open in Xcode or Android Studio
npx cap open ios
npx cap open android
```

---

## 📁 Project Structure

- `src/app/page.tsx` - Main mobile application controller with tab state
- `src/app/globals.css` - Custom mobile & tablet Vanilla CSS design system
- `src/components/SignaturePad.tsx` - Touch screen canvas signature pad & image uploader
- `src/components/InvoiceTemplate.tsx` - Tax invoice template with GST & UPI QR code
- `src/components/CreateBillScreen.tsx` - Interactive bill creation wizard & tablet dual-pane
- `src/components/DashboardScreen.tsx` - Metrics, recent bills & quick actions
- `src/components/InvoicesScreen.tsx` - Searchable invoice list with filter chips
- `src/components/ProductsScreen.tsx` - Product & service catalog management
- `src/components/ClientsScreen.tsx` - Client directory with WhatsApp chat link
- `src/components/SettingsScreen.tsx` - Business profile, bank details & default signature
- `src/components/InvoiceDetailModal.tsx` - PDF export, WhatsApp & native share
- `src/components/NeonConfigModal.tsx` - Neon DB connection status and schema sync
- `src/lib/db/` - Neon PostgreSQL schema & Drizzle ORM client
- `src/lib/storage.ts` - Offline-first storage layer with demo data seed
- `src/lib/utils.ts` - Indian currency formatter, number-to-words, and haptics
