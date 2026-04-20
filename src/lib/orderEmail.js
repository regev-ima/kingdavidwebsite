// Client helper — POSTs the order snapshot to the send-order-email
// Supabase Edge Function. Silent-fails so a broken email path never
// blocks the order confirmation UX; errors are logged to the console
// for debugging.

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function sendOrderEmail(order) {
  if (!isSupabaseConfigured) {
    console.warn("[orderEmail] Supabase not configured — skipping email.");
    return { ok: false, skipped: true };
  }
  if (!order?.customer?.email) {
    console.warn("[orderEmail] No customer email — skipping.");
    return { ok: false, skipped: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke("send-order-email", {
      body: { order },
    });
    if (error) {
      console.error("[orderEmail] Edge function invoke failed:", error.message);
      return { ok: false, error };
    }
    return { ok: true, data };
  } catch (err) {
    console.error("[orderEmail] Network error:", err);
    return { ok: false, error: err };
  }
}
