import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { computeEffectivePrice } from "@/lib/pricing";
import SaleCountdown from "@/components/shop/SaleCountdown";

export default function ProductCard({ product, index }) {
  const [hovered, setHovered] = useState(false);

  // Pick the default variation (or first) so the card price reflects
  // the same variation the detail page opens to.
  const defaultVariation =
    product?.variations?.find((v) => v.id === product?.default_variation_id) ||
    product?.variations?.[0] ||
    null;
  const pricing = computeEffectivePrice(product, defaultVariation);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: "-10% 0px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative"
    >
      <Link to={`/ProductDetail?id=${product.id}`} className="block">
        {/* Outer frame with gold accent animation */}
        <div className="relative rounded-2xl overflow-hidden transition-all duration-500 royal-card group-hover:shadow-[0_20px_60px_-15px_hsl(42_70%_55%_/_0.25)] group-hover:-translate-y-0.5">
          {/* Image */}
          <div className="relative aspect-[4/5] overflow-hidden">
            {product.image_url ? (
              <motion.img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                animate={{ scale: hovered ? 1.08 : 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(225_15%_10%)] to-[hsl(225_20%_4%)]">
                <span className="text-7xl font-cormorant text-primary/15 select-none">KD</span>
              </div>
            )}

            {/* Soft vignette for legibility */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

            {/* Top-right: discount badge only (keep the image clean) */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
              {pricing.badgeLabel && (
                <Badge className="bg-destructive text-destructive-foreground font-bold text-xs px-2.5 py-1 tracking-wide shadow-lg">
                  {pricing.badgeLabel}
                </Badge>
              )}
              {pricing.isOnSaleNow && !pricing.badgeLabel && (
                <Badge className="bg-destructive text-destructive-foreground text-xs px-2.5 py-1">מבצע</Badge>
              )}
            </div>

            {/* Hover-reveal quick actions */}
            <motion.div
              initial={false}
              animate={{
                opacity: hovered ? 1 : 0,
                y: hovered ? 0 : 12,
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute top-3 left-3 z-10 flex flex-col gap-2"
            >
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); /* Placeholder for Quick View */ }}
                aria-label="תצוגה מהירה"
                className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md border border-primary/20 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                <Eye className="w-[18px] h-[18px]" />
              </button>
            </motion.div>

            {/* Bottom gold accent line (grows on hover) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-700 ease-out" />
          </div>

          {/* Body */}
          <div className="relative p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase font-light">
                {product.category}
              </p>
              {product.warranty_years && (
                <span className="text-[10px] text-primary/70 font-light">
                  {product.warranty_years} שנות אחריות
                </span>
              )}
            </div>

            <h3 className="font-cormorant text-xl leading-tight font-semibold text-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            {product.hardness && (() => {
              const hardnessMap = { "רך": 3, "בינוני": 5, "בינוני-קשיח": 7, "קשיח": 9 };
              const score = typeof product.hardness === "number"
                ? product.hardness
                : (hardnessMap[product.hardness] ?? 5);
              return (
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground font-light">
                    {typeof product.hardness === "string" ? product.hardness : "קשיחות"} — {score}/10
                  </p>
                  <div className="w-full h-[3px] rounded-full bg-foreground/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(score / 10) * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      viewport={{ once: true }}
                      className="h-full rounded-full bg-gradient-to-l from-primary to-primary/60"
                    />
                  </div>
                </div>
              );
            })()}

            {/* Countdown — right above the price (only if active) */}
            {pricing.isOnSaleNow && pricing.saleEndsAt && (
              <div className="pt-1">
                <SaleCountdown endsAt={pricing.saleEndsAt} variant="compact" />
              </div>
            )}

            {/* Price row */}
            <div className="flex items-end justify-between pt-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                {pricing.isOnSaleNow ? (
                  <>
                    <span className="text-2xl font-cormorant font-semibold text-primary leading-none">
                      ₪{pricing.finalPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      ₪{pricing.originalPrice.toLocaleString()}
                    </span>
                  </>
                ) : pricing.finalPrice > 0 ? (
                  <span className="text-2xl font-cormorant font-semibold text-primary leading-none">
                    ₪{pricing.finalPrice.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">צור קשר לתמחור</span>
                )}
              </div>

              {/* Arrow CTA — slides in on hover */}
              <motion.span
                animate={{
                  x: hovered ? 0 : 8,
                  opacity: hovered ? 1 : 0.5,
                }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-1.5 text-xs tracking-widest text-primary font-light group-hover:text-primary"
              >
                לפרטים
                <ArrowLeft className="w-4 h-4" />
              </motion.span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
