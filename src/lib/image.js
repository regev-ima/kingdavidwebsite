// Image optimization helper — wraps any image URL with an on-the-fly
// transformation so the browser never downloads the original multi-MB
// upload. Three cases handled:
//
//   1. Supabase Storage public object URL
//        .../storage/v1/object/public/<bucket>/<path>
//      → rewritten to the render endpoint
//        .../storage/v1/render/image/public/<bucket>/<path>?width=…
//
//   2. Supabase Storage signed URL
//        .../storage/v1/object/sign/<...>
//      → same rewrite to /render/image/sign/...
//
//   3. Anything else (base44 CDN, random http URL)
//      → proxied through images.weserv.nl which returns a WebP that is
//        resized server-side and cached at the edge.
//
// The function is a no-op for empty / data: / blob: URLs.

const WESERV = "https://images.weserv.nl";

function isSupabaseStorage(url) {
  return /\/storage\/v1\/object\/(public|sign|authenticated)\//.test(url);
}

function toSupabaseRenderUrl(url, { width, height, quality }) {
  const renderUrl = url.replace("/storage/v1/object/", "/storage/v1/render/image/");
  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  if (quality) params.set("quality", String(quality));
  params.set("resize", "cover");
  return params.toString() ? `${renderUrl}?${params}` : renderUrl;
}

function toWeservUrl(url, { width, height, quality }) {
  // Strip the protocol for weserv (it wants just host+path on `url=`).
  const clean = url.replace(/^https?:\/\//i, "");
  const params = new URLSearchParams({ url: clean, output: "webp" });
  if (width) params.set("w", String(width));
  if (height) params.set("h", String(height));
  if (quality) params.set("q", String(quality));
  params.set("fit", "cover");
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

  const { width, height, quality = 75 } = opts;

  try {
    if (isSupabaseStorage(url)) {
      return toSupabaseRenderUrl(url, { width, height, quality });
    }
    return toWeservUrl(url, { width, height, quality });
  } catch {
    return url; // fail safe
  }
}

/**
 * Convenience: build a srcSet for responsive images.
 * Example: optimizeSrcSet(url, [400, 800, 1200]) -> "url?w=400 400w, url?w=800 800w, …"
 */
export function optimizeSrcSet(url, widths = [400, 800, 1200], opts = {}) {
  if (!url) return undefined;
  return widths
    .map((w) => `${optimizeImage(url, { ...opts, width: w })} ${w}w`)
    .join(", ");
}
