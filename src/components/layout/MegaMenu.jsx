import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { computeEffectivePrice } from "@/lib/pricing";
import { optimizeImage } from "@/lib/image";

/**
 * Full-width dropdown preview rendered below the sticky navbar.
 * Shows 6 thumbnails for the matching category, plus a
 * "צפה בעוד" CTA that links to the Shop page filtered by category.
 *
 * Props:
 *   open      — boolean, controls visibility
 *   category  — the Hebrew category label (e.g. "מזרנים", "מיטות")
 *   onMouseEnter / onMouseLeave — so the parent can keep the menu
 *                                  open while the user moves into it
 *   onNavigate — optional callback fired on any inner link click
 */
export default function MegaMenu({ open, category, onMouseEnter, onMouseLeave, onNavigate }) {
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date", 100),
    staleTime: 5 * 60 * 1000,
  });

  const items = useMemo(() => {
    if (!products?.length || !category) return [];
    // Show any product whose website_categories / category field
    // contains the requested group name (case/prefix insensitive).
    const needle = category;
    return products
      .filter((p) => {
        const cats = Array.isArray(p.categories) ? p.categories : [p.category].filter(Boolean);
        return cats.some(
          (c) =>
            c === needle ||
            (typeof c === "string" && (c.includes(needle) || needle.includes(c)))
        );
      })
      .slice(0, 6);
  }, [products, category]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-full left-0 right-0 z-40
                     bg-background/90 backdrop-blur-xl border-t border-primary/15
                     shadow-[0_16px_60px_-20px_hsl(42_70%_55%_/_0.15)]"
          role="menu"
        >
          {/* decorative top gold hairline */}
          <div className="h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {items.length === 0 ? (
              <div className="py-8 text-center text-foreground/50 text-sm">
                אין מוצרים להצגה כרגע
              </div>
            ) : (
              <div className="flex items-stretch gap-4 overflow-x-auto pb-2">
                {items.map((p) => {
                  const defaultVariation =
                    p.variations?.find((v) => v.id === p.default_variation_id) ||
                    p.variations?.[0] ||
                    null;
                  const pricing = computeEffectivePrice(p, defaultVariation);
                  return (
                    <Link
                      key={p.id}
                      to={`/ProductDetail?id=${p.id}`}
                      onClick={onNavigate}
                      className="group shrink-0 w-[150px] flex flex-col items-center text-center"
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden royal-card
                                      transition-all group-hover:-translate-y-0.5
                                      group-hover:shadow-[0_12px_32px_-12px_hsl(42_70%_55%_/_0.25)]">
                        {p.image_url ? (
                          <img
                            src={optimizeImage(p.image_url, { width: 300, quality: 70 })}
                            alt={p.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-card">
                            <span className="text-3xl font-cormorant text-primary/15">KD</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-2.5 text-[13px] font-cormorant font-medium text-foreground/85 group-hover:text-primary transition-colors line-clamp-2">
                        {p.name}
                      </p>
                      {pricing.finalPrice > 0 && (
                        <p className="text-[11px] text-primary/80 font-light mt-0.5">
                          ₪{pricing.finalPrice.toLocaleString()}
                        </p>
                      )}
                    </Link>
                  );
                })}

                {/* "View more" tile */}
                <Link
                  to={`/Shop/${encodeURIComponent(category)}`}
                  onClick={onNavigate}
                  className="group shrink-0 w-[150px] flex flex-col items-center justify-center
                             rounded-xl border border-primary/30 bg-primary/[0.04]
                             hover:bg-primary/10 hover:border-primary/55 transition-all"
                >
                  <div className="flex flex-col items-center gap-2 py-6">
                    <span className="w-10 h-10 rounded-full border border-primary/40 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </span>
                    <span className="text-[13px] tracking-wide text-primary font-medium">
                      צפה בעוד
                    </span>
                    <span className="text-[10px] text-foreground/50">
                      לקטגוריה המלאה
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
