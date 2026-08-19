// Link previews for social scrapers.
//
// This is a client-rendered SPA: every URL serves the same dist/index.html, and
// react-helmet fills in the real title and image only after React runs. Google
// executes JavaScript and sees them. WhatsApp, Facebook, Twitter and Slack do
// not — they read the raw HTML and stop. So a shared product link showed the
// site-wide logo and the site-wide description, whatever the product was.
//
// vercel.json routes only crawler user-agents here. Everybody else is served
// the normal SPA and never touches this function, so a mistake in it cannot
// affect a real visitor's page.
//
// It reads the product through the same SECURITY DEFINER RPC the storefront
// uses, with the same anon key, so it can reach nothing the site cannot.

const SITE_URL = "https://kingdavid4u.co.il";
const FALLBACK_IMAGE = `${SITE_URL}/images/general/logo-full.png`;
const VAT_PERCENT = Number(process.env.VITE_VAT_RATE || 18);

// Escaped for an HTML attribute — a product name with a quote in it would
// otherwise break out of the content="" and mangle the tag.
const attr = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const clamp = (text, max = 155) => {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).trimEnd()}…`;
};

const absolute = (url) =>
  !url ? null : /^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

async function fetchProduct(id) {
  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key || !id) return null;

  const res = await fetch(`${base}/rest/v1/rpc/website_get_products`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).find((r) => String(r.id) === String(id)) || null;
}

// The catalogue is net; the site quotes VAT-inclusive prices, so the preview
// has to say the same number the page will.
function grossPrice(product) {
  const variations = (product.variations || []).filter((v) => v.is_active !== false);
  const prices = variations
    .map((v) => Number(v.final_price ?? v.base_price ?? 0))
    .filter((n) => n > 0)
    .map((n) => Math.round(n * (1 + VAT_PERCENT / 100)));
  return prices.length ? Math.min(...prices) : 0;
}

export default async function handler(req, res) {
  const url = new URL(req.url, SITE_URL);
  const id = url.searchParams.get("id");

  let title = "קינג דיויד מזרנים | מזרנים אורטופדיים יוקרתיים";
  let description =
    "מגוון מזרנים אורטופדיים יוקרתיים עם 20 שנות אחריות. שינה מושלמת מתחילה בקינג דיויד.";
  let image = FALLBACK_IMAGE;
  let canonical = `${SITE_URL}/Shop`;

  try {
    const product = await fetchProduct(id);
    if (product) {
      const price = grossPrice(product);
      title = `${product.name} | קינג דיויד`;
      // A shared product link is a shopping link: the price is the thing that
      // earns the tap, so it is appended even when the catalogue supplies its
      // own copy — with the copy trimmed shorter to leave room for it.
      const priceLabel = price > 0 ? `החל מ-₪${price.toLocaleString("he-IL")}` : null;
      const copy = clamp(
        product.description || [product.name, product.category].filter(Boolean).join(" · "),
        priceLabel ? 120 : 155
      );
      description = [copy, priceLabel].filter(Boolean).join(" · ");
      image = absolute(product.image_url || (product.images || [])[0]) || FALLBACK_IMAGE;
      canonical = `${SITE_URL}/ProductDetail?id=${encodeURIComponent(product.id)}`;
    }
  } catch {
    // A preview is not worth a 500 — fall through to the site-wide values.
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Previews are cached hard by the scrapers anyway; a short TTL keeps a price
  // change from lingering for days without hammering the RPC.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600, stale-while-revalidate=3600");
  res.status(200).send(`<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${attr(title)}</title>
<meta name="description" content="${attr(description)}" />
<link rel="canonical" href="${attr(canonical)}" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="King David" />
<meta property="og:locale" content="he_IL" />
<meta property="og:title" content="${attr(title)}" />
<meta property="og:description" content="${attr(description)}" />
<meta property="og:image" content="${attr(image)}" />
<meta property="og:url" content="${attr(canonical)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${attr(title)}" />
<meta name="twitter:description" content="${attr(description)}" />
<meta name="twitter:image" content="${attr(image)}" />
</head>
<body>
<h1>${attr(title)}</h1>
<p>${attr(description)}</p>
<p><a href="${attr(canonical)}">${attr(canonical)}</a></p>
</body>
</html>`);
}
