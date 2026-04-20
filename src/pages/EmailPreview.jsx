import React from "react";
import { renderOrderEmailHtml, SAMPLE_ORDER } from "@/lib/emailTemplate";

// Renders the actual order-confirmation email inside an iframe, using
// sample data — matches what Resend will send once the Edge Function
// has credentials. Not linked from any nav; reachable only via
// /email-preview for internal review.
export default function EmailPreview() {
  const html = renderOrderEmailHtml(SAMPLE_ORDER);

  return (
    <div className="min-h-screen px-4 py-10" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="space-y-1">
          <p className="text-[11px] tracking-[0.3em] uppercase text-primary/70">Preview</p>
          <h1 className="text-xl font-bold text-foreground">מייל אישור הזמנה</h1>
          <p className="text-sm text-muted-foreground">
            זה התצוגה של המייל שנשלח ללקוח אחרי הזמנה מוצלחת. נתונים לדוגמה — הטמפלייט האמיתי
            יושב ב-<code className="text-xs bg-muted px-1.5 py-0.5 rounded">supabase/functions/send-order-email</code>.
          </p>
        </header>

        <iframe
          title="Email preview"
          srcDoc={html}
          className="w-full h-[880px] rounded-2xl border border-primary/15 bg-white shadow-xl"
        />
      </div>
    </div>
  );
}
