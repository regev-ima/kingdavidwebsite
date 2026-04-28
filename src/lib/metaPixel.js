// Meta Pixel + Conversions API — unified event tracking.
//
// `trackEvent` fires the browser-side Pixel and the server-side
// Conversions API with the same `event_id`, so Meta deduplicates
// the pair into a single event with the highest available match
// quality. The server hashes PII; this file never hashes anything.
//
// The Pixel only loads if VITE_FB_PIXEL_ID is set. The CAPI call
// always fires (even without a Pixel ID) so server-side coverage
// works for ad-blocked / cookie-blocked visitors too — the Edge
// Function falls back to demo mode if its own secrets aren't set.

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID;

let pixelInitialized = false;

export function initMetaPixel() {
  if (pixelInitialized || typeof window === "undefined") return;
  if (!PIXEL_ID) return;

  // Standard Meta Pixel base code.
  /* eslint-disable */
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
  pixelInitialized = true;
}

// Generate an event_id that's identical for the Pixel call and the CAPI
// call. Callers can pass an explicit ID (e.g. order number) to scope the
// event to a known business object — required for Purchase so that a CRM
// later sending the same Purchase from `phone_call` doesn't duplicate.
export function makeEventId(prefix = "evt") {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

function readCookie(name) {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

// Server expects raw PII (it hashes); pass cookies for fbp/fbc raw.
function buildUserData(userData = {}) {
  return {
    ...userData,
    fbp: userData.fbp || readCookie("_fbp"),
    fbc: userData.fbc || readCookie("_fbc"),
  };
}

// Pixel only sees non-PII custom_data; never pass user_data through fbq.
function firePixel(eventName, eventId, customData) {
  if (!pixelInitialized || typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", eventName, customData || {}, { eventID: eventId });
  } catch (err) {
    console.warn("[metaPixel] fbq failed", err);
  }
}

async function fireCapi(eventName, eventId, { customData, userData, actionSource }) {
  if (!isSupabaseConfigured) {
    console.warn("[metaPixel] Supabase not configured — skipping CAPI.");
    return { ok: false, skipped: true };
  }
  try {
    const { data, error } = await supabase.functions.invoke("meta-conversions-api", {
      body: {
        event_name: eventName,
        event_id: eventId,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: typeof window !== "undefined" ? window.location.href : undefined,
        action_source: actionSource || "website",
        user_data: buildUserData(userData),
        custom_data: customData,
      },
    });
    if (error) {
      console.error("[metaPixel] CAPI invoke failed", error.message);
      return { ok: false, error };
    }
    return { ok: true, data };
  } catch (err) {
    console.error("[metaPixel] CAPI network error", err);
    return { ok: false, error: err };
  }
}

/**
 * Fire a Meta event on both Pixel + CAPI with a shared event_id.
 *
 * @param {string} eventName  e.g. "Lead" | "Purchase" | "InitiateCheckout" | "Contact"
 * @param {object} opts
 * @param {string} [opts.eventId]      Stable ID; auto-generated if absent.
 * @param {object} [opts.customData]   Pixel-safe data (value, currency, contents, …).
 * @param {object} [opts.userData]     Raw PII — server hashes (em, ph, fn, ln, external_id).
 * @param {string} [opts.actionSource] "website" (default) | "phone_call" | "chat" | …
 * @returns {Promise<{eventId:string, capi:object}>}
 */
export async function trackEvent(eventName, opts = {}) {
  const eventId = opts.eventId || makeEventId(eventName.toLowerCase());
  firePixel(eventName, eventId, opts.customData);
  const capi = await fireCapi(eventName, eventId, {
    customData: opts.customData,
    userData: opts.userData,
    actionSource: opts.actionSource,
  });
  return { eventId, capi };
}
