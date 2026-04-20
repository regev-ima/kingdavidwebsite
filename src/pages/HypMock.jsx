import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Demo payment page used when VITE_HYP_TERMINAL is not set — runs the
// full success/failure flow without a live Hyp account so the UX can
// be exercised end-to-end. Remove once Hyp credentials are in place,
// or just flip VITE_HYP_MODE to `live` and the iframe will hit the
// real hosted page instead.
export default function HypMock() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get("order") || "";
  const amount = params.get("amount") || "0";
  const info = params.get("info") || "";
  const name = params.get("name") || "";
  const returnUrl = params.get("return") || "/checkout/hyp-return";

  const finish = (status, reason) => {
    const url = new URL(returnUrl, window.location.origin);
    url.searchParams.set("status", status);
    url.searchParams.set("order", orderNumber);
    if (reason) url.searchParams.set("reason", reason);
    navigate(url.pathname + url.search, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-white" dir="rtl">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-primary/15 bg-card p-6">
        <div className="space-y-1 text-center">
          <p className="text-[11px] tracking-[0.35em] uppercase text-primary/70">מצב הדמיה</p>
          <h1 className="text-lg font-bold text-foreground">סליקת Hyp (לבדיקה בלבד)</h1>
          <p className="text-xs text-muted-foreground">
            זהו דף הדמיה שמחליף את ה-iframe של Hyp עד שיוגדר terminal.
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-primary/10 bg-background p-4 text-sm">
          <Row label="מספר הזמנה" value={orderNumber || "—"} />
          <Row label="סכום" value={`₪${Number(amount).toLocaleString()}`} />
          {name && <Row label="שם מבצע" value={name} />}
          {info && <Row label="תיאור" value={info} />}
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => finish("success")}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            הדמיית תשלום מוצלח
          </Button>
          <Button
            onClick={() => finish("failed", "demo_declined")}
            variant="outline"
            className="w-full h-12 border-destructive/40 text-destructive hover:bg-destructive/5"
          >
            הדמיית כשלון בעסקה
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium text-foreground truncate">{value}</span>
    </div>
  );
}
