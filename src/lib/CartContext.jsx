import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "kd_cart";
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

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [withAssembly, setWithAssembly] = useState(loadAssembly);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(ASSEMBLY_KEY, String(withAssembly));
  }, [withAssembly]);

  const addItem = useCallback((product, size, quantity = 1, withStorage = false) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.product.id === product.id && i.size === size && i.withStorage === withStorage
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      }
      return [...prev, { product, size, quantity, withStorage }];
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

  const cartTotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.product.sale_price || i.product.price) * i.quantity, 0),
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
    items: items.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      size: i.size,
      quantity: i.quantity,
      withStorage: i.withStorage,
      unitPrice: i.product.sale_price || i.product.price,
      lineTotal: (i.product.sale_price || i.product.price) * i.quantity,
    })),
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
