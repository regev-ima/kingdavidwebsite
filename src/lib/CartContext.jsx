import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "kd_cart_v2";
const ASSEMBLY_KEY = "kd_assembly";
const SHIPPING_COST = 250;
const ASSEMBLY_COST = 150;

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadAssembly() {
  try {
    return localStorage.getItem(ASSEMBLY_KEY) === "true";
  } catch {
    return false;
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

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [withAssembly, setWithAssembly] = useState(loadAssembly);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(ASSEMBLY_KEY, String(withAssembly));
  }, [withAssembly]);

  const addItem = useCallback((product, size, quantity = 1, withStorage = false, addons = []) => {
    const variation = resolveVariation(product, size);
    const unitPrice = priceFromVariation(variation, product);
    const variationId = variation?.id || null;
    // Normalise addons: array of { id, name, price }
    const normAddons = Array.isArray(addons)
      ? addons.map((a) => ({
          id: a.id,
          name: a.name,
          price: Number(a.price || 0),
        }))
      : [];
    // Two cart rows match only if their addons are identical (ids + prices).
    const sameAddons = (a, b) => {
      if ((a?.length || 0) !== (b?.length || 0)) return false;
      const aKey = [...(a || [])].map((x) => `${x.id}:${x.price}`).sort().join("|");
      const bKey = [...(b || [])].map((x) => `${x.id}:${x.price}`).sort().join("|");
      return aKey === bKey;
    };

    setItems((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.product.id === product.id &&
          i.size === size &&
          i.withStorage === withStorage &&
          i.variationId === variationId &&
          sameAddons(i.addons, normAddons)
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      }
      return [...prev, {
        product, size, quantity, withStorage, variationId, unitPrice,
        addons: normAddons,
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

  const clearCart = useCallback(() => setItems([]), []);

  const setAssembly = useCallback((val) => setWithAssembly(val), []);

  // Backwards-compat: support legacy cart items that don't have `unitPrice`
  const lineUnitPrice = (i) =>
    i.unitPrice ?? i.product?.sale_price ?? i.product?.price ?? 0;

  // Sum of addon prices attached to a single cart row
  const addonsUnitPrice = (i) =>
    Array.isArray(i.addons)
      ? i.addons.reduce((s, a) => s + Number(a.price || 0), 0)
      : 0;

  const cartTotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (lineUnitPrice(i) + addonsUnitPrice(i)) * i.quantity,
        0
      ),
    [items]
  );

  const cartCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const shippingCost = SHIPPING_COST;
  const assemblyCost = withAssembly ? ASSEMBLY_COST : 0;
  const orderTotal = cartTotal + shippingCost + assemblyCost;

  const getCheckoutPayload = useCallback(() => ({
    items: items.map((i) => {
      const unit = lineUnitPrice(i);
      const addonsUnit = addonsUnitPrice(i);
      return {
        productId: i.product.id,
        variationId: i.variationId || null,
        sku: i.product?.sku || null,
        name: i.product.name,
        size: i.size,
        quantity: i.quantity,
        withStorage: i.withStorage,
        unitPrice: unit,
        addons: Array.isArray(i.addons) ? i.addons : [],
        addonsUnitPrice: addonsUnit,
        lineTotal: (unit + addonsUnit) * i.quantity,
        imageUrl: i.product?.image_url || null,
      };
    }),
    subtotal: cartTotal,
    shipping: shippingCost,
    assembly: assemblyCost,
    withAssembly,
    total: orderTotal,
  }), [items, cartTotal, shippingCost, assemblyCost, withAssembly, orderTotal]);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      cartTotal, cartCount,
      withAssembly, setAssembly,
      shippingCost, assemblyCost, orderTotal,
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
