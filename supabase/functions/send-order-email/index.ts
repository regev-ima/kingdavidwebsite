// Supabase Edge Function — send-order-email
//
// Triggered from the website after an order completes. Sends an order
// confirmation to the customer (and optionally copies the shop) using
// Resend (https://resend.com). Keep the Resend key in Supabase
// function secrets — never ship it to the client.
//
// Deploy:
//   supabase functions deploy send-order-email --no-verify-jwt
//
// Secrets (set via Supabase dashboard → Functions → Secrets):
//   RESEND_API_KEY   = re_xxx
//   ORDER_EMAIL_FROM = "קינג דיויד <orders@yourdomain.co.il>"
//   ORDER_EMAIL_BCC  = optional comma-separated internal recipients
//
// Without RESEND_API_KEY the function returns { ok: true, demo: true }
// and logs what it would have sent, so the end-to-end flow is
// exercisable before a real Resend account exists.

// deno-lint-ignore-file no-explicit-any

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function money(n: number | string | undefined): string {
  const value = Number(n ?? 0);
  return `₪${value.toLocaleString("he-IL")}`;
}

const LOGO_URL =
  "https://media.base44.com/images/public/69ba8e801b8d893fdd14efd0/26ed85e1e_Logo-2025-03.png";

function renderEmailHtml(order: any): string {
  // Addons picked on the product page. Their price is already inside
  // lineTotal, so they are listed for clarity — the customer has to see
  // *what* they ordered, not just a bigger number.
  const addonLines = (addons: any) =>
    (Array.isArray(addons) ? addons : [])
      .filter((a: any) => a && a.name)
      .map(
        (a: any) => `
            <div dir="rtl" style="font-size:12px;color:#666;margin-top:2px;">
              + ${escapeHtml(a.name)}${Number(a.price) > 0 ? " · " + money(a.price) : ""}
            </div>`,
      )
      .join("");

  const items = (order.items || [])
    .map(
      (it: any) => `
        <tr>
          <td dir="rtl" style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">
            <div style="font-weight:600;color:#111;">${escapeHtml(it.name || "")}</div>
            <div dir="rtl" style="font-size:12px;color:#666;margin-top:2px;">
              כמות: ${it.quantity}${it.size ? " · מידה: " + escapeHtml(it.size) : ""}${it.withStorage ? " · כולל ארגז מצעים" : ""}
            </div>${addonLines(it.addons)}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:left;white-space:nowrap;font-weight:600;color:#111;">
            ${money(it.lineTotal)}
          </td>
        </tr>`,
    )
    .join("");

  return `
<!doctype html>
<html lang="he" dir="rtl">
  <head><meta charset="utf-8"></head>
  <body style="margin:0;background:#faf6ef;font-family:Arial,sans-serif;color:#222;direction:rtl;" dir="rtl">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#faf6ef;padding:32px 12px;direction:rtl;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" dir="rtl" style="background:#fff;border:1px solid #eee;border-radius:14px;max-width:560px;width:100%;direction:rtl;">
          <tr>
            <td style="padding:28px;text-align:center;border-bottom:1px solid #eee;">
              <img src="${LOGO_URL}" alt="King David" width="120" style="display:inline-block;max-width:140px;height:auto;margin:0 auto 14px;" />
              <h1 style="margin:0;font-size:22px;color:#111;">תודה על ההזמנה!</h1>
              <p dir="rtl" style="margin:6px 0 0;color:#666;font-size:14px;">
                מספר הזמנה:
                <span style="font-family:monospace;color:#111;" dir="ltr">${escapeHtml(order.orderNumber || "")}</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px;">
              <h2 dir="rtl" style="margin:0 0 10px;font-size:14px;color:#111;text-align:right;">פריטים בהזמנה</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;">
                ${items}
                <tr>
                  <td dir="rtl" style="padding:10px 12px;color:#666;text-align:right;">סכום ביניים</td>
                  <td style="padding:10px 12px;text-align:left;color:#666;white-space:nowrap;">${money(order.subtotal)}</td>
                </tr>
                <tr>
                  <td dir="rtl" style="padding:4px 12px;color:#666;text-align:right;">משלוח</td>
                  <td style="padding:4px 12px;text-align:left;color:#666;white-space:nowrap;">${order.shipping ? money(order.shipping) : "חינם"}</td>
                </tr>
                ${order.withAssembly
                  ? `<tr><td dir="rtl" style="padding:4px 12px;color:#666;text-align:right;">הרכבה</td><td style="padding:4px 12px;text-align:left;color:#666;white-space:nowrap;">${money(order.assembly)}</td></tr>`
                  : ""}
                <tr>
                  <td dir="rtl" style="padding:12px;border-top:2px solid #111;font-weight:700;color:#111;text-align:right;">סה"כ</td>
                  <td style="padding:12px;border-top:2px solid #111;text-align:left;font-weight:700;color:#111;white-space:nowrap;">${money(order.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="border-top:1px solid #eee;direction:rtl;">
                <tr>
                  <td valign="top" dir="rtl" style="padding:16px 0 0;width:50%;text-align:right;">
                    <h3 style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">פרטי התקשרות</h3>
                    <div style="color:#111;">${escapeHtml(order.customer?.fullName || "")}</div>
                    <div dir="ltr" style="color:#444;text-align:right;">${escapeHtml(order.customer?.phone || "")}</div>
                    <div dir="ltr" style="color:#444;text-align:right;">${escapeHtml(order.customer?.email || "")}</div>
                  </td>
                  <td valign="top" dir="rtl" style="padding:16px 0 0;width:50%;text-align:right;">
                    <h3 style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">כתובת למשלוח</h3>
                    <div style="color:#111;">${escapeHtml(order.delivery?.address || "")}</div>
                    ${order.delivery?.apartment ? `<div style="color:#444;">דירה ${escapeHtml(order.delivery.apartment)}</div>` : ""}
                    ${order.delivery?.notes ? `<div style="color:#666;font-size:12px;margin-top:4px;">הערה: ${escapeHtml(order.delivery.notes)}</div>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td dir="rtl" style="padding:18px 28px;background:#faf6ef;text-align:center;border-top:1px solid #eee;border-radius:0 0 14px 14px;">
              <p style="margin:0;color:#666;font-size:12px;">נציג יצור איתכם קשר לאישור המשלוח וזמני ההגעה.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  const order = payload?.order;
  const to = order?.customer?.email;
  if (!order || !to) {
    return new Response(JSON.stringify({ ok: false, error: "missing_order_or_email" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ORDER_EMAIL_FROM") || "onboarding@resend.dev";
  const bcc = (Deno.env.get("ORDER_EMAIL_BCC") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const subject = `הזמנה ${order.orderNumber} - קינג דיויד מזרנים`;
  const html = renderEmailHtml(order);

  if (!apiKey) {
    console.log("[send-order-email demo] would send", {
      from,
      to,
      bcc,
      subject,
      orderNumber: order.orderNumber,
    });
    return new Response(JSON.stringify({ ok: true, demo: true }), {
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      bcc: bcc.length ? bcc : undefined,
      subject,
      html,
    }),
  });

  const data = await resendResponse.json().catch(() => ({}));
  return new Response(
    JSON.stringify({ ok: resendResponse.ok, data }),
    {
      status: resendResponse.ok ? 200 : 502,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    },
  );
});
