// Hyp / Yaad hosted-page integration helpers.
//
// The flow:
//   1. We build a URL pointing at Hyp's hosted checkout (icom.yaad.net /
//      pay.hyp.co.il). That URL loads inside an iframe on our checkout
//      page — the card number never touches our server.
//   2. Hyp redirects the iframe to the `Succesful` / `Failed` URL we
//      passed in. Those URLs point at our own HypReturn page, which
//      posts a message to the parent window and lets the checkout
//      close the modal.
//   3. A Supabase Edge Function (see `supabase/functions/hyp-notify`,
//      Phase 2) will later handle the server-to-server IPN and flip
//      the order's payment_status to 'paid' once verified.
//
// Until a real Hyp account is provisioned, running without a terminal
// configured drops into a built-in demo flow (`/checkout/hyp-mock`)
// that simulates success/failure so the UX can be exercised end-to-end.

const MESSAGE_ORIGIN = "hyp-return";

export const HYP_MODE = import.meta.env.VITE_HYP_MODE || "test";
export const HYP_TERMINAL = import.meta.env.VITE_HYP_TERMINAL || "";
export const HYP_BASE_URL =
  import.meta.env.VITE_HYP_BASE_URL || "https://icom.yaad.net/p/";

export function isHypConfigured() {
  return HYP_MODE === "live" && HYP_TERMINAL.trim().length > 0;
}

// Build the URL we load inside the iframe.
//   - When a terminal is configured, point at Hyp's hosted page with
//     the standard Yaad/iCom parameters.
//   - Otherwise return the local mock page so the flow is testable
//     without an account.
export function buildHypIframeUrl({ orderNumber, amount, info, customer }) {
  const returnUrl = `${window.location.origin}/checkout/hyp-return`;

  if (!isHypConfigured()) {
    const params = new URLSearchParams({
      order: orderNumber,
      amount: String(amount),
      info: info || "",
      name: customer?.fullName || "",
      return: returnUrl,
    });
    return `/checkout/hyp-mock?${params.toString()}`;
  }

  const params = new URLSearchParams({
    action: "pay",
    Masof: HYP_TERMINAL,
    Amount: String(amount),
    CoinID: "1",
    Info: info || "",
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

  return `${HYP_BASE_URL}?${params.toString()}`;
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
