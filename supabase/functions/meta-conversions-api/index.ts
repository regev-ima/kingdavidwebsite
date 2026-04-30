// Supabase Edge Function — meta-conversions-api
//
// Forwards server-side events (Lead, Purchase, InitiateCheckout, Contact, …)
// to Meta's Conversions API. The website fires a matching browser-side
// Pixel event with the same `event_id`, and Meta deduplicates the pair —
// so a single user action shows up once with the highest match quality
// from whichever signal arrived.
//
// Deploy:
//   supabase functions deploy meta-conversions-api --no-verify-jwt
//
// Secrets (Supabase dashboard → Functions → Secrets):
//   META_PIXEL_ID             = 1234567890        (required)
//   META_CAPI_ACCESS_TOKEN    = EAAB…             (required)
//   META_CAPI_TEST_EVENT_CODE = TEST12345         (optional, for Test Events)
//   META_CAPI_API_VERSION     = v18.0             (optional, default v18.0)
//
// Without META_PIXEL_ID + META_CAPI_ACCESS_TOKEN the function returns
// `{ ok: true, demo: true }` and logs the payload — so the end-to-end
// flow is exercisable before the Meta credentials land.
//
// Request body (from src/lib/metaPixel.js):
//   {
//     event_name:        "Purchase" | "Lead" | "Contact" | "InitiateCheckout" | …
//     event_id:          string  (must match the fbq eventID for dedup)
//     event_time?:       number  (unix seconds, default = now)
//     event_source_url?: string  (window.location.href)
//     action_source?:    "website" | "phone_call" | "chat" | …
//     user_data: {
//       em?, ph?, fn?, ln?, ct?, st?, zp?, country?, ge?, db?, external_id?: string
//       fbp?, fbc?: string  (browser cookies, sent raw)
//     }
//     custom_data?: {
//       value?, currency?, content_ids?, content_type?, contents?, num_items?, order_id?
//     }
//     test_event_code?: string
//   }

// deno-lint-ignore-file no-explicit-any

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Fields Meta expects to be SHA-256 hashed before they hit the wire.
const HASHED_USER_DATA_FIELDS = [
  "em", "ph", "fn", "ln", "ct", "st", "zp", "country", "ge", "db", "external_id",
] as const;

// Fields that are sent in the clear (cookies + IP/UA).
const RAW_USER_DATA_FIELDS = [
  "fbp", "fbc", "client_ip_address", "client_user_agent",
] as const;

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Meta's normalization rules — lowercase + trim everything; strip
// non-digits from phone (E.164 without the +); strip spaces from name/zip;
// 2-letter country code; single-letter gender.
function normalizeForHashing(field: string, value: string): string {
  const v = String(value).trim().toLowerCase();
  if (!v) return "";
  switch (field) {
    case "ph":
      return v.replace(/\D+/g, "");
    case "fn":
    case "ln":
    case "ct":
    case "st":
    case "zp":
      return v.replace(/\s+/g, "");
    case "country":
      return v.slice(0, 2);
    case "ge":
      return v.charAt(0);
    default:
      return v;
  }
}

// Skip hashing if the value already looks like a hex SHA-256 digest.
function looksHashed(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

async function hashUserData(input: Record<string, any> = {}): Promise<Record<string, any>> {
  const out: Record<string, any> = {};
  for (const field of HASHED_USER_DATA_FIELDS) {
    const raw = input[field];
    if (raw == null || raw === "") continue;
    const value = String(raw);
    out[field] = looksHashed(value)
      ? value.toLowerCase()
      : await sha256Hex(normalizeForHashing(field, value));
  }
  for (const field of RAW_USER_DATA_FIELDS) {
    if (input[field]) out[field] = input[field];
  }
  return out;
}

function clientIp(req: Request): string | undefined {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  const eventName = payload?.event_name;
  const eventId = payload?.event_id;
  if (!eventName || !eventId) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing_event_name_or_event_id" }),
      { status: 400, headers: { ...CORS_HEADERS, "content-type": "application/json" } },
    );
  }

  const pixelId = Deno.env.get("META_PIXEL_ID");
  const accessToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
  const apiVersion = Deno.env.get("META_CAPI_API_VERSION") || "v18.0";
  const envTestCode = Deno.env.get("META_CAPI_TEST_EVENT_CODE") || undefined;

  // Merge user_data with request-derived signals.
  const userDataIn = {
    ...(payload.user_data || {}),
    client_ip_address: payload.user_data?.client_ip_address || clientIp(req),
    client_user_agent:
      payload.user_data?.client_user_agent || req.headers.get("user-agent") || undefined,
  };
  const user_data = await hashUserData(userDataIn);

  const event = {
    event_name: eventName,
    event_id: eventId,
    event_time: payload.event_time || Math.floor(Date.now() / 1000),
    event_source_url: payload.event_source_url || undefined,
    action_source: payload.action_source || "website",
    user_data,
    custom_data: payload.custom_data || undefined,
  };

  if (!pixelId || !accessToken) {
    console.log("[meta-capi demo] would send", {
      pixelId: pixelId || "(unset)",
      tokenSet: Boolean(accessToken),
      event,
    });
    return new Response(JSON.stringify({ ok: true, demo: true, event }), {
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  const body: Record<string, any> = { data: [event] };
  const testCode = payload.test_event_code || envTestCode;
  if (testCode) body.test_event_code = testCode;

  const endpoint =
    `https://graph.facebook.com/${apiVersion}/${pixelId}/events` +
    `?access_token=${encodeURIComponent(accessToken)}`;

  let metaResponse: Response;
  try {
    metaResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[meta-capi] network error", err);
    return new Response(
      JSON.stringify({ ok: false, error: "network_error", detail: String(err) }),
      { status: 502, headers: { ...CORS_HEADERS, "content-type": "application/json" } },
    );
  }

  const text = await metaResponse.text();
  let parsed: any = text;
  try { parsed = JSON.parse(text); } catch { /* keep as text */ }

  if (!metaResponse.ok) {
    console.error("[meta-capi] Meta rejected event", metaResponse.status, parsed);
    return new Response(
      JSON.stringify({ ok: false, status: metaResponse.status, response: parsed }),
      { status: 502, headers: { ...CORS_HEADERS, "content-type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true, response: parsed }), {
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
});
