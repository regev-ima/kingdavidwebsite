import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ProductCard({ product, index }) {
  const discount = product.sale_price && product.price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      viewport={{ once: true }}
    >
      <Link to={`/ProductDetail?id=${product.id}`} className="group block">
        <div className="royal-card rounded-lg overflow-hidden">
          <div className="relative aspect-square overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-card">
                <span className="text-5xl font-cormorant text-primary/15">KD</span>
              </div>
            )}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {discount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground font-medium text-xs">
                  -{discount}%
                </Badge>
              )}
              {product.is_on_sale && !discount && (
                <Badge className="bg-destructive text-destructive-foreground text-xs">מבצע</Badge>
              )}
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs text-muted-foreground mb-1 font-light">{product.category}</p>
            <h3 className="font-cormorant text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
              {product.name}
            </h3>
            {product.hardness && (() => {
              const hardnessMap = { "רך": 3, "בינוני": 5, "בינוני-קשיח": 7, "קשיח": 9 };
              const score = hardnessMap[product.hardness] ?? 5;
              return (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1 font-light">{product.hardness} – קשיחות: {score}/10</p>
                  <div className="w-full h-1 rounded-full bg-primary/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center gap-2 mb-3">
              {product.sale_price ? (
                <>
                  <span className="text-lg font-semibold text-primary">₪{product.sale_price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground line-through">₪{product.price.toLocaleString()}</span>
                </>
              ) : (
                <span className="text-lg font-semibold text-primary">₪{product.price.toLocaleString()}</span>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full min-h-[44px] border-primary/15 text-foreground/60 hover:border-primary/30 hover:text-primary rounded-none tracking-wide font-light"
            >
              לפרטים
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
