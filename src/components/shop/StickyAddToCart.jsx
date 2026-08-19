import React, { useState, useEffect } from "react";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function StickyAddToCart({ ctaRef, product, onAddToCart, addedToCart }) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!ctaRef?.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [ctaRef]);

  const displayPrice = product?.sale_price || product?.price;

  return (
    <AnimatePresence>
      {show && product && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/[0.08]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm font-bold text-foreground truncate">{product.name}</span>
              <span className="text-sm font-bold text-primary shrink-0">
                ₪{displayPrice?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* WhatsApp - Coming Soon */}
              <div className="relative">
                <Button
                  disabled
                  className="bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 font-bold min-h-[44px] rounded-xl gap-2 opacity-70 cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.523 5.845L0 24l6.335-1.499A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.68-.491-5.23-1.349l-.374-.217-3.882.918.979-3.793-.239-.389A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  וואטסאפ
                </Button>
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">בקרוב</span>
              </div>
              {addedToCart ? (
                <Button
                  onClick={() => navigate("/Checkout")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[44px] rounded-xl gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <ArrowLeft className="w-4 h-4" />
                  מעבר לתשלום
                </Button>
              ) : (
                <Button
                  onClick={onAddToCart}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold min-h-[44px] rounded-xl gap-2 glow-gold"
                >
                  <ShoppingCart className="w-4 h-4" />
                  הוסף לעגלה
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}