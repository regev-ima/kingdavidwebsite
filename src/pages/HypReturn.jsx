import React, { useEffect } from "react";
import { HYP_RETURN_MESSAGE_ORIGIN } from "@/lib/hyp";

// Tiny stub loaded inside the Hyp iframe as the Succesful / Failed
// return URL. It posts a message to the parent window and displays a
// minimal confirmation while the parent closes the modal and handles
// the result.
export default function HypReturn() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") === "success" ? "success" : "failed";
    const order = params.get("order") || "";
    const reason = params.get("reason") || "";

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { source: HYP_RETURN_MESSAGE_ORIGIN, status, order, reason },
        window.location.origin
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
      <div className="text-center space-y-2">
        <p className="text-foreground/70">סוגר את חלון התשלום...</p>
      </div>
    </div>
  );
}
