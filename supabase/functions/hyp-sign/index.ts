// Supabase Edge Function — hyp-sign
//
// Builds a signed Hyp / Yaad hosted-page URL for the checkout iframe.
// The PassP (Hyp "פרמטר אימות") is held only as a function secret here
// and never reaches the browser. The flow:
//
//   1. The website POSTs the order details (order number, amount,
//      customer) to this function.
//   2. We forward them to Hyp's `action=APISign&What=SIGN` endpoint
//      with the PassP, which returns a URL-encoded query string that
//      includes a `signature` field.
//   3. We return `https://icom.yaad.net/p/?action=pay&<signed>` to
//      the client, which loads it inside the iframe.
//
// Deploy:
//   supabase functions deploy hyp-sign --no-verify-jwt
//
// Secrets (set via Supabase dashboard → Functions → Secrets, or
// `supabase secrets set`):
//   HYP_TERMINAL = 4502293337
//   HYP_API_KEY  = <your API Key>  (the long token from Hyp dashboard)
//   HYP_PASSP    = <your PassP>    (the short "פרמטר אימות" value)
//   HYP_BASE_URL = https://icom.yaad.net/p/  (optional override)
//
// On older terminals the API Key and PassP are the same value — set
// both secrets to the same string and it still works. On 3DS-enabled
// terminals (the default for new accounts) they differ, and the API
// Key goes into the `KEY` field of the APISign call while the PassP
// goes into `PassP`.

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  const masof = Deno.env.get("HYP_TERMINAL");
  const passp = Deno.env.get("HYP_PASSP");
  const apiKey = Deno.env.get("HYP_API_KEY") || passp;
  const baseUrl = Deno.env.get("HYP_BASE_URL") || "https://pay.hyp.co.il/p/";

  if (!masof || !passp) {
    return jsonResponse(
      { ok: false, error: "hyp_not_configured", detail: "Set HYP_TERMINAL + HYP_PASSP secrets" },
      500,
    );
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }

  const { orderNumber, amount, info, customer, returnUrl } = payload || {};
  if (!orderNumber || !amount || !returnUrl) {
    return jsonResponse({ ok: false, error: "missing_fields" }, 400);
  }

  const signParams = new URLSearchParams({
    action: "APISign",
    What: "SIGN",
    KEY: apiKey,
    PassP: passp,
    Masof: masof,
    Amount: String(amount),
    CoinID: "1",
    Info: info || `Order ${orderNumber}`,
    Order: orderNumber,
    UTF8: "True",
    UTF8out: "True",
    UserId: "000000000",
    Succesful: `${returnUrl}?status=success&order=${encodeURIComponent(orderNumber)}`,
    Failed: `${returnUrl}?status=failed&order=${encodeURIComponent(orderNumber)}`,
    ClientName: customer?.fullName || "",
    ClientLName: "",
    email: customer?.email || "",
    phone: customer?.phone || "",
  });

  let signedQuery: string;
  try {
    const resp = await fetch(`${baseUrl}?${signParams.toString()}`, { method: "GET" });
    signedQuery = (await resp.text()).trim();
    if (!resp.ok) {
      return jsonResponse(
        { ok: false, error: "apisign_http_error", status: resp.status, detail: signedQuery },
        502,
      );
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: "apisign_network_error", detail: String(err) }, 502);
  }

  // Hyp returns errors as a query string starting with `CCode=`.
  if (signedQuery.startsWith("CCode=")) {
    return jsonResponse({ ok: false, error: "apisign_rejected", detail: signedQuery }, 400);
  }

  // The signed response is a URL-encoded query string. Make sure we
  // open the iframe with action=pay, regardless of what the response
  // includes (older Hyp deployments omit `action`).
  const hasAction = /(^|&)action=/.test(signedQuery);
  const iframeUrl = hasAction
    ? `${baseUrl}?${signedQuery}`
    : `${baseUrl}?action=pay&${signedQuery}`;

  return jsonResponse({ ok: true, url: iframeUrl });
});
