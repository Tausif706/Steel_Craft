# SteelCraft — Supabase Backend Setup

This document is everything you need to go from "zip file" to a running, fully
backed app. Frontend is wired up end-to-end — once these steps are done you
shouldn't need to touch any React code to get a working store, AI builder,
admin panel, etc.

## 1. Create a Supabase project

Go to https://supabase.com/dashboard → New Project. Note your project's
**URL** and **anon public key** (Settings → API) — you'll need them in step 4.

## 2. Run the database migrations

Open **SQL Editor** in your Supabase project and run the five files in
`supabase/migrations/` **in order** (just paste each file's contents and hit Run):

1. `0001_schema.sql` — all tables
2. `0002_functions_triggers.sql` — triggers, the `create_order` checkout function, the AI-design-to-custom-order pipeline, the auto-manufacturing-checklist trigger
3. `0003_rls.sql` — row level security policies (so customers only ever see their own data, admins see everything)
4. `0004_storage.sql` — creates the `product-images` and `design-previews` storage buckets
5. `0005_seed.sql` — seeds your 8 categories, 12 starter products, the `STEEL10` coupon, and the AI pricing defaults

If you ever want to wipe and redo this, these are safe to re-run (they use `on conflict` / `if not exists` throughout) except `0001_schema.sql`, which will fail if the tables already exist (drop them first if you need a clean slate).

## 3. Deploy the AI Builder Edge Function

This is the one piece of server code that has to run outside Postgres,
because it calls the Gemini API and writes to Storage with elevated
permissions. You'll need the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase secrets set GEMINI_API_KEY=your-gemini-key-here
supabase functions deploy ai-design
```

Get a Gemini key at https://aistudio.google.com/apikey — paste it straight
into the command above, it only needs to live in Supabase's secret store,
never in this repo or the frontend `.env`.

That's it — no other secrets needed. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase for every
Edge Function.

## 4. Configure the frontend

```bash
cp .env.example .env
```

Fill in:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Then:
```bash
npm install
npm run dev
```

## 5. Create your admin account

Sign up normally through the app (`/register`). Then, in the Supabase SQL
Editor, promote yourself:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Refresh the app — the "Admin Panel" link will now appear in the menu.

---

## What's wired up

- **Auth** — Supabase Auth (email/password). A `profiles` row is auto-created on signup via trigger.
- **Catalog** — products/categories load from Postgres; wholesale accounts automatically see `wholesale_price` instead of retail price.
- **Cart & Wishlist** — persisted to Postgres for signed-in users, to `localStorage` for guests, merged automatically on login.
- **Checkout** — `create_order()` is a single atomic Postgres function: it re-prices every line from the live `products` table (so the client can never tamper with totals), checks stock, decrements it, applies GST/shipping/coupon, and writes the order. Payment is **record-only** for now — every order is created with `payment_status = 'pending'` and you settle manually (COD/UPI/bank transfer), exactly as discussed. Wiring a real gateway later just means setting `payment_status = 'paid'` once you confirm payment, e.g. from a webhook.
- **Reviews** — customers can review products they haven't necessarily purchased (no purchase-gating, to keep this simple); a trigger keeps `products.rating`/`review_count` in sync automatically.
- **AI Builder** — see below.
- **Wholesale RFQs** — guests or signed-in users can submit; admins quote and convert manually.
- **Admin Panel** — Overview (live stats), Orders, Custom Orders (with the manufacturing checklist), Wholesale/RFQs, Products (full CRUD + photo upload to Storage), Users (promote to admin / wholesale), Reviews (moderate), Contact messages, Settings (the AI pricing knobs below).

## How the AI Builder actually works

This was the part worth getting right rather than faking. Three pieces, in `supabase/functions/ai-design/`:

1. **`index.ts`** — runs a short back-and-forth conversation (system prompt makes Claude ask 1-2 focused questions at a time about type/dimensions/doors/shelves/color/locks/etc.), then once it has enough detail, asks the model to emit a structured JSON spec instead of more questions.
2. **`pricing.ts`** — takes that spec and computes a price **deterministically**: real surface area (front + back + sides + top + bottom + shelves + drawers) → steel weight from gauge × density → material cost + hardware + powder-coat finishing + a labor/overhead margin. Every rate is stored in `app_settings.steel_pricing` and editable from Admin → Settings — no redeploy needed when your costs change.
3. **`render.ts`** — draws four SVG "spec sheet" views (Front / Side / Top / Inside) with real dimension lines, color swatches, and the computed price baked in as actual text.

I deliberately did **not** wire this to a photoreal image-generation API. Image
models are unreliable at rendering correct numbers, and there's no way to get
4 consistent "angles" of the same custom object from independent prompts —
you'd get four different-looking pieces of furniture. The SVG approach
guarantees the dimensions, price, and colors shown are always exactly correct,
and costs nothing to run. If you later want a stylized photoreal hero image
*in addition* (purely for vibe, not for the numbers), that's a small follow-up:
one more call to an image model, stored as a 5th image alongside the four
spec-sheet views — happy to add it whenever you want.

When a design is finished, the customer can send it to you for review
(creates a `custom_orders` row). You set status/notes/final price from Admin →
Custom Orders; approving it **automatically creates the 5-step manufacturing
checklist** (Build Frame → Paint → QC → Packaging → Dispatch) via a database
trigger, matching how an actual fabrication shop tracks work. Once approved,
the customer can convert it into a real payable order from their Dashboard.

## Known gaps / good next steps

- **Payments**: currently record-only. Razorpay is the natural next step for India — would slot in as one more Edge Function that creates an order on Razorpay's side and a webhook that flips `payment_status`.
- **Email notifications**: order/design status changes write to an in-app `notifications` table (visible to the customer), but nothing emails them yet. Adding Resend/SendGrid here is a small Edge Function.
- **Photoreal AI renders**: see above — easy to bolt on top of the existing pipeline.
