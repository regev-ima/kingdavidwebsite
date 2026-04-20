// Browser-side copy of the email HTML generator. Mirrors
// supabase/functions/send-order-email/index.ts so we can preview the
// email in the browser at /email-preview without deploying anything.
//
// IMPORTANT: keep this file in sync with the Edge Function's
// renderEmailHtml — any template tweak needs to be applied in both.

function money(n) {
  const value = Number(n ?? 0);
  return `₪${value.toLocaleString("he-IL")}`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderOrderEmailHtml(order) {
  const items = (order.items || [])
    .map(
      (it) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#111;">${escapeHtml(it.name || "")}</div>
            <div style="font-size:12px;color:#666;margin-top:2px;">
              ${it.size ? escapeHtml(it.size) + " · " : ""}${it.withStorage ? "כולל ארגז מצעים · " : ""}כמות: ${it.quantity}
            </div>
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
  <body style="margin:0;background:#faf6ef;font-family:Arial,sans-serif;color:#222;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6ef;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #eee;border-radius:14px;max-width:560px;width:100%;">
          <tr>
            <td style="padding:24px 28px;text-align:center;border-bottom:1px solid #eee;">
              <div style="font-size:12px;letter-spacing:0.25em;color:#b8972a;text-transform:uppercase;">KING DAVID</div>
              <h1 style="margin:8px 0 0;font-size:22px;color:#111;">תודה על ההזמנה!</h1>
              <p style="margin:6px 0 0;color:#666;font-size:14px;">מספר הזמנה: <span style="font-family:monospace;color:#111;">${escapeHtml(order.orderNumber || "")}</span></p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px;">
              <h2 style="margin:0 0 10px;font-size:14px;color:#111;">פריטים בהזמנה</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${items}
                <tr>
                  <td style="padding:10px 12px;color:#666;">סכום ביניים</td>
                  <td style="padding:10px 12px;text-align:left;color:#666;">${money(order.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 12px;color:#666;">משלוח</td>
                  <td style="padding:4px 12px;text-align:left;color:#666;">${order.shipping ? money(order.shipping) : "חינם"}</td>
                </tr>
                ${order.withAssembly
                  ? `<tr><td style="padding:4px 12px;color:#666;">הרכבה</td><td style="padding:4px 12px;text-align:left;color:#666;">${money(order.assembly)}</td></tr>`
                  : ""}
                <tr>
                  <td style="padding:12px;border-top:2px solid #111;font-weight:700;color:#111;">סה"כ</td>
                  <td style="padding:12px;border-top:2px solid #111;text-align:left;font-weight:700;color:#111;">${money(order.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
                <tr>
                  <td valign="top" style="padding:16px 0 0;width:50%;">
                    <h3 style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">פרטי התקשרות</h3>
                    <div style="color:#111;">${escapeHtml(order.customer?.fullName || "")}</div>
                    <div dir="ltr" style="color:#444;">${escapeHtml(order.customer?.phone || "")}</div>
                    <div dir="ltr" style="color:#444;">${escapeHtml(order.customer?.email || "")}</div>
                  </td>
                  <td valign="top" style="padding:16px 0 0;width:50%;">
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
            <td style="padding:18px 28px;background:#faf6ef;text-align:center;border-top:1px solid #eee;border-radius:0 0 14px 14px;">
              <p style="margin:0;color:#666;font-size:12px;">נציג יצור איתכם קשר לאישור המשלוח וזמני ההגעה.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export const SAMPLE_ORDER = {
  orderNumber: "KD-M0EXAMPLE-ABC",
  paymentMethod: "credit",
  customer: {
    fullName: "שרה כהן",
    phone: "052-1234567",
    email: "sara@example.com",
  },
  delivery: {
    address: "רחוב הרצל 45, תל אביב יפו",
    apartment: "12",
    notes: "קומה 3, דלת משמאל",
  },
  items: [
    {
      name: "מזרן דגם הרמוני",
      size: "160x200",
      withStorage: false,
      quantity: 1,
      lineTotal: 3990,
    },
    {
      name: "מיטה זוגית דגם קולוני",
      size: "160x200",
      withStorage: true,
      quantity: 1,
      lineTotal: 3490,
    },
  ],
  subtotal: 7480,
  shipping: 0,
  withAssembly: true,
  assembly: 450,
  total: 7930,
};
