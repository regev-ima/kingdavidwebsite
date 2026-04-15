import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, ArrowLeft, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { computeEffectivePrice } from "@/lib/pricing";
import SaleCountdown from "@/components/shop/SaleCountdown";
import HardnessScale from "@/components/shop/HardnessScale";
import { optimizeImage, optimizeSrcSet } from "@/lib/image";

export default function ProductCard({ product, index, layout = "grid" }) {
  const [hovered, setHovered] = useState(false);
  const isRow = layout === "row";

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
      className="group relative h-full"
    >
      <Link to={`/ProductDetail?id=${product.id}`} className="block h-full">
        {/* Outer frame with gold accent animation. flex column so the
            price row always sticks to the bottom even when sibling
            cards carry more optional content (e.g. countdown pill). */}
        <div
          className={`relative flex ${
            isRow ? "flex-row" : "flex-col"
          } h-full rounded-2xl overflow-hidden transition-all duration-500 royal-card group-hover:shadow-[0_20px_60px_-15px_hsl(42_70%_55%_/_0.25)] group-hover:-translate-y-0.5`}
        >
          {/* Image — grid: 4:5 ratio. row: fixed width, full height */}
          <div
            className={`relative overflow-hidden shrink-0 ${
              isRow
                ? "w-24 sm:w-32 aspect-square"
                : "aspect-[4/5]"
            }`}
          >
            {product.image_url ? (
              <motion.img
                src={optimizeImage(product.image_url, { width: 600, quality: 72 })}
                srcSet={optimizeSrcSet(product.image_url, [400, 600, 900], { quality: 72 })}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                alt={product.name}
                loading="lazy"
                decoding="async"
                animate={{ scale: hovered ? 1.08 : 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(225_15%_10%)] to-[hsl(225_20%_4%)]">
                <span className="text-7xl font-sans-hebrew text-primary/15 select-none">KD</span>
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

          {/* Body — flex-1 so cards in a row equalise to the tallest one,
              with the price row pinned at the bottom via mt-auto. */}
          <div className={`relative flex flex-col flex-1 ${isRow ? "p-3 gap-1.5" : "p-5 gap-3"}`}>
            <div className="flex items-center justify-between">
              <p className={`tracking-[0.22em] text-muted-foreground uppercase font-light ${isRow ? "text-[9px]" : "text-[11px]"}`}>
                {product.category}
              </p>
              <span className={`text-primary/70 font-light ${isRow ? "text-[9px]" : "text-[10px]"}`}>
                {product.warranty_years ?? 10} שנות אחריות
              </span>
            </div>

            <h3 className={`font-sans-hebrew leading-tight font-semibold text-foreground group-hover:text-primary transition-colors ${isRow ? "text-sm" : "text-lg"}`}>
              {product.name}
            </h3>

            {product.hardness && (() => {
              const hardnessMap = { "רך": 3, "בינוני": 5, "בינוני-קשיח": 7, "קשיח": 9 };
              const score = typeof product.hardness === "number"
                ? product.hardness
                : (hardnessMap[product.hardness] ?? 5);
              const label = score > 7 ? "קשיח" : score > 5 ? "בינוני-קשיח" : score > 3 ? "בינוני" : "רך";
              return (
                <div className={isRow ? "pt-0.5" : "pt-1"}>
                  <div className={`flex items-baseline justify-between ${isRow ? "mb-1" : "mb-2"}`}>
                    <span className={`font-medium text-foreground/80 inline-flex items-center gap-1 ${isRow ? "text-[10px]" : "text-xs"}`}>
                      <Layers className={`text-primary ${isRow ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                      דרגת קושי
                    </span>
                    <span className={`text-foreground/55 ${isRow ? "text-[9px]" : "text-[10px]"}`}>
                      {label}
                    </span>
                  </div>
                  <HardnessScale value={score} size="sm" animate={!isRow} />
                </div>
              );
            })()}

            {/* Countdown — right above the price (only if active) */}
            {pricing.isOnSaleNow && pricing.saleEndsAt && (
              <div className="pt-1">
                <SaleCountdown endsAt={pricing.saleEndsAt} variant="compact" />
              </div>
            )}

            {/* Price row — mt-auto keeps it at the bottom of every card */}
            <div className={`mt-auto flex items-end justify-between ${isRow ? "pt-0.5" : "pt-1"}`}>
              <div className="flex items-baseline gap-2 flex-wrap">
                {pricing.isOnSaleNow ? (
                  <>
                    <span className={`font-sans-hebrew font-semibold text-primary leading-none ${isRow ? "text-base" : "text-2xl"}`}>
                      ₪{pricing.finalPrice.toLocaleString()}
                    </span>
                    <span className={`text-muted-foreground line-through ${isRow ? "text-xs" : "text-sm"}`}>
                      ₪{pricing.originalPrice.toLocaleString()}
                    </span>
                  </>
                ) : pricing.finalPrice > 0 ? (
                  <span className={`font-sans-hebrew font-semibold text-primary leading-none ${isRow ? "text-base" : "text-2xl"}`}>
                    ₪{pricing.finalPrice.toLocaleString()}
                  </span>
                ) : (
                  <span className={`text-muted-foreground ${isRow ? "text-xs" : "text-sm"}`}>צור קשר לתמחור</span>
                )}
              </div>

              {/* Arrow CTA — slides in on hover */}
              <motion.span
                animate={{
                  x: hovered ? 0 : 8,
                  opacity: hovered ? 1 : 0.5,
                }}
                transition={{ duration: 0.3 }}
                className={`inline-flex items-center gap-1.5 tracking-widest text-primary font-light group-hover:text-primary ${isRow ? "text-[10px]" : "text-xs"}`}
              >
                לפרטים
                <ArrowLeft className={isRow ? "w-3 h-3" : "w-4 h-4"} />
              </motion.span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
