import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCart } from "@/lib/CartContext";

export default function OrderSummary({ collapsibleOnMobile = true }) {
  const {
    items, cartTotal, withAssembly, setAssembly,
    shippingCost, assemblyCost, orderTotal,
  } = useCart();

  const [expanded, setExpanded] = useState(false);

  const itemsList = (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const price = item.product.sale_price || item.product.price;
        return (
          <div key={idx} className="flex gap-3 items-start">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/[0.03] shrink-0">
              {item.product.image_url ? (
                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/20 font-playfair text-sm">KD</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.size && `מידה: ${item.size}`}
                {item.withStorage && " | ארגז מצעים"}
                {item.quantity > 1 && ` | כמות: ${item.quantity}`}
              </p>
            </div>
            <span className="text-sm font-bold text-foreground shrink-0">
              ₪{(price * item.quantity).toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );

  const costBreakdown = (
    <div className="space-y-2 mt-4 pt-4 border-t border-white/[0.08]">
      <div className="flex justify-between text-sm text-foreground/80">
        <span>סכום ביניים</span>
        <span>₪{cartTotal.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-sm text-foreground/80">
        <span>משלוח</span>
        <span>₪{shippingCost}</span>
      </div>

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
        *המשלוחים אינם כוללים צפון/דרום רחוק
      </p>

      <div className="flex justify-between font-bold text-lg pt-3 border-t border-white/[0.08]">
        <span>סה"כ</span>
        <span className="text-primary">₪{orderTotal.toLocaleString()}</span>
      </div>
    </div>
  );

  // Mobile collapsible version
  if (collapsibleOnMobile) {
    return (
      <>
        {/* Mobile: collapsible */}
        <div className="lg:hidden glass-card p-4" dir="rtl">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">סיכום הזמנה</span>
              <span className="text-sm text-muted-foreground">({items.length} פריטים)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">₪{orderTotal.toLocaleString()}</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {expanded && (
            <div className="mt-3 pt-3 border-t border-white/[0.08]">
              {itemsList}
              {costBreakdown}
            </div>
          )}
        </div>

        {/* Desktop: sticky sidebar */}
        <div className="hidden lg:block sticky top-24 glass-card p-6" dir="rtl">
          <h3 className="text-lg font-bold text-foreground mb-4">סיכום הזמנה</h3>
          {itemsList}
          {costBreakdown}
        </div>
      </>
    );
  }

  // Non-collapsible (inline) version
  return (
    <div className="glass-card p-6" dir="rtl">
      <h3 className="text-lg font-bold text-foreground mb-4">סיכום הזמנה</h3>
      {itemsList}
      {costBreakdown}
    </div>
  );
}
