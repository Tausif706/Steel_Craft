# SteelCraft — Market Readiness Assessment
**Date:** June 2026 | **Stack:** React + Vite + TypeScript + Supabase + Gemini AI

---

## TL;DR — Current State

| Layer | Status |
|---|---|
| Auth (email/password, RLS) | ✅ Production-ready |
| Product catalog + cart + wishlist | ✅ Production-ready |
| AI custom furniture builder (Gemini) | ✅ Production-ready |
| Admin dashboard (orders, RFQs, custom orders, users) | ✅ Production-ready |
| B2B wholesale RFQ flow | ✅ Production-ready |
| Schema (Sprint A: revisions, payments, materials) | ✅ Production-ready |
| Payment processing | ⚠️ Mock only — Razorpay not wired |
| Email/SMS notifications | ❌ Not implemented |
| Shipping / logistics API | ❌ Not implemented |
| GST invoice generation | ❌ Not implemented |
| SEO + meta tags | ❌ Not implemented |
| Error monitoring | ❌ Not implemented |
| Analytics | ❌ Not implemented |

---

## 1. PAYMENT GATEWAY — Razorpay (Sprint B-live)

**What's missing:** Real Razorpay order creation, checkout modal, and webhook verification.

**What to build:**

### A. Supabase Edge Function: `create-razorpay-order`
```typescript
// supabase/functions/create-razorpay-order/index.ts
// Called by frontend before showing Razorpay checkout modal
const razorpayOrder = await fetch('https://api.razorpay.com/v1/orders', {
  method: 'POST',
  headers: {
    Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ amount: totalInPaise, currency: 'INR', receipt: orderId }),
});
// Returns { id, amount, currency } — pass to Razorpay JS SDK on frontend
```

### B. Razorpay JS SDK in Checkout.tsx
```typescript
// Replace mockPayOrderThunk call with:
const rzp = new (window as any).Razorpay({
  key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  order_id: razorpayOrderId,   // from edge function above
  amount: totalInPaise,
  currency: 'INR',
  handler: async (response: any) => {
    // Verify on server — NEVER verify on frontend
    await dispatch(verifyPaymentThunk(response));
  },
});
rzp.open();
```

### C. Supabase Edge Function: `verify-razorpay-payment`
```typescript
// Verifies HMAC-SHA256 signature — runs server-side so secret key never leaks
import { createHmac } from 'https://deno.land/std/crypto/mod.ts';
const expected = createHmac('sha256', KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex');
if (expected !== razorpay_signature) throw new Error('Invalid signature');
// Then update payments.status = 'success'
```

### D. Razorpay Webhook (for async confirmation)
```
Endpoint: https://<project>.supabase.co/functions/v1/razorpay-webhook
Events to subscribe: payment.captured, payment.failed, refund.created
```

**Secrets to set:**
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxx
supabase secrets set RAZORPAY_KEY_SECRET=your_secret
```

**Frontend env:**
```
VITE_RAZORPAY_KEY_ID=rzp_live_xxx   # publishable key only — safe to expose
```

**Add Razorpay script to index.html:**
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## 2. EMAIL NOTIFICATIONS — Resend (recommended) or SendGrid

**What's missing:** Transactional emails for order confirmation, custom order status updates, quote notifications, and OTP.

**Service choice:** Resend (https://resend.com) — Indian-friendly, simple API, free tier 3,000 emails/month.

### Supabase Edge Function: `send-email`
```typescript
// supabase/functions/send-email/index.ts
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

export async function sendOrderConfirmation(to: string, order: Order) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'orders@steelcraft.in',
      to,
      subject: `Order Confirmed — ${order.orderNumber}`,
      html: orderConfirmationTemplate(order),  // build an HTML template
    }),
  });
}
```

### Trigger emails from DB using Supabase DB Webhooks:
```
Table: orders      → event: INSERT    → send order confirmation
Table: orders      → event: UPDATE (status) → send status update
Table: custom_orders → event: UPDATE (admin_status = 'quoted') → send quote email
Table: payments    → event: INSERT (status = success) → send payment receipt
```

**Secrets:**
```bash
supabase secrets set RESEND_API_KEY=re_xxx
```

**Emails to build (HTML templates):**
1. Order confirmation (order number, items, total, delivery estimate)
2. Payment receipt (amount, method, GST breakdown)
3. Custom order quote (spec summary, price, accept/reject CTA)
4. Custom order status update (in production, dispatched, delivered)
5. Wholesale RFQ acknowledgement
6. Account OTP / password reset (Supabase handles this but you can customise template)

---

## 3. SMS NOTIFICATIONS — MSG91 (India-specific)

**Why SMS:** Many Indian B2B buyers and delivery confirmations rely on SMS, not email.

**Service:** MSG91 (https://msg91.com) — DLT-registered, OTP + transactional, widely used by Indian e-commerce.

**DLT registration required:** TRAI mandates all businesses sending commercial SMS in India register on the DLT (Distributed Ledger Technology) portal with their carrier. Budget 2–3 weeks for this.

```typescript
// supabase/functions/send-sms/index.ts
async function sendSms(mobile: string, message: string, templateId: string) {
  await fetch(`https://api.msg91.com/api/v5/flow/`, {
    method: 'POST',
    headers: { authkey: Deno.env.get('MSG91_AUTH_KEY')!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template_id: templateId,  // pre-approved DLT template ID
      short_url: '0',
      recipients: [{ mobiles: `91${mobile}`, var1: message }],
    }),
  });
}
```

**Templates to register on DLT:**
- Order placed: `"Your SteelCraft order #{1} is confirmed. Track at steelcraft.in/track"`
- Dispatched: `"Your order #{1} has been dispatched. AWB: {2}"`
- OTP: `"Your SteelCraft OTP is {1}. Valid for 10 minutes."`

---

## 4. SHIPPING / LOGISTICS — Shiprocket

**What's missing:** AWB generation, pickup scheduling, real-time tracking, auto-manifest.

**Service:** Shiprocket (https://shiprocket.in) — aggregates 17+ carriers (Delhivery, BlueDart, DTDC, Ecom Express), covers 29,000+ pincodes, supports COD.

### Integration flow:
```
1. Order placed → Create Shiprocket order via API → Get AWB number
2. Store AWB in orders.awb_number column (add migration)
3. Schedule pickup → Carrier picks up from your warehouse
4. Webhook: shipment status changes → update orders.status → trigger SMS/email
```

### Supabase Edge Function: `create-shipment`
```typescript
// Called when admin clicks "Dispatch" on an order
const token = await loginShiprocket();  // POST /auth/local

const shipment = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    order_id: order.id,
    order_date: new Date().toISOString(),
    pickup_location: 'Primary',
    billing_customer_name: order.customerName,
    billing_address: order.address,
    billing_pincode: order.pin,
    billing_state: order.state,
    billing_country: 'India',
    billing_phone: order.phone,
    order_items: order.items.map(i => ({ name: i.name, sku: i.sku, units: i.qty, selling_price: i.price })),
    payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    sub_total: order.total,
    length: 60, breadth: 40, height: 120, weight: 45,  // steel furniture defaults
  }),
});
// Returns { shipment_id, awb_code, courier_name }
```

**New migration column needed:**
```sql
alter table public.orders
  add column if not exists awb_number      text,
  add column if not exists courier_name    text,
  add column if not exists shiprocket_id   bigint;
```

---

## 5. GST INVOICE GENERATION

**What's missing:** PDF tax invoices (mandatory in India for B2B; strongly expected for B2C).

**Stack:** Supabase Edge Function + `jsPDF` or a serverless PDF service.

### Invoice must contain (as per Indian GST rules):
- Supplier GSTIN, name, address
- Invoice number and date (sequential — `SC-INV-2024-00001`)
- Buyer name, address, GSTIN (for B2B)
- HSN/SAC code for steel furniture (HSN: 9403)
- Taxable value, CGST (9%), SGST (9%) or IGST (18%) depending on inter/intra state
- Total amount in words
- Digital signature or authorised signatory name

```typescript
// supabase/functions/generate-invoice/index.ts
import { jsPDF } from 'npm:jspdf@2';

Deno.serve(async (req) => {
  const { orderId } = await req.json();
  // Fetch order + payment + customer from DB
  const doc = new jsPDF();
  // Build invoice layout
  doc.setFontSize(18);
  doc.text('TAX INVOICE', 105, 20, { align: 'center' });
  // ... add all fields ...
  const pdfBase64 = doc.output('datauristring');
  // Upload to Supabase Storage: invoices/{userId}/{invoiceNumber}.pdf
  return new Response(JSON.stringify({ url: publicUrl }));
});
```

---

## 6. SEO — Meta Tags + Sitemap + OG Tags

**What's missing:** Every page currently has the Vite default `<title>`. No OG images, no structured data, no sitemap.

### Update `index.html`:
```html
<title>SteelCraft — Steel Furniture | Custom | Wholesale | India</title>
<meta name="description" content="Factory-direct steel almirahs, wardrobes, office desks, school furniture. Custom design with AI. Bulk pricing for institutions. Pan-India delivery." />
<meta property="og:title" content="SteelCraft Steel Furniture" />
<meta property="og:image" content="https://steelcraft.in/og-image.png" />
<meta name="robots" content="index, follow" />
```

### Dynamic per-page titles (`react-helmet-async`):
```bash
npm install react-helmet-async
```
```tsx
// ProductDetail.tsx
import { Helmet } from 'react-helmet-async';
<Helmet>
  <title>{p.n} — SteelCraft</title>
  <meta name="description" content={p.description?.slice(0, 155)} />
  <meta property="og:image" content={p.img} />
</Helmet>
```

### `public/sitemap.xml` — generate at build time:
```xml
<url><loc>https://steelcraft.in/store</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
<url><loc>https://steelcraft.in/ai</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
<!-- one <url> per product — generate from catalog -->
```

### Google Product Schema (for rich results in search):
```json
{
  "@type": "Product",
  "name": "3-Door Steel Almirah",
  "brand": { "@type": "Brand", "name": "SteelCraft" },
  "offers": { "@type": "Offer", "price": "14500", "priceCurrency": "INR" }
}
```

---

## 7. ERROR MONITORING — Sentry

**Why:** Without error monitoring, production bugs are invisible until a customer complains.

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,  // 10% of transactions
  environment: import.meta.env.MODE,
});
```

**Frontend env:**
```
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## 8. ANALYTICS — PostHog (recommended) or Google Analytics 4

**PostHog advantage:** Self-hostable, GDPR-friendly, session recordings, funnel analysis — better than GA4 for product analytics.

```bash
npm install posthog-js
```

```typescript
// src/main.tsx
import posthog from 'posthog-js';
posthog.init(import.meta.env.VITE_POSTHOG_KEY, { api_host: 'https://app.posthog.com' });
```

**Key events to track:**
- `product_viewed` (product id, category, price)
- `add_to_cart` (product id, price)
- `checkout_started` (cart total, item count)
- `payment_completed` (total, method, order id)
- `ai_builder_started` / `ai_builder_completed`
- `rfq_submitted` (company, city, quantity)

---

## 9. PWA (Progressive Web App)

Steel furniture buyers on mobile should be able to install the app. Add:

```bash
npm install vite-plugin-pwa
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'SteelCraft',
    short_name: 'SteelCraft',
    theme_color: '#0D2847',
    background_color: '#F6F8FF',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
})
```

---

## 10. RATE LIMITING & SECURITY HARDENING

**Supabase built-ins (enable in dashboard):**
- Auth: enable CAPTCHA on signup/login (hCaptcha integration in Supabase Auth settings)
- Auth: set `max_request_per_hour` to 10 for OTP
- RLS: already enabled — verify every table has policies

**Edge function rate limiting:**
```typescript
// Add to every public edge function
const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
const key = `rate:${ip}`;
// Use Supabase KV or Upstash Redis to count requests per minute
```

**Content Security Policy in `index.html`:**
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' https://checkout.razorpay.com; img-src * data:;" />
```

---

## Launch Checklist — Priority Order

### Week 1 — Blockers (cannot go live without these)
- [ ] Razorpay live keys + Edge Functions `create-razorpay-order` + `verify-razorpay-payment`
- [ ] Razorpay webhook endpoint
- [ ] Order confirmation email (Resend)
- [ ] Custom domain + SSL (Cloudflare → Supabase)
- [ ] `.env` production values in Vercel/Netlify env vars (never commit)
- [ ] Supabase project on paid plan (free tier pauses after 1 week inactivity)

### Week 2 — High priority (affects trust and operations)
- [ ] GST invoice PDF generation
- [ ] SMS OTP + order dispatched SMS (MSG91 + DLT registration — start this ASAP, takes 2–3 weeks)
- [ ] Shiprocket integration + AWB generation
- [ ] Sentry error monitoring
- [ ] SEO meta tags + sitemap.xml

### Week 3 — Growth (after go-live)
- [ ] PostHog analytics + funnel tracking
- [ ] PWA manifest + service worker
- [ ] Google Merchant Center product feed (for Shopping ads)
- [ ] WhatsApp Business API (replace wa.me link with official API for templates)
- [ ] Admin email alerts for new orders / RFQs (daily digest)

### Ongoing
- [ ] Performance: Lighthouse score > 85 on mobile
- [ ] Image optimisation: WebP conversion for all product images
- [ ] CDN: enable Cloudflare in front of Supabase Storage for product images
- [ ] Backup: enable Supabase PITR (Point-in-Time Recovery) on Pro plan

---

## Cost Estimate (Monthly at Launch Scale ~500 orders/month)

| Service | Plan | Cost |
|---|---|---|
| Supabase | Pro | $25/month |
| Razorpay | 2% per transaction | ~₹4,500 on ₹2.25L GMV |
| Resend (email) | Free → Starter | $0 → $20 |
| MSG91 (SMS) | Pay per SMS ~₹0.22 | ~₹500 |
| Shiprocket | Per shipment ~₹45–120 | Passed to customer |
| Sentry | Free tier (5k errors) | $0 |
| PostHog | Free tier (1M events) | $0 |
| Cloudflare | Free | $0 |
| **Total platform cost** | | **~$55 + ₹5,000 ($60) ≈ ₹9,500/month** |

---

## What Does NOT Need Middleware

These are often asked about but already solved by the stack:

| Concern | Solution already in place |
|---|---|
| Authentication | Supabase Auth — JWT, RLS, refresh tokens |
| File storage (product images, design previews) | Supabase Storage with RLS |
| Real-time (order status live update) | Supabase Realtime subscriptions (add `supabase.channel()` where needed) |
| AI furniture design | Gemini API via Supabase Edge Function |
| Admin access control | `public.is_admin()` SECURITY DEFINER function + RLS |
| CORS | Handled in edge functions |
| Database backups | Supabase automatic daily backups (Pro plan: PITR) |
| SSL/TLS | Supabase handles, Cloudflare provides additional layer |
