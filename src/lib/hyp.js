// Hyp / Yaad hosted-page integration helpers.
//
// The flow:
//   1. In live mode we POST the order details to the `hyp-sign`
//      Supabase Edge Function, which holds the PassP/API Key as
//      function secrets and asks Hyp's `APISign` endpoint to return
//      a signed query string. The signed URL is what we load inside
//      the iframe on the checkout page — the card number never
//      touches our server.
//   2. Hyp redirects the iframe to the `Succesful` / `Failed` URL we
//      passed in. Those URLs point at our own HypReturn page, which
//      posts a message to the parent window so the checkout can
//      close the modal and react to the result.
//   3. A second Edge Function (Phase 2, not yet implemented) will
//      handle the server-to-server IPN and flip the order's
//      payment_status to 'paid' once verified.
//
// Until a real Hyp account is provisioned, running without a
// terminal configured drops into a built-in demo flow
// (`/checkout/hyp-mock`) that simulates success/failure so the UX
// can be exercised end-to-end.

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const MESSAGE_ORIGIN = "hyp-return";

export const HYP_MODE = import.meta.env.VITE_HYP_MODE || "test";
export const HYP_TERMINAL = import.meta.env.VITE_HYP_TERMINAL || "";
export const HYP_BASE_URL =
  import.meta.env.VITE_HYP_BASE_URL || "https://icom.yaad.net/p/";

export function isHypConfigured() {
  return HYP_MODE === "live" && HYP_TERMINAL.trim().length > 0;
}

function buildMockUrl({ orderNumber, amount, info, customer, returnUrl }) {
  const params = new URLSearchParams({
    order: orderNumber,
    amount: String(amount),
    info: info || "",
    name: customer?.fullName || "",
    return: returnUrl,
  });
  return `/checkout/hyp-mock?${params.toString()}`;
}

// Build the URL we load inside the iframe.
//   - When Hyp is configured for live mode, call the `hyp-sign` Edge
//     Function which holds the PassP/API Key server-side and returns
//     a signed iframe URL (so the request passes Hyp's auth check).
//   - Otherwise return the local mock page so the flow is testable
//     without an account.
export async function buildHypIframeUrl({ orderNumber, amount, info, customer }) {
  const returnUrl = `${window.location.origin}/checkout/hyp-return`;

  if (!isHypConfigured()) {
    return buildMockUrl({ orderNumber, amount, info, customer, returnUrl });
  }

  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured — the `hyp-sign` Edge Function is required for live Hyp checkout.",
    );
  }

  const { data, error } = await supabase.functions.invoke("hyp-sign", {
    body: { orderNumber, amount, info, customer, returnUrl },
  });

  if (error) {
    throw new Error(`hyp-sign invoke failed: ${error.message || error}`);
  }
  if (!data?.ok || !data.url) {
    throw new Error(`hyp-sign rejected: ${data?.error || "unknown"} ${data?.detail || ""}`);
  }
  return data.url;
}

// Consumed by HypPaymentModal to react to messages posted from the
// HypReturn stub page loaded inside the iframe.
export function parseHypReturnMessage(event) {
  if (!event?.data || event.data.source !== MESSAGE_ORIGIN) return null;
  const { status, order, reason } = event.data;
  if (status !== "success" && status !== "failed") return null;
  return { status, order, reason: reason || null };
}

export const HYP_RETURN_MESSAGE_ORIGIN = MESSAGE_ORIGIN;
