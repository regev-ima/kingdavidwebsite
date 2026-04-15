import React from "react";
import { X, Plus, Minus, Trash2, ShoppingBag, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/CartContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function CartDrawer({ open, onClose }) {
  const {
    items, removeItem, updateQuantity, clearCart,
    cartTotal, cartCount, cartSavings,
    withAssembly, setAssembly,
    shippingCost, assemblyCost, orderTotal,
  } = useCart();

  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-full sm:max-w-sm z-[70] glass-strong border-r border-white/[0.08] flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">סל קניות</h2>
                <span className="text-sm text-muted-foreground">({cartCount} פריטים)</span>
              </div>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">הסל ריק</p>
                </div>
              ) : (
                items.map((item, idx) => {
                  const price = item.product.sale_price || item.product.price;
                  return (
                    <div key={idx} className="glass rounded-xl p-4">
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/[0.03] shrink-0">
                          {item.product.image_url ? (
                            <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/20 font-playfair text-lg">KD</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground text-sm truncate">{item.product.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.size && <span>מידה: {item.size}</span>}
                            {item.withStorage && <span> | עם ארגז מצעים</span>}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            ₪{price.toLocaleString()} ליחידה
                          </p>
                          <p className="text-sm font-bold text-primary mt-1">₪{(price * item.quantity).toLocaleString()}</p>
                        </div>

                        {/* Delete button - 44px touch target */}
                        <button
                          onClick={() => removeItem(idx)}
                          className="w-11 h-11 flex items-center justify-center rounded-lg text-foreground/40 hover:text-destructive hover:bg-white/[0.06] transition-colors self-start shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateQuantity(idx, item.quantity - 1)}
                          className="w-11 h-11 rounded-md glass flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-medium text-foreground w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, item.quantity + 1)}
                          className="w-11 h-11 rounded-md glass flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer / Summary */}
            {items.length > 0 && (
              <div className="border-t border-white/[0.08] p-5 space-y-3 pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-between text-sm text-foreground/80">
                  <span>סכום ביניים</span>
                  <span>₪{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-foreground/80">
                  <span>משלוח</span>
                  <span>₪{shippingCost}</span>
                </div>

                {/* Assembly option */}
                <label className="flex items-center justify-between text-sm cursor-pointer min-h-[44px]">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={withAssembly}
                      onChange={(e) => setAssembly(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 accent-primary"
                    />
                    <span className="text-foreground/80">הרכבה (+₪150)</span>
                  </div>
                  {withAssembly && <span className="text-foreground/80">₪150</span>}
                </label>

                <p className="text-[11px] text-muted-foreground/60">
                  * המשלוחים אינם כוללים את הצפון הרחוק והדרום הרחוק
                </p>

                {cartSavings > 0 && (
                  <div className="flex items-center justify-between text-sm rounded-lg px-3 py-2 bg-primary/[0.08] border border-primary/25 text-primary">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Tag className="w-3.5 h-3.5" />
                      בקנייה זו חסכת
                    </span>
                    <span className="font-semibold">₪{cartSavings.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-foreground font-bold text-lg pt-2 border-t border-white/[0.08]">
                  <span>סה"כ</span>
                  <span className="text-primary">₪{orderTotal.toLocaleString()}</span>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-xl glow-gold"
                  onClick={() => { onClose(); navigate('/Checkout'); }}
                >
                  לתשלום
                </Button>

                <a
                  href="https://wa.me/972549632221"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-sm text-green-400 hover:text-green-300 transition-colors min-h-[44px] flex items-center justify-center"
                >
                  או הזמינו בוואטסאפ
                </a>

                <button
                  onClick={clearCart}
                  className="w-full text-center text-sm text-muted-foreground hover:text-destructive transition-colors min-h-[44px]"
                >
                  רוקן סל
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
