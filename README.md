# SteelCraft Furniture — React Frontend

> Stack: React 18 · Vite · TypeScript · Redux Toolkit · RTK Query · React Router v6 · Tailwind CSS · Zod · React Hook Form · React Leaflet

## Quick Start

```bash
npm install
cp .env.example .env   # edit backend URL if needed
npm run dev            # http://localhost:3000
npm run build          # production build → dist/
```

## Page → Route Map

| URL | Page |
|-----|------|
| / | Home — hero, categories, featured, reviews |
| /store | Store — search + ?cat= filter |
| /product/:id | Product Detail |
| /cart | Cart — GST 18% + shipping calc |
| /checkout | Checkout — 5-step RHF+Zod form |
| /wishlist | Wishlist |
| /compare | Compare — side-by-side table up to 3 |
| /wholesale | RFQ form — Zod validated |
| /ai | AI Builder — calls claude-sonnet-4-6 |
| /dashboard | Dashboard — 6 tabs |
| /contact | Contact — form + OpenStreetMap |
| /about | About — timeline, values |
| /settings | Settings — dark mode toggle |
| /admin | Admin — order + RFQ management |

## API Routes (Backend Contract)

All defined in src/api/steelApi.ts. Vite proxy: /api/* → localhost:8080

```
POST   /api/auth/register         { name, email, phone, password }
POST   /api/auth/login            { email, password } → { token }
GET    /api/auth/me
PUT    /api/auth/profile          { name, phone, city, state }

GET    /api/products              ?cat=&search=&page=&limit=
GET    /api/products/:id
POST   /api/products              (admin)
PUT    /api/products/:id          (admin)
DELETE /api/products/:id          (admin)

GET    /api/categories

GET    /api/orders                (user's orders)
GET    /api/orders/:id
POST   /api/orders                { items:[{productId,qty}], address, shipping, payment, coupon }

GET    /api/admin/orders          ?status=
PUT    /api/admin/orders/:id      { status }
GET    /api/admin/rfq
PUT    /api/admin/rfq/:id         { status }
GET    /api/admin/stats

POST   /api/rfq                   { co, nm, ph, em, ci, pr, qty, no }

POST   /api/ai/design             { prompt } → AI design JSON
                                  (proxy Gemini on server — keep key off browser)

POST   /api/contact               { name, phone, email, subject, message }
POST   /api/coupons/validate      { code, cartTotal }
```

## Redux Slices

| Slice | Key actions |
|-------|------------|
| cart | addToCart, removeFromCart, updateQty, clearCart |
| wish | toggleWish |
| compare | toggleCompare, clearCompare (max 3) |
| ui | toggleDark, setDrawer, setNotif, addRecentlyViewed |
| orders | placeOrder, updateOrderStatus, addRFQ, setCheckout |
| user | setUser |

## Connecting to Backend

1. Set VITE_API_BASE_URL=/api in .env
2. Change proxy.target in vite.config.ts to your backend host
3. Replace SEED_ORDERS / SEED_RFQS / PRODS with live RTK Query hooks
4. Implement POST /api/ai/design on backend to proxy Gemini (remove direct browser call in AIBuilder.tsx)
