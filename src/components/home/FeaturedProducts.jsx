import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackProducts } from "@/data/fallbackProducts";
import { SectionDivider } from "@/components/ui/royal-ornament";

export default function FeaturedProducts() {
  const { data: apiProducts, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      try {
        return await base44.entities.Product.filter({ is_featured: true }, "-created_date", 7);
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const products = (apiProducts?.length > 0 ? apiProducts : fallbackProducts.filter(p => p.is_featured)).slice(0, 7);

  if (isLoading) {
    return (
      <section className="py-24">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="royal-card rounded-lg overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  const doubled = [...products, ...products];

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        {/* Header with ornament */}
        <div className="text-center mb-14">
          <SectionDivider className="mb-4" />
          <h2 className="text-3xl md:text-4xl font-sans-hebrew font-semibold text-foreground mb-3">המוצרים המומלצים</h2>
          <p className="text-muted-foreground text-sm font-light tracking-wide">הדגמים הפופולריים ביותר שלנו</p>
        </div>

        {/* Carousel with fade edges */}
        <div className="relative overflow-hidden group" dir="ltr">
          {/* Fade edges */}
          <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

          <div
            className="flex gap-6 animate-marquee group-hover:[animation-play-state:paused]"
            style={{ width: "max-content" }}
          >
            {doubled.map((product, i) => (
              <Link
                key={`${product.id}-${i}`}
                to={`/ProductDetail?id=${product.id}`}
                className="group block shrink-0"
                style={{ width: "calc((100vw - 80px) / 4)", maxWidth: "380px", minWidth: "220px" }}
              >
                <div className="royal-card rounded-lg overflow-hidden h-full">
                  <div className="relative aspect-square overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-card">
                        <span className="text-4xl font-sans-hebrew text-primary/20">KD</span>
                      </div>
                    )}
                    {product.is_on_sale && (
                      <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs">מבצע</Badge>
                    )}
                  </div>
                  <div className="p-5" dir="rtl">
                    <p className="text-xs text-muted-foreground mb-1 font-light">{product.category}</p>
                    <h3 className="font-sans-hebrew text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {product.sale_price ? (
                        <>
                          <span className="text-lg font-semibold text-primary">₪{product.sale_price.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground line-through">₪{product.price.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-lg font-semibold text-primary">₪{product.price.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link to="/Shop">
            <Button variant="outline" className="gap-2 border-primary/20 text-foreground/70 hover:border-primary/40 hover:text-primary rounded-none tracking-wide font-light px-8">
              לכל המוצרים
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
