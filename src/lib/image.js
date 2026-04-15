// Image optimization helper. Every external URL is routed through
// images.weserv.nl — a free public image CDN that downloads the source,
// resizes / re-encodes as WebP, and caches the result at the edge.
//
// Why not the Supabase /render/image/ endpoint directly?
//   It's gated behind the Pro plan. Free-tier projects return 400/404
//   and the browser ends up drawing a broken-image icon. weserv works
//   with any public HTTPS URL, including Supabase Storage public URLs.
//
// The function is a no-op for:
//   - empty / data: / blob: URLs
//   - local assets (/images/...) — Vercel already optimizes those
//   - weserv.nl URLs themselves (avoid double-proxying)

const WESERV = "https://images.weserv.nl";

function toWeservUrl(url, { width, height, quality }) {
  // weserv expects the URL stripped of its protocol
  const clean = url.replace(/^https?:\/\//i, "");
  const params = new URLSearchParams({ url: clean, output: "webp" });
  if (width) params.set("w", String(width));
  if (height) params.set("h", String(height));
  if (quality) params.set("q", String(quality));
  params.set("fit", "cover");
  // weserv serves a tiny 1x1 gif if the source ever goes 404 — use
  // `default` instead so the browser triggers onerror properly.
  params.set("default", "404");
  return `${WESERV}/?${params}`;
}

/**
 * Return an optimized version of an image URL.
 *
 * @param {string} url         — original image URL
 * @param {object} opts
 *        width, height, quality (1..100, default 75)
 */
export function optimizeImage(url, opts = {}) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("/")) return url; // local public asset
  if (url.includes("images.weserv.nl")) return url; // already proxied

  const { width, height, quality = 75 } = opts;
  try {
    return toWeservUrl(url, { width, height, quality });
  } catch {
    return url; // fail-safe, return original
  }
}

/**
 * Build a srcSet for responsive images.
 * Example: optimizeSrcSet(url, [400, 800, 1200]) ->
 *          "url?w=400 400w, url?w=800 800w, ..."
 */
export function optimizeSrcSet(url, widths = [400, 800, 1200], opts = {}) {
  if (!url) return undefined;
  return widths
    .map((w) => `${optimizeImage(url, { ...opts, width: w })} ${w}w`)
    .join(", ");
}
