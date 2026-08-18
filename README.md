# King David Website

The public storefront for King David, migrated from Base44 to **Supabase + Vercel**.

The product catalog and blog posts are read from the **kcrm** Supabase project,
and customer orders / contact inquiries are written back into the same project.

---

## Stack

- React 18 + Vite 6
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Router 6
- TanStack Query
- `@supabase/supabase-js` for data access

The previous Base44 SDK was replaced by a thin shim
(`src/api/base44Client.js`) so existing components continue to call
`base44.entities.X.list/filter/create` unchanged — but the data now flows
through Supabase.

---

## Local development

```bash
# 1. install
npm install

# 2. configure env
cp .env.example .env.local
# fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (anon key only!)

# 3. dev server
npm run dev
```

Without env vars the site falls back to the static product list in
`src/data/fallbackProducts.js` so the UI still renders.

---

## Supabase setup (one-time)

1. Open the kcrm Supabase project -> SQL Editor
2. Paste & run [`supabase/schema.sql`](./supabase/schema.sql)
   - Creates `products`, `blog_posts`, `orders`, `order_items`,
     `contact_inquiries`
   - Enables RLS with policies that allow public reads on the catalog and
     public inserts on orders / inquiries

If your kcrm already has tables with different names, do **not** rename them
— instead, edit the `ENTITY_MAP` at the top of
[`src/api/base44Client.js`](./src/api/base44Client.js).

---

## Deploy to Vercel

1. Import the GitHub repo in Vercel (auto-detects Vite via `vercel.json`)
2. Add env vars in **Settings -> Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

The included `vercel.json` rewrites all routes to `index.html` so React Router
handles deep links.

---

## Prices & VAT (מע"מ)

The kcrm prices its catalogue **net** — `product_variations.base_price` /
`final_price`, `product_addons` and the per-size override tables are all
pre-VAT. The storefront shows what the customer pays, so every CRM price is
grossed up **once**, at the data boundary in
[`src/api/base44Client.js`](./src/api/base44Client.js), using
[`src/lib/vat.js`](./src/lib/vat.js). Product cards, the product page, the
cart, checkout and the order written back to the CRM all inherit the
VAT-inclusive figure — none of them do VAT maths of their own.

- Rate: **18%** (Israel, since 2025-01-01). Override with `VITE_VAT_RATE`.
- A row's own `vat_percent` wins over the site rate when the CRM supplies one
  (`product_addons` already has the column; run
  [`020_variation_vat_percent.sql`](./supabase/migrations/020_variation_vat_percent.sql)
  to expose it for variations too).
- Shipping rules (`extra_charges`) are entered as customer-facing prices and
  are left alone — set `VITE_VAT_INCLUDE_SHIPPING=true` if that ever changes.
- The static `src/data/fallbackProducts.js` list is already gross and is not
  touched.

If the CRM is ever switched to storing gross prices, set `VITE_VAT_RATE=0`
rather than editing components.

---

## Order flow

1. Customer fills `Checkout.jsx`
2. On submit:
   - A row is inserted into `orders`
   - One row per cart item is inserted into `order_items`
   - If WhatsApp was chosen, the customer is redirected to `wa.me/...`
3. The CRM picks up the new order from the `orders` table.

If Supabase is misconfigured, the order still completes from the customer's
point of view (WhatsApp opens), an error is logged to the console, and a toast
warns the operator.

---

## Images

Product / hero images live in the kcrm Supabase Storage bucket (or any CDN
URL). The `image_url` column on `products` should be a fully-qualified URL.
The `public/` folder of static images that originally shipped with the Base44
export is **not** included in this repo — upload anything you still need to
Supabase Storage and reference it by URL.
