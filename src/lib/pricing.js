// Centralised pricing logic. The kcrm stores a sale on the *product*
// with:
//   is_on_sale, discount_type ('percentage' | 'amount'), discount_value,
//   sale_starts_at, sale_ends_at
// Each variation also has its own base_price / final_price.
// This helper consolidates everything into one decision.

/**
 * Given a product and a variation (or null), compute the effective price,
 * whether a sale is active right now, and the savings.
 *
 * Returns:
 *   {
 *     originalPrice:   number,           // what the customer "would pay" normally
 *     finalPrice:      number,           // what they pay now
 *     isOnSaleNow:     boolean,          // sale active AND has a positive delta
 *     savings:         number,           // originalPrice - finalPrice (>= 0)
 *     badgeLabel:      string | null,    // "-10%" / "-₪500" for UI
 *     source:          "product" | "variation" | "none",
 *     saleStartsAt:    Date | null,
 *     saleEndsAt:      Date | null,
 *     saleNotStarted:  boolean,          // sale_starts_at is in the future
 *   }
 */
export function computeEffectivePrice(product, variation, now = new Date()) {
  const basePrice = Number(variation?.base_price ?? variation?.final_price ?? product?.price ?? 0);
  const variationFinalPrice = Number(variation?.final_price ?? variation?.base_price ?? basePrice);

  const startsAt = product?.sale_starts_at ? new Date(product.sale_starts_at) : null;
  const endsAt = product?.sale_ends_at ? new Date(product.sale_ends_at) : null;

  const saleNotStarted = startsAt ? now < startsAt : false;
  const saleEnded = endsAt ? now > endsAt : false;

  const productSaleActive =
    product?.is_on_sale === true &&
    !saleNotStarted &&
    !saleEnded &&
    product?.discount_type &&
    Number(product?.discount_value) > 0;

  let finalPrice = basePrice;
  let source = "none";
  let badgeLabel = null;

  if (productSaleActive) {
    const value = Number(product.discount_value);
    if (product.discount_type === "percentage") {
      finalPrice = Math.round(basePrice * (1 - value / 100));
      badgeLabel = `-${Math.round(value)}%`;
    } else if (product.discount_type === "amount") {
      finalPrice = Math.max(0, Math.round(basePrice - value));
      badgeLabel = `-₪${Math.round(value).toLocaleString()}`;
    }
    source = "product";
  } else if (variationFinalPrice < basePrice) {
    // The variation itself is priced lower than its base_price.
    finalPrice = variationFinalPrice;
    const pct = Math.round(((basePrice - variationFinalPrice) / basePrice) * 100);
    badgeLabel = pct > 0 ? `-${pct}%` : null;
    source = "variation";
  } else {
    finalPrice = basePrice;
  }

  const savings = Math.max(0, basePrice - finalPrice);
  const isOnSaleNow = savings > 0;

  return {
    originalPrice: basePrice,
    finalPrice,
    isOnSaleNow,
    savings,
    badgeLabel,
    source,
    saleStartsAt: startsAt,
    saleEndsAt: endsAt,
    saleNotStarted,
  };
}

/**
 * Format a countdown for sale_ends_at. Returns structured pieces plus a
 * few presentation helpers — no bidi hacks required.
 */
export function countdownTo(endDate, now = new Date()) {
  if (!endDate) {
    return {
      totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0,
      expired: true,
      primaryLabel: null,  // biggest unit only (for compact pill)
      fullLabel: null,     // "Xי Yש Zד Wש"
      parts: [],           // [{ value, unit: 'days'|'hours'|'minutes'|'seconds' }]
    };
  }
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const totalMs = Math.max(0, end.getTime() - now.getTime());
  const days = Math.floor(totalMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((totalMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((totalMs % (60 * 1000)) / 1000);
  const expired = totalMs <= 0;

  const pluralize = (n, singular, plural) => (n === 1 ? singular : plural);

  let primaryLabel = null;
  if (days > 0) primaryLabel = `${days} ${pluralize(days, "יום", "ימים")}`;
  else if (hours > 0) primaryLabel = `${hours} ${pluralize(hours, "שעה", "שעות")}`;
  else if (minutes > 0) primaryLabel = `${minutes} ${pluralize(minutes, "דקה", "דקות")}`;
  else primaryLabel = `${seconds} ${pluralize(seconds, "שנייה", "שניות")}`;

  const parts = [
    { value: days,    unit: "days",    label: pluralize(days,    "יום", "ימים") },
    { value: hours,   unit: "hours",   label: pluralize(hours,   "שעה", "שעות") },
    { value: minutes, unit: "minutes", label: pluralize(minutes, "דקה", "דקות") },
    { value: seconds, unit: "seconds", label: pluralize(seconds, "שנייה", "שניות") },
  ];

  // Drop leading zero units so we don't show "0 ימים 2 שעות"
  let trimmed = parts;
  while (trimmed.length > 1 && trimmed[0].value === 0) trimmed = trimmed.slice(1);

  const fullLabel = trimmed.map((p) => `${p.value} ${p.label}`).join(" : ");

  return {
    totalMs, days, hours, minutes, seconds, expired,
    primaryLabel, fullLabel, parts,
  };
}
