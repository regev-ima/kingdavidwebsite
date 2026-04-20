import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { parseHypReturnMessage } from "@/lib/hyp";

// Full-screen modal that loads Hyp's hosted checkout in an iframe.
// Listens for the window message posted by our HypReturn stub page
// (which Hyp redirects to as `Succesful` / `Failed`).
export default function HypPaymentModal({ url, onSuccess, onFailure, onClose }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!url) return;
    const handler = (event) => {
      const parsed = parseHypReturnMessage(event);
      if (!parsed) return;
      if (parsed.status === "success") onSuccess(parsed);
      else onFailure(parsed);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [url, onSuccess, onFailure]);

  useEffect(() => {
    if (!url) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [url]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl h-[80vh] max-h-[720px] bg-card rounded-2xl overflow-hidden border border-primary/15 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-card">
          <span className="text-sm font-semibold text-foreground">תשלום מאובטח</span>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <iframe
          ref={iframeRef}
          src={url}
          title="תשלום Hyp"
          className="w-full h-[calc(100%-52px)] bg-white"
        />
      </div>
    </div>
  );
}
