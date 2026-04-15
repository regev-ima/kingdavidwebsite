import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X, LayoutGrid, Rows } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [hardnessFilter, setHardnessFilter] = useState("all"); // all | soft | medium | firm
  const [priceFilter, setPriceFilter] = useState("all"); // all | lt2500 | 2500-5000 | 5000-8000 | gt8000
  const [viewMode, setViewMode] = useState("grid"); // grid | list

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
      result = result.filter((p) => {
        // Prefer the new multi-category field from the CRM
        if (Array.isArray(p.categories) && p.categories.length > 0) {
          return p.categories.includes(activeCategory);
        }
        // Fallback: legacy single-category match
        return p.category === activeCategory || p.category?.includes(activeCategory);
      });
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

    if (hardnessFilter && hardnessFilter !== "all") {
      // product.hardness is a 1..10 scale (or a Hebrew label, which we
      // normalise the same way ProductCard does).
      const hardnessMap = { "רך": 3, "בינוני": 5, "בינוני-קשיח": 7, "קשיח": 9 };
      result = result.filter((p) => {
        if (p.hardness == null) return false;
        const score = typeof p.hardness === "number" ? p.hardness : hardnessMap[p.hardness] ?? null;
        if (score == null) return false;
        if (hardnessFilter === "soft") return score <= 3;
        if (hardnessFilter === "medium") return score >= 4 && score <= 6;
        if (hardnessFilter === "firm") return score >= 7;
        return true;
      });
    }

    if (priceFilter && priceFilter !== "all") {
      result = result.filter((p) => {
        const price = Number(p.sale_price || p.price || 0);
        if (!price) return false;
        if (priceFilter === "lt2500") return price < 2500;
        if (priceFilter === "2500-5000") return price >= 2500 && price < 5000;
        if (priceFilter === "5000-8000") return price >= 5000 && price < 8000;
        if (priceFilter === "gt8000") return price >= 8000;
        return true;
      });
    }

    if (sortBy === "price-asc") result = [...result].sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    if (sortBy === "price-desc") result = [...result].sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    if (sortBy === "best-sellers") result = [...result].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
    if (sortBy === "newest") result = [...result].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

    return result;
  }, [products, activeCategory, search, sortBy, sizeFilter, hardnessFilter, priceFilter]);

  const hasActiveFilters =
    activeCategory !== "הכל" ||
    search ||
    sizeFilter !== "all" ||
    hardnessFilter !== "all" ||
    priceFilter !== "all" ||
    sortBy !== "default";

  const clearFilters = () => {
    setActiveCategory("הכל");
    setSearch("");
    setSizeFilter("all");
    setHardnessFilter("all");
    setPriceFilter("all");
    setSortBy("default");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative pt-14 pb-10 md:pt-20 md:pb-14 overflow-hidden">
        {/* decorative gold glow behind title */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 via-transparent to-transparent" aria-hidden />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.4em] uppercase text-primary/70 mb-4 font-light"
          >
            קטלוג מוצרים
          </motion.p>
          <motion.h1
            key={activeCategory}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-6xl font-sans-hebrew font-semibold text-foreground mb-3"
          >
            {activeCategory === "הכל" ? "כל המוצרים" : activeCategory}
          </motion.h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-primary/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
            <span className="h-px w-14 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
          <p className="text-foreground/60 text-sm md:text-base font-light max-w-lg mx-auto">
            גלו את המגוון הרחב של מוצרי קינג דיוויד
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* Desktop: sidebar + grid. Mobile: top filter bar + grid. */}
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:items-start">
          {/* =================== FILTER SIDEBAR (lg+) =================== */}
          <aside className="hidden lg:block sticky top-[88px] self-start">
            <div className="rounded-2xl border border-primary/10 bg-background/60 backdrop-blur-md p-5 space-y-6">
              {/* Categories — vertical stack */}
              <div>
                <p className="text-[11px] tracking-[0.25em] uppercase text-foreground/50 font-light mb-3">
                  קטגוריות
                </p>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => {
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`relative text-right px-3 h-9 rounded-lg text-sm transition-all ${
                          active
                            ? "bg-primary text-primary-foreground font-semibold shadow-[0_4px_14px_hsl(42_70%_55%_/_0.28)]"
                            : "text-foreground/65 hover:text-foreground hover:bg-primary/5"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search */}
              <div>
                <p className="text-[11px] tracking-[0.25em] uppercase text-foreground/50 font-light mb-2">
                  חיפוש
                </p>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="שם מוצר..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10 h-10"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      aria-label="נקה חיפוש"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Size */}
              <div>
                <p className="text-[11px] tracking-[0.25em] uppercase text-foreground/50 font-light mb-2">
                  מידה
                </p>
                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="כל המידות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל המידות</SelectItem>
                    {sizes.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hardness */}
              <div>
                <p className="text-[11px] tracking-[0.25em] uppercase text-foreground/50 font-light mb-2">
                  דרגת קושי
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: "all", label: "הכל" },
                    { value: "soft", label: "רך" },
                    { value: "medium", label: "בינוני" },
                    { value: "firm", label: "קשיח" },
                  ].map((opt) => {
                    const active = hardnessFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setHardnessFilter(opt.value)}
                        className={`h-9 rounded-lg text-xs transition-all ${
                          active
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "border border-primary/15 text-foreground/70 hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price range */}
              <div>
                <p className="text-[11px] tracking-[0.25em] uppercase text-foreground/50 font-light mb-2">
                  טווח מחיר
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { value: "all", label: "הכל" },
                    { value: "lt2500", label: "עד ₪2,500" },
                    { value: "2500-5000", label: "₪2,500 — ₪5,000" },
                    { value: "5000-8000", label: "₪5,000 — ₪8,000" },
                    { value: "gt8000", label: "₪8,000 ומעלה" },
                  ].map((opt) => {
                    const active = priceFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setPriceFilter(opt.value)}
                        className={`h-9 rounded-lg text-xs transition-all text-right px-3 ${
                          active
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "border border-primary/15 text-foreground/70 hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <div className="pt-4 border-t border-primary/10">
                  <button
                    onClick={clearFilters}
                    className="w-full h-10 rounded-lg border border-primary/20 text-xs text-primary hover:bg-primary/5 transition-colors"
                  >
                    נקה את כל הסינונים
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* =================== MAIN COLUMN =================== */}
          <div>
            {/* Mobile / tablet filter bar (stays for <lg) */}
            <div className="lg:hidden sticky top-[64px] md:top-[72px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6 bg-background/75 backdrop-blur-xl border-b border-primary/10">
              {/* Category tabs — horizontal scroll w/ animated indicator */}
              <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-hidden">
                <div className="flex gap-1 min-w-max relative">
                  {categories.map((cat) => {
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`relative px-5 h-10 rounded-full text-sm whitespace-nowrap transition-colors ${
                          active
                            ? "text-primary-foreground"
                            : "text-foreground/55 hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="activeCategoryPill"
                            transition={{ type: "spring", stiffness: 480, damping: 36 }}
                            className="absolute inset-0 bg-primary rounded-full shadow-[0_4px_18px_hsl(42_70%_55%_/_0.35)]"
                            aria-hidden
                          />
                        )}
                        <span className="relative z-10 font-medium tracking-wide">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary row: search, size, sort, count */}
              <div className="flex items-center gap-2 pb-3 flex-wrap md:flex-nowrap">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="חיפוש מוצר..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10 h-10"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      aria-label="נקה חיפוש"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
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

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:text-primary/70 transition-colors underline-offset-2 hover:underline shrink-0 px-2"
                  >
                    נקה סינון
                  </button>
                )}
              </div>
            </div>

            {/* Toolbar — sits above the leftmost product: count on the
                LEFT (visual), sort + view toggle on the RIGHT. */}
            <div className="flex items-center justify-between gap-3 mb-5" dir="ltr">
              {/* Count (visually LEFT) */}
              <span className="text-sm text-foreground/60 font-light" dir="rtl">
                <span className="text-foreground font-semibold">{filtered.length}</span>{" "}
                מוצרים
              </span>

              {/* Right cluster — sort + view toggle */}
              <div className="flex items-center gap-2" dir="rtl">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 h-10">
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

                {/* View toggle — grid vs single-row list */}
                <div className="hidden sm:flex items-center h-10 rounded-lg border border-primary/15 overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="תצוגת גריד"
                    className={`h-full px-3 flex items-center justify-center transition-colors ${
                      viewMode === "grid"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="תצוגת שורה"
                    className={`h-full px-3 flex items-center justify-center transition-colors border-r border-primary/15 ${
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    <Rows className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden royal-card">
                    <div className="aspect-[4/5] shimmer" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 w-24 shimmer rounded" />
                      <div className="h-5 w-3/4 shimmer rounded" />
                      <div className="h-7 w-28 shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <div className="inline-block mb-4 text-5xl font-sans-hebrew text-primary/30">∅</div>
                <p className="text-foreground/60 text-lg font-light">לא נמצאו מוצרים</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-primary text-sm tracking-wide hover:underline"
                  >
                    נקה את כל הסינונים
                  </button>
                )}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className={
                    viewMode === "list"
                      ? "flex flex-col gap-4"
                      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                  }
                >
                  {filtered.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={i}
                      layout={viewMode === "list" ? "row" : "grid"}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
