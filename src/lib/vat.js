// Israeli VAT (מע"מ) — one place, applied once.
//
// The kcrm prices its catalogue NET (before VAT): `product_variations`,
// `product_addons` and `product_addon_prices` all hold the pre-VAT
// figure the CRM works with internally. The storefront must show what
// the customer actually pays, and the terms page states the site's
// prices include VAT — so every price arriving from the CRM is grossed
// up here, at the data boundary (src/api/base44Client.js), before any
// component sees it.
//
// Because the gross-up happens once, on the way in, nothing downstream
// (product cards, product page, cart, checkout, the order sent back to
// the CRM) needs its own VAT maths.
//
// Rate: 18% in Israel since 2025-01-01. Override with VITE_VAT_RATE
// (a percentage, e.g. `17`) if the rate changes — no code edit needed.

const DEFAULT_VAT_PERCENT = 18;

function envValue(key) {
  try {
    return import.meta.env?.[key];
  } catch {
    return undefined;
  }
}

function toPercent(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  // Tolerate a rate given as a fraction ("0.18") instead of a percent.
  return n > 0 && n < 1 ? n * 100 : n;
}

/** The site-wide VAT rate, as a percentage (18 = 18%). */
export const VAT_PERCENT = toPercent(envValue('VITE_VAT_RATE')) ?? DEFAULT_VAT_PERCENT;

// Shipping / assembly rules come from the CRM's `extra_charges` table,
// whose rows were entered by hand as customer-facing prices. Flip
// VITE_VAT_INCLUDE_SHIPPING=true if those rows are ever moved to net
// pricing like the rest of the catalogue.
export const VAT_APPLIES_TO_SHIPPING =
  String(envValue('VITE_VAT_INCLUDE_SHIPPING') ?? '').trim().toLowerCase() === 'true';

/**
 * Resolve the rate for one row: its own `vat_percent` when the CRM
 * supplies one (0 is valid — a VAT-exempt row), else the site rate.
 */
export function rateFor(vatPercent) {
  const own = toPercent(vatPercent);
  return own == null ? VAT_PERCENT : own;
}

/**
 * Net -> gross. Returns the value untouched when it isn't a number
 * (null / undefined stay as they are so `a ?? b` fallbacks still work).
 * Rounds to whole shekels, which is how every price on the site is shown.
 */
export function withVat(amount, vatPercent) {
  if (amount == null || amount === '') return amount;
  const net = Number(amount);
  if (!Number.isFinite(net)) return amount;
  return Math.round(net * (1 + rateFor(vatPercent) / 100));
}

/** The VAT contained in an already-gross amount (2 decimals). */
export function vatPortionOf(grossAmount, vatPercent) {
  const gross = Number(grossAmount);
  if (!Number.isFinite(gross) || gross === 0) return 0;
  const rate = rateFor(vatPercent);
  if (rate === 0) return 0;
  return Math.round((gross - gross / (1 + rate / 100)) * 100) / 100;
}

/** "כולל מע"מ" — the label shown next to prices. */
export const VAT_INCLUDED_LABEL = 'המחיר כולל מע"מ';
