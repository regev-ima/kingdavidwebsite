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
 * Format a countdown for sale_ends_at. Returns:
 *   { totalMs, days, hours, minutes, seconds, expired, labelLong, labelShort }
 */
export function countdownTo(endDate, now = new Date()) {
  if (!endDate) {
    return {
      totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0,
      expired: true, labelLong: null, labelShort: null,
    };
  }
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const totalMs = Math.max(0, end.getTime() - now.getTime());
  const days = Math.floor(totalMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((totalMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((totalMs % (60 * 1000)) / 1000);
  const expired = totalMs <= 0;

  const pad = (n) => String(n).padStart(2, "0");
  const labelLong =
    days > 0
      ? `נותרו ${days}י ${hours}ש ${minutes}ד`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const labelShort =
    days > 0 ? `${days}י ${hours}ש` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { totalMs, days, hours, minutes, seconds, expired, labelLong, labelShort };
}
