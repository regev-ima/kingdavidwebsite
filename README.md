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

---

## Facebook Pixel + Conversions API

Two-channel tracking (browser Pixel + server CAPI) sharing one `event_id`
per action so Meta deduplicates the pair.

**Events fired from the website:**

| Where | Event | Notes |
| --- | --- | --- |
| `Contact.jsx` form success | `Lead` | `event_id = lead_<random>` |
| `Checkout.jsx` submit, payment = phone or whatsapp | `Lead` | customer hasn't paid yet — Purchase comes from CRM when the deal closes |
| `Checkout.jsx` submit, payment = credit | `InitiateCheckout` | fired right before the Hyp iframe opens |
| `handleHypSuccess` (Hyp confirmed payment) | `Purchase` | `event_id = orderNumber` so a CRM-side Purchase for the same order can't duplicate |

Phone-closed deals (the most common path for King David) should fire
`Purchase` from the CRM by POSTing to the same Edge Function with
`action_source: "phone_call"` and `event_id = <order number>`.

### One-time setup

1. **Create the Pixel + Access Token** in
   [Events Manager](https://business.facebook.com/events_manager) →
   *Settings → Conversions API → Generate access token*.
2. **Browser:** add `VITE_FB_PIXEL_ID` to Vercel (and to `.env.local` for dev).
3. **Server:** push the secrets to Supabase:
   ```bash
   supabase secrets set META_PIXEL_ID=1234567890
   supabase secrets set META_CAPI_ACCESS_TOKEN=EAAB...
   # optional, for the Test Events tab in Events Manager:
   supabase secrets set META_CAPI_TEST_EVENT_CODE=TEST12345
   ```
4. **Deploy** the function:
   ```bash
   supabase functions deploy meta-conversions-api --no-verify-jwt
   ```

Without `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` the Edge Function
returns `{ ok: true, demo: true }` and logs the would-be payload —
useful for dev / staging.

### Verifying it works

1. **Test Events tab** (Events Manager → Test Events): paste your
   `TESTxxxxx` code into `META_CAPI_TEST_EVENT_CODE`, run a real flow,
   and watch each event arrive marked **Both** (Server + Browser).
   "Both" means the deduplication is working.
2. **Meta Pixel Helper** Chrome extension — verify each event fires
   client-side with the correct `event_id`.
3. **Match Quality** (Events Manager → Pixel → Overview) should reach
   "Great" (8.0+) within a couple of days. If lower, add more
   `user_data` fields (last name, zip, …) to `buildMetaUserData`
   in `Checkout.jsx`.
4. **Function logs** (Supabase Dashboard → Functions → Logs) show the
   raw Meta API response for every call; rejections surface as
   `[meta-capi] Meta rejected event 400 {...}` with the exact reason.
