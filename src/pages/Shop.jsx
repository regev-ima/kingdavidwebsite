import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "../components/shop/ProductCard";
import { fallbackProducts } from "@/data/fallbackProducts";

const categories = [
  "הכל",
  "מזרנים זוגיים",
  "מזרני יחיד",
  "מיטות זוגיות",
  "מיטות יחיד",
  "מיטות יהודיות",
  "מיטות מעוצבות",
  "מבצעים",
];

const sizes = [
  "80x190", "90x190", "100x190", "120x190", "140x190", "150x190", "160x190", "180x190",
  "80x200", "90x200", "100x200", "120x200", "140x200", "150x200", "160x200", "180x200", "200x200",
];

export default function Shop() {
  const { category: urlCategory } = useParams();
  const queryCategory = new URLSearchParams(window.location.search).get("category");
  const initialCategory = urlCategory || queryCategory || "הכל";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [sizeFilter, setSizeFilter] = useState("all");

  const { data: apiProducts, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const result = await base44.entities.Product.list("-created_date", 100);
        return result;
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const products = apiProducts?.length > 0 ? apiProducts : fallbackProducts;

  const filtered = useMemo(() => {
    let result = products;

    if (activeCategory === "מבצעים") {
      result = result.filter((p) => p.is_on_sale);
    } else if (activeCategory !== "הכל") {
      result = result.filter((p) =>
        p.category === activeCategory || p.category?.includes(activeCategory)
      );
    }

    if (search) {
      result = result.filter((p) =>
        p.name?.includes(search) || p.description?.includes(search)
      );
    }

    if (sizeFilter && sizeFilter !== "all") {
      result = result.filter((p) =>
        p.available_sizes && Array.isArray(p.available_sizes) && p.available_sizes.includes(sizeFilter)
      );
    }

    if (sortBy === "price-asc") result = [...result].sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    if (sortBy === "price-desc") result = [...result].sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    if (sortBy === "best-sellers") result = [...result].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
    if (sortBy === "newest") result = [...result].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

    return result;
  }, [products, activeCategory, search, sortBy, sizeFilter]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-cormorant font-semibold text-foreground mb-2">
            {activeCategory === "הכל" ? "כל המוצרים" : activeCategory}
          </h1>
          <p className="text-foreground/50 text-sm font-light">
            גלו את המגוון הרחב של מוצרי קינג דיוויד
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {/* Filter Bar — single row on desktop, stacked on mobile */}
        <div className="royal-card rounded-lg p-4 mb-8">
          {/* Top row: Categories (scrollable) + Search */}
          <div className="flex items-center gap-3 mb-3">
            {/* Categories — horizontal scroll */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-1.5 min-w-max">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 h-9 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/50 hover:text-foreground hover:bg-primary/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row: Search + Size + Sort — all inline */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="חיפוש מוצר..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 h-10"
              />
            </div>

            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="w-36 h-10 shrink-0">
                <SelectValue placeholder="כל המידות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המידות</SelectItem>
                {sizes.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 h-10 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 ml-1.5 shrink-0" />
                <SelectValue placeholder="מיון" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">ברירת מחדל</SelectItem>
                <SelectItem value="price-asc">מחיר: נמוך → גבוה</SelectItem>
                <SelectItem value="price-desc">מחיר: גבוה → נמוך</SelectItem>
                <SelectItem value="best-sellers">הנמכרים ביותר</SelectItem>
                <SelectItem value="newest">חדשים</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filter + result count */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
            <span className="text-xs text-foreground/40">{filtered.length} מוצרים</span>
            {(activeCategory !== "הכל" || search || sizeFilter !== "all") && (
              <button
                onClick={() => { setActiveCategory("הכל"); setSearch(""); setSizeFilter("all"); setSortBy("default"); }}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                נקה סינון
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">לא נמצאו מוצרים</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
