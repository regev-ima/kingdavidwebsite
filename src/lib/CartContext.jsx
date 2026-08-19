import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";

const CartContext = createContext(null);

const STORAGE_KEY = "kd_cart_v2";
const DELIVERY_KEY = "kd_delivery_method";
// Fallback shipping cost used only if the CRM `extra_charges` table is
// empty / unreachable. Real prices come from the rules fetched below.
const SHIPPING_COST_FALLBACK = 0;

export const DELIVERY_METHODS = Object.freeze({
  shipping: "shipping",
  pickup: "pickup",
});

const PICKUP_LABEL = "איסוף עצמי בתיאום מראש";

// Classify a cart item as "mattress", "bed" or "other" based on the
// CRM category fields (mirrors the mapping in src/api/base44Client.js).
function classifyItem(item) {
  const cat = String(item.product?.category_raw || item.product?.category || "")
    .trim()
    .toLowerCase();
  if (
    cat === "mattress" ||
    cat === "מזרן" ||
    cat === "מזרנים" ||
    cat === "מזרון" ||
    cat === "מזרונים"
  ) {
    return "mattress";
  }
  if (cat === "bed" || cat === "מיטה" || cat === "מיטות") return "bed";
  return "other";
}

// Pick the best-matching extra_charges row for the cart counts.
// A rule matches when both mattress and bed counts are inside its
// [min, max] ranges (NULL max = unbounded). Ties break on `priority`
// (higher wins), then on `cost` (higher wins).
function pickShippingRule(rules, counts) {
  const matches = rules.filter((r) => {
    const minM = Number(r.min_mattresses || 0);
    const maxM = r.max_mattresses == null ? Infinity : Number(r.max_mattresses);
    const minB = Number(r.min_beds || 0);
    const maxB = r.max_beds == null ? Infinity : Number(r.max_beds);
    return (
      counts.mattresses >= minM &&
      counts.mattresses <= maxM &&
      counts.beds >= minB &&
      counts.beds <= maxB
    );
  });
  if (!matches.length) return null;
  matches.sort(
    (a, b) =>
      Number(b.priority || 0) - Number(a.priority || 0) ||
      Number(b.cost || 0) - Number(a.cost || 0)
  );
  return matches[0];
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadDeliveryMethod() {
  try {
    const v = localStorage.getItem(DELIVERY_KEY);
    return v === DELIVERY_METHODS.pickup ? DELIVERY_METHODS.pickup : DELIVERY_METHODS.shipping;
  } catch {
    return DELIVERY_METHODS.shipping;
  }
}

// Resolve which variation matches the chosen size string.
// Falls back to the product's default variation, or the first one.
function resolveVariation(product, size) {
  if (!product?.variations?.length) return null;
  const byName = product.variations.find((v) => v.name === size);
  if (byName) return byName;
  const byDims = product.variations.find(
    (v) => v.width_cm && v.length_cm && `${v.width_cm}x${v.length_cm}` === size
  );
  if (byDims) return byDims;
  if (product.default_variation_id) {
    const def = product.variations.find((v) => v.id === product.default_variation_id);
    if (def) return def;
  }
  return product.variations[0];
}

function priceFromVariation(variation, fallbackProduct) {
  if (variation) {
    return Number(variation.final_price ?? variation.base_price ?? 0);
  }
  // Fallback for fallbackProducts (no variations)
  return Number(fallbackProduct?.sale_price ?? fallbackProduct?.price ?? 0);
}

// The undiscounted price of the variation (what the customer "would pay
// normally"). Used to compute how much they saved on this line.
function originalPriceFromVariation(variation, fallbackProduct) {
  if (variation) {
    return Number(variation.base_price ?? variation.final_price ?? 0);
  }
  return Number(fallbackProduct?.price ?? fallbackProduct?.sale_price ?? 0);
}

// Per-line price helpers. They read nothing but their argument, so they live
// at module scope: inside the component they were rebuilt on every render and
// the memos that call them had to leave them out of their dependency arrays.

// Backwards-compat: support legacy cart items that don't have `unitPrice`
function lineUnitPrice(i) {
  return i.unitPrice ?? i.product?.sale_price ?? i.product?.price ?? 0;
}

function lineOriginalUnitPrice(i) {
  return i.originalUnitPrice ?? i.product?.price ?? lineUnitPrice(i);
}

// Sum of addon prices attached to a single cart row
function addonsUnitPrice(i) {
  return Array.isArray(i.addons)
    ? i.addons.reduce((s, a) => s + Number(a.price || 0), 0)
    : 0;
}

// What the bed configurator adds to one unit. Kept separate from addons
// rather than folded in: they come from different tables and a rep reading
// the order needs to see which is which.
function bedConfigUnitPrice(i) {
  return Array.isArray(i.bedConfig)
    ? i.bedConfig.reduce((s, c) => s + Number(c.price || 0), 0)
    : 0;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  // Lets refreshPrices read the current rows without being rebuilt on every
  // cart change, which would restart the effect that calls it.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const [deliveryMethod, setDeliveryMethodState] = useState(loadDeliveryMethod);
  const [shippingRules, setShippingRules] = useState([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(DELIVERY_KEY, deliveryMethod);
  }, [deliveryMethod]);

  const setDeliveryMethod = useCallback((method) => {
    setDeliveryMethodState(
      method === DELIVERY_METHODS.pickup ? DELIVERY_METHODS.pickup : DELIVERY_METHODS.shipping,
    );
  }, []);

  // Fetch the extra_charges rules from Supabase once on mount. RLS on
  // the table must allow public select for is_active = true.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rules = await base44.entities.ExtraCharge.list();
        if (!cancelled) setShippingRules(Array.isArray(rules) ? rules : []);
      } catch (err) {
        console.error("[cart] failed to load shipping rules:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // `bedConfig` is what the bed configurator resolved for this size — the
  // questions the customer answered plus the ones the site answered for them.
  // It rides on the row so the cart, the order and the factory all describe the
  // same bed; the CRM reconstructs its own line-per-choice shape from it.
  const addItem = useCallback((product, size, quantity = 1, withStorage = false, addons = [], bedConfig = []) => {
    const variation = resolveVariation(product, size);
    const unitPrice = priceFromVariation(variation, product);
    const originalUnitPrice = originalPriceFromVariation(variation, product);
    const variationId = variation?.id || null;
    // Normalise addons: array of { id, name, price }
    const normAddons = Array.isArray(addons)
      ? addons.map((a) => ({
          id: a.id,
          name: a.name,
          price: Number(a.price || 0),
        }))
      : [];
    const normBedConfig = Array.isArray(bedConfig)
      ? bedConfig.map((c) => ({
          group_key: c.group_key,
          group_label: c.group_label,
          value_key: c.value_key,
          value_label: c.value_label,
          price: Number(c.price || 0),
        }))
      : [];
    // Two cart rows match only if their addons are identical (ids + prices).
    const sameAddons = (a, b) => {
      if ((a?.length || 0) !== (b?.length || 0)) return false;
      const aKey = [...(a || [])].map((x) => `${x.id}:${x.price}`).sort().join("|");
      const bKey = [...(b || [])].map((x) => `${x.id}:${x.price}`).sort().join("|");
      return aKey === bKey;
    };

    // Same bed at the same size with a different box is a different purchase,
    // so it must not merge into the existing row.
    const sameBedConfig = (a, b) => {
      if ((a?.length || 0) !== (b?.length || 0)) return false;
      const key = (list) => [...(list || [])].map((x) => `${x.group_key}:${x.value_key}`).sort().join("|");
      return key(a) === key(b);
    };

    setItems((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.product.id === product.id &&
          i.size === size &&
          i.withStorage === withStorage &&
          i.variationId === variationId &&
          sameAddons(i.addons, normAddons) &&
          sameBedConfig(i.bedConfig, normBedConfig)
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      }
      return [...prev, {
        product, size, quantity, withStorage, variationId,
        unitPrice,
        originalUnitPrice,
        addons: normAddons,
        bedConfig: normBedConfig,
      }];
    });
  }, []);

  const removeItem = useCallback((index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index, quantity) => {
    if (quantity < 1) return;
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });
  }, []);

  /**
   * Re-price every row against the live catalogue.
   *
   * A row stores the price it was added at, which is what lets the cart survive
   * a reload — but it also means a tab left open overnight, or a phone that
   * restored its session, checks out at yesterday's price. That cuts both ways:
   * the customer can underpay after a rise, or be charged more than the page
   * quoted them after a fall, which is the worse half.
   *
   * Returns the rows whose price moved, so the caller can say so rather than
   * silently changing the total under someone who is about to pay it. Bed
   * configuration and addon prices are snapshots of a choice, not of the
   * catalogue, and are left alone.
   */
  const refreshPrices = useCallback(async () => {
    let products;
    try {
      products = await base44.entities.Product.list();
    } catch {
      // Offline or the RPC is down: the stored prices are all we have, and
      // blocking checkout over it would be worse than an old price.
      return [];
    }
    const byId = new Map((products || []).map((p) => [p.id, p]));

    // Worked out before setItems, not inside it. React may run an updater more
    // than once for the same commit, and a list built in there would collect
    // each row twice — the customer would be told about one change two times.
    const current = itemsRef.current;
    const next = current.map((item) => {
      const fresh = byId.get(item.product?.id);
      if (!fresh) return item;
      const variation = resolveVariation(fresh, item.size);
      const unitPrice = priceFromVariation(variation, fresh);
      if (!unitPrice || unitPrice === item.unitPrice) return item;
      return {
        ...item,
        product: fresh,
        unitPrice,
        originalUnitPrice: originalPriceFromVariation(variation, fresh),
      };
    });

    const changed = next
      .map((item, i) => ({ item, was: current[i] }))
      .filter(({ item, was }) => item.unitPrice !== was.unitPrice)
      .map(({ item, was }) => ({ name: item.product?.name, from: was.unitPrice, to: item.unitPrice }));

    if (changed.length) setItems(next);
    return changed;
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartTotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (lineUnitPrice(i) + addonsUnitPrice(i) + bedConfigUnitPrice(i)) * i.quantity,
        0
      ),
    [items]
  );

  // Sum of discounts across all lines (originalUnitPrice - unitPrice) * qty.
  // Never negative.
  const cartSavings = useMemo(
    () =>
      items.reduce((sum, i) => {
        const delta = Math.max(0, lineOriginalUnitPrice(i) - lineUnitPrice(i));
        return sum + delta * i.quantity;
      }, 0),
    [items]
  );

  const cartCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  // Count mattresses + beds across the cart so the rule engine has
  // something to match against. Items in unknown categories are
  // ignored (they don't push the order into a higher shipping tier).
  const cartCounts = useMemo(() => {
    let mattresses = 0;
    let beds = 0;
    for (const item of items) {
      const kind = classifyItem(item);
      if (kind === "mattress") mattresses += item.quantity;
      else if (kind === "bed") beds += item.quantity;
    }
    return { mattresses, beds };
  }, [items]);

  const matchedShippingRule = useMemo(() => {
    if (deliveryMethod === DELIVERY_METHODS.pickup) return null;
    if (items.length === 0) return null;
    if (!shippingRules.length) return null;
    return pickShippingRule(shippingRules, cartCounts);
  }, [deliveryMethod, items.length, cartCounts, shippingRules]);

  const shippingCost = useMemo(() => {
    if (deliveryMethod === DELIVERY_METHODS.pickup) return 0;
    if (items.length === 0) return 0;
    if (matchedShippingRule) return Number(matchedShippingRule.cost || 0);
    return SHIPPING_COST_FALLBACK;
  }, [deliveryMethod, items.length, matchedShippingRule]);

  // Assembly is now bundled into the relevant shipping rule (e.g.
  // "הובלה והרכבה ל-2 מיטות"), so the website no longer charges a
  // separate assembly fee. The fields stay in the payload as 0/false
  // for CRM backward compatibility.
  const assemblyCost = 0;
  const withAssembly = false;
  const orderTotal = cartTotal + shippingCost + assemblyCost;

  const shippingLabel = deliveryMethod === DELIVERY_METHODS.pickup
    ? PICKUP_LABEL
    : (matchedShippingRule?.name || "");

  const getCheckoutPayload = useCallback(() => ({
    items: items.map((i) => {
      const unit = lineUnitPrice(i);
      const addonsUnit = addonsUnitPrice(i);
      const bedUnit = bedConfigUnitPrice(i);
      return {
        productId: i.product.id,
        variationId: i.variationId || null,
        sku: i.product?.sku || null,
        name: i.product.name,
        size: i.size,
        quantity: i.quantity,
        withStorage: i.withStorage,
        unitPrice: unit,
        originalUnitPrice: lineOriginalUnitPrice(i),
        addons: Array.isArray(i.addons) ? i.addons : [],
        addonsUnitPrice: addonsUnit,
        bedConfig: Array.isArray(i.bedConfig) ? i.bedConfig : [],
        bedConfigUnitPrice: bedUnit,
        lineTotal: (unit + addonsUnit + bedUnit) * i.quantity,
        imageUrl: i.product?.image_url || null,
      };
    }),
    subtotal: cartTotal,
    savings: cartSavings,
    shipping: shippingCost,
    shippingLabel,
    deliveryMethod,
    assembly: assemblyCost,
    withAssembly,
    total: orderTotal,
  }), [items, cartTotal, cartSavings, shippingCost, shippingLabel, deliveryMethod, assemblyCost, withAssembly, orderTotal]);

  // Legacy no-op kept so callers that still import setAssembly don't crash.
  const setAssembly = useCallback(() => {}, []);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart, refreshPrices,
      cartTotal, cartCount, cartSavings,
      withAssembly, setAssembly,
      deliveryMethod, setDeliveryMethod,
      shippingCost, shippingLabel, assemblyCost, orderTotal,
      getCheckoutPayload,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
