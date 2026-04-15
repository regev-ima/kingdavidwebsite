import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Shield, Truck, ChevronLeft, ChevronRight, ShoppingCart, Package, Minus, Plus, RotateCcw, Moon, Layers, ArrowUpDown, MapPin, ArrowLeft, Clock, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/CartContext";
import ProductCard from "@/components/shop/ProductCard";
import StickyAddToCart from "@/components/shop/StickyAddToCart";
import { fallbackProducts } from "@/data/fallbackProducts";
import ProductReviewsCarousel from "@/components/shop/ProductReviewsCarousel";
import { motion } from "framer-motion";
import { computeEffectivePrice } from "@/lib/pricing";
import SaleCountdown from "@/components/shop/SaleCountdown";
import HardnessScale from "@/components/shop/HardnessScale";
import { priceForAddon, addonsForProduct } from "@/api/base44Client";
import { optimizeImage, optimizeSrcSet } from "@/lib/image";

// Estimated delivery date (14 business days from now, updated)
function getEstimatedDelivery() {
  const now = new Date();
  let days = 0;
  const start = new Date(now);
  while (days < 14) {
    start.setDate(start.getDate() + 1);
    const dow = start.getDay();
    if (dow !== 5 && dow !== 6) days++;
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

// Feature icons mapping
const featureIcons = [
  <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><path d="M20 4c-2 4-6 6-6 12a6 6 0 0012 0c0-6-4-8-6-12z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M14 28c2 4 4 6 6 6s4-2 6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><rect x="6" y="14" width="28" height="14" rx="3" stroke="currentColor" strokeWidth="1.3"/><path d="M12 14V8M28 14V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M12 8h16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.3"/><path d="M20 10v6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="20" cy="20" r="2" fill="currentColor"/></svg>,
  <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><path d="M20 4l10 4v8c0 8-5 12-10 14C15 28 10 24 10 16V8l10-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M16 18l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><rect x="4" y="22" width="32" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 20c2-6 4-8 6-8s4 1 6 4c2 3 4 4 6 4s4-1 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><rect x="6" y="6" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.3"/><path d="M14 14v12M20 12v16M26 14v12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/></svg>,
];

// Section divider component
function SectionDivider() {
  return <div className="max-w-xs mx-auto h-px bg-border my-12" />;
}

// Fade-in animation wrapper
function FadeInSection({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  const { addItem } = useCart();
  const navigate = useNavigate();

  const [selectedSize, setSelectedSize] = useState("");
  const [withStorage, setWithStorage] = useState(false); // legacy flag, still used by bed UI
  const [selectedAddons, setSelectedAddons] = useState(() => ({})); // { [addonId]: true }
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const ctaRef = useRef(null);

  const { data: apiProduct, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      try {
        const products = await base44.entities.Product.filter({ id: productId });
        return products[0] || null;
      } catch {
        return null;
      }
    },
    enabled: !!productId,
  });

  const product = apiProduct || fallbackProducts.find(p => p.id === productId) || null;

  // Addons (cached globally by the wrapper — one RPC hit for the whole site)
  const { data: allAddons = [] } = useQuery({
    queryKey: ["addons"],
    queryFn: () => base44.entities.Addon.list(),
    staleTime: 5 * 60 * 1000,
  });

  const applicableAddons = useMemo(
    () => addonsForProduct(allAddons, product || {}),
    [allAddons, product]
  );

  const DEFAULT_SIZES = ["80×190", "90×190", "100×190", "120×190", "140×190", "160×190", "180×190", "200×200"];

  const availableSizes = product?.available_sizes?.length > 0 ? product.available_sizes : DEFAULT_SIZES;

  useEffect(() => {
    if (!selectedSize && availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]);
    }
  }, [product, selectedSize, availableSizes]);

  // Pre-warm weserv + browser cache for every gallery image as soon as
  // we know the URLs — the CRM uploads tend to be large PNGs, so the
  // first on-demand optimisation is slow. Firing off background
  // `new Image()` fetches here means clicking the next/prev arrow on
  // the slider is instant instead of waiting for a full network round
  // trip.

  const { data: apiAllProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        return await base44.entities.Product.list("-created_date", 100);
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const allProducts = apiAllProducts?.length > 0 ? apiAllProducts : fallbackProducts;

  const relatedProducts = useMemo(() => {
    if (!product || !allProducts.length) return [];
    return allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);
  }, [product, allProducts]);

  const images = useMemo(() => {
    if (!product) return [];
    const out = [];
    const pushIfNew = (value) => {
      // Accept plain strings…
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return;
        if (!out.includes(trimmed)) out.push(trimmed);
        return;
      }
      // …and common object shapes (CRMs often store gallery items as
      // { url }, { src }, { image_url }, { href }, etc.)
      if (value && typeof value === "object") {
        const candidate =
          value.url ||
          value.src ||
          value.image_url ||
          value.imageUrl ||
          value.href ||
          value.path ||
          value.public_url ||
          null;
        if (candidate) pushIfNew(candidate);
      }
    };

    // Primary/cover image — shown on cards too
    pushIfNew(product.image_url);

    // Any of the common collection columns on the product itself
    const collections = [
      product.images,
      product.gallery,
      product.image_urls,
      product.media,
      product.photos,
    ];
    for (const col of collections) {
      if (Array.isArray(col)) {
        col.forEach(pushIfNew);
      } else if (col && typeof col === "object") {
        // jsonb object -> take its values
        Object.values(col).forEach(pushIfNew);
      }
    }

    // Also harvest any images attached to variations. Some CRMs store a
    // per-size photo (e.g. for beds) on the variation row itself.
    if (Array.isArray(product.variations)) {
      for (const v of product.variations) {
        if (!v) continue;
        pushIfNew(v.image_url);
        if (Array.isArray(v.images)) v.images.forEach(pushIfNew);
      }
    }

    return out;
  }, [product]);

  // Pre-warm weserv + browser cache for every gallery image as soon as
  // we know the URLs. Large Supabase PNG uploads make the first-hit
  // weserv optimisation noticeably slow — this eliminates the delay
  // when the user flips through the slider.
  useEffect(() => {
    if (!images.length || typeof window === "undefined") return;
    const preloaded = images.map((url) => {
      const img = new window.Image();
      img.decoding = "async";
      img.loading = "eager";
      // Match the main-view request so the browser reuses the same
      // cached weserv response the <img> will ask for.
      img.srcset = optimizeSrcSet(url, [600, 900, 1200], { quality: 78 }) || "";
      img.src = optimizeImage(url, { width: 1000, quality: 78 });
      return img;
    });
    return () => {
      // Help GC drop the preloaders if the user navigates away fast.
      preloaded.forEach((img) => {
        img.src = "";
        img.srcset = "";
      });
    };
  }, [images]);

  // Resolve the variation the UI currently shows (by size) so that
  // computeEffectivePrice works against the right row. Falls back to the
  // product's default variation, then the first one.
  const selectedVariation = useMemo(() => {
    if (!product?.variations?.length) return null;
    const match =
      product.variations.find((v) => v.name === selectedSize) ||
      product.variations.find(
        (v) => v.width_cm && v.length_cm && `${v.width_cm}x${v.length_cm}` === selectedSize
      );
    if (match) return match;
    if (product.default_variation_id) {
      const def = product.variations.find((v) => v.id === product.default_variation_id);
      if (def) return def;
    }
    return product.variations[0];
  }, [product, selectedSize]);

  const pricing = useMemo(
    () => computeEffectivePrice(product || {}, selectedVariation),
    [product, selectedVariation]
  );

  const discount = pricing.isOnSaleNow && pricing.originalPrice > 0
    ? Math.round(((pricing.originalPrice - pricing.finalPrice) / pricing.originalPrice) * 100)
    : 0;

  const isBed = product?.category?.includes("מיטות");

  // Replaced by <SaleCountdown endsAt={pricing.saleEndsAt} /> above —
  // it reads the real CRM sale window instead of a local 30-min gimmick.

  const handleAddToCart = () => {
    if (!product) return;
    const size = selectedSize || (product.available_sizes?.[0]) || "";
    // Build the selected-addons payload at the variation price
    const addonsPayload = applicableAddons
      .filter((a) => selectedAddons[a.id])
      .map((a) => ({
        id: a.id,
        name: a.name,
        price: Number(priceForAddon(a, selectedVariation) || 0),
      }));
    addItem(product, size, quantity, withStorage, addonsPayload);
    setAddedToCart(true);
    // Don't reset — button stays as "checkout" permanently
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">המוצר לא נמצא</p>
          <Link to="/Shop"><Button>חזרה לחנות</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="glass-light border-b border-white/[0.06] py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/Home" className="hover:text-primary">ראשי</Link>
          <span>/</span>
          <Link to="/Shop" className="hover:text-primary">חנות</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* ===== SECTION 1: Hero — Image Gallery + Product Info ===== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery — swipeable slider when there are multiple images */}
          <div className="space-y-3">
            <div
              className="relative glass-card rounded-2xl overflow-hidden bg-white/[0.03] aspect-square group/gallery"
              tabIndex={images.length > 1 ? 0 : -1}
              onKeyDown={(e) => {
                if (images.length < 2) return;
                if (e.key === "ArrowLeft") setCurrentImageIdx((p) => (p + 1) % images.length);
                if (e.key === "ArrowRight") setCurrentImageIdx((p) => (p - 1 + images.length) % images.length);
              }}
            >
              {images.length > 0 ? (
                <motion.img
                  key={images[currentImageIdx]}
                  src={optimizeImage(images[currentImageIdx], { width: 1000, quality: 78 })}
                  srcSet={optimizeSrcSet(images[currentImageIdx], [600, 900, 1200], { quality: 78 })}
                  sizes="(max-width: 1024px) 100vw, 600px"
                  alt={product.name}
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl font-sans-hebrew text-primary/20">KD</span>
                </div>
              )}

              {discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-base px-4 py-1 font-bold shadow-lg">-{discount}%</Badge>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIdx((p) => (p + 1) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/70 hover:text-foreground hover:border-primary/40 transition-all opacity-80 group-hover/gallery:opacity-100"
                    aria-label="תמונה הבאה"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIdx((p) => (p - 1 + images.length) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/70 hover:text-foreground hover:border-primary/40 transition-all opacity-80 group-hover/gallery:opacity-100"
                    aria-label="תמונה קודמת"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Counter */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-md border border-white/10 text-xs text-foreground/75 font-mono tabular-nums" dir="ltr">
                    {currentImageIdx + 1} / {images.length}
                  </div>

                  {/* Dots — clickable */}
                  <div className="absolute bottom-3 right-1/2 translate-x-1/2 flex items-center gap-1.5" aria-hidden>
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIdx(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentImageIdx
                            ? "w-6 bg-primary"
                            : "w-1.5 bg-foreground/25 hover:bg-foreground/50"
                        }`}
                        aria-label={`תמונה ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIdx(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      idx === currentImageIdx
                        ? "border-primary"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`תמונה ${idx + 1}`}
                  >
                    <img
                      src={optimizeImage(img, { width: 160, quality: 70 })}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{product.name}</h1>

            {/* Price */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-3 flex-wrap">
                {pricing.isOnSaleNow ? (
                  <>
                    <span className="text-3xl font-bold text-primary">
                      ₪{pricing.finalPrice.toLocaleString()}
                    </span>
                    <span className="text-lg text-muted-foreground line-through">
                      ₪{pricing.originalPrice.toLocaleString()}
                    </span>
                    {pricing.badgeLabel && (
                      <Badge className="bg-destructive text-destructive-foreground font-bold">
                        {pricing.badgeLabel}
                      </Badge>
                    )}
                    {pricing.savings > 0 && (
                      <span className="text-xs text-destructive font-medium">
                        חיסכון ₪{pricing.savings.toLocaleString()}
                      </span>
                    )}
                  </>
                ) : pricing.finalPrice > 0 ? (
                  <span className="text-3xl font-bold text-primary">
                    ₪{pricing.finalPrice.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-lg text-muted-foreground">צור קשר לתמחור</span>
                )}
              </div>

              {/* Sale hasn't started yet — soft note */}
              {pricing.saleNotStarted && pricing.saleStartsAt && (
                <p className="text-xs text-foreground/60">
                  המבצע מתחיל ב-{pricing.saleStartsAt.toLocaleDateString("he-IL")}
                </p>
              )}

              {/* Live countdown (only while the sale is active) */}
              {pricing.isOnSaleNow && pricing.saleEndsAt && (
                <SaleCountdown endsAt={pricing.saleEndsAt} />
              )}
            </div>

            {/* Product description — right under the price & sale banner */}
            {product.description && (
              <div className="mb-6 pb-5 border-b border-foreground/10">
                <p className="text-sm md:text-[15px] leading-relaxed text-foreground/75 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quick Specs — product-level only (dimensions).
                Warranty / shipping / trial live in the Trust Signals
                grid below the CTA so they aren't duplicated. */}
            {product.height_cm && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/60 pb-5 mb-5 border-b border-foreground/10">
                <span className="flex items-center gap-1.5"><ArrowUpDown className="w-4 h-4 text-primary" /> גובה: {product.height_cm} ס"מ</span>
              </div>
            )}

            {/* Hardness scale — 10-dot indicator (designed to feel
                editorial; replaces the older generic progress bar). */}
            {product.hardness && (
              <div className="mb-6 pb-5 border-b border-foreground/10">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-sm font-medium text-foreground/80 inline-flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" />
                    דרגת קושי
                  </span>
                  <span className="text-xs text-foreground/55">
                    {product.hardness > 7 ? "קשיח" : product.hardness > 5 ? "בינוני-קשיח" : product.hardness > 3 ? "בינוני" : "רך"}
                  </span>
                </div>
                <HardnessScale value={product.hardness} size="md" />
              </div>
            )}

            {/* Legacy "ארגז מצעים" toggle replaced by the full Addons list
                below (fed from the CRM's product_addons table). */}

            {/* Size + Quantity in one row */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-foreground/80 shrink-0">מידה</label>
                <select
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                  className="flex-1 h-11 rounded-xl border border-white/[0.08] text-foreground text-sm px-3 focus:outline-none focus:border-primary/50"
                  style={{ background: "hsl(var(--input))", color: "hsl(var(--foreground))" }}
                >
                  {availableSizes.map(size => (
                    <option key={size} value={size} style={{ background: "hsl(var(--input))" }}>{size}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-sm font-medium text-foreground/80">כמות</label>
                <div className="flex items-center glass rounded-xl">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center text-foreground/60 hover:text-primary transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-10 text-center font-bold text-foreground">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="w-11 h-11 flex items-center justify-center text-foreground/60 hover:text-primary transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {/* Addons — driven by CRM product_addons (only those where
                applicable_categories matches this product) */}
            {applicableAddons.length > 0 && (
              <div className="mb-6 space-y-2">
                <label className="text-sm font-medium text-foreground/80 block">תוספות</label>
                {applicableAddons.map((addon) => {
                  const price = priceForAddon(addon, selectedVariation);
                  const checked = Boolean(selectedAddons[addon.id]);
                  // Storage-box addons ("ארגז מצעים" / "ארגזים נפרדים") are
                  // mutually exclusive — you can only pick one of them.
                  const isStorageBox = (a) => (a?.name || "").includes("ארגז");
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() =>
                        setSelectedAddons((prev) => {
                          const turningOn = !prev[addon.id];
                          const next = { ...prev };
                          if (turningOn && isStorageBox(addon)) {
                            applicableAddons.forEach((a) => {
                              if (a.id !== addon.id && isStorageBox(a)) {
                                delete next[a.id];
                              }
                            });
                          }
                          if (turningOn) next[addon.id] = true;
                          else delete next[addon.id];
                          return next;
                        })
                      }
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-right ${
                        checked
                          ? "border-primary/60 bg-primary/[0.06] ring-1 ring-primary/20"
                          : "border-white/[0.08] glass hover:border-white/[0.15]"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-colors ${
                        checked ? "bg-primary text-primary-foreground" : "border border-white/20"
                      }`}>
                        {checked && <Plus className="w-3 h-3 rotate-45" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary/70" />
                          <span className="font-medium text-foreground text-sm">{addon.name}</span>
                        </div>
                        {addon.description && (
                          <p className="text-xs text-foreground/55 mt-1 line-clamp-2">{addon.description}</p>
                        )}
                      </div>
                      <span className="text-primary font-semibold text-sm shrink-0">
                        {price > 0 ? `+₪${Number(price).toLocaleString()}` : "חינם"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Live total (product + addons) */}
            {(() => {
              const perUnit =
                pricing.finalPrice +
                applicableAddons.reduce(
                  (sum, a) => sum + (selectedAddons[a.id] ? priceForAddon(a, selectedVariation) : 0),
                  0
                );
              const total = perUnit * quantity;
              return (
                <div className="mb-4 flex items-baseline justify-between pt-3 border-t border-foreground/10">
                  <span className="text-sm text-foreground/60 font-light">סה״כ לתשלום</span>
                  <span className="text-2xl font-semibold text-primary">
                    ₪{total.toLocaleString()}
                  </span>
                </div>
              );
            })()}

            {/* Add to Cart / Go to Checkout */}
            {!addedToCart ? (
              <div ref={ctaRef} className="space-y-2 mb-5">
                <Button size="lg" onClick={handleAddToCart} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-xl gap-2 glow-gold">
                  <ShoppingCart className="w-5 h-5" />
                  הוסף לעגלה
                </Button>

              </div>
            ) : (
              <div ref={ctaRef} className="space-y-2 mb-5">
                <Button size="lg" onClick={() => navigate("/Checkout")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-xl gap-2 shadow-lg shadow-emerald-600/20">
                  <ArrowLeft className="w-5 h-5" />
                  מעבר לתשלום
                </Button>
                <button onClick={() => setAddedToCart(false)} className="w-full text-center text-sm text-foreground/40 hover:text-foreground/60 transition-colors py-1">
                  המשך בקניות
                </button>
              </div>
            )}

            {/* Trust Signals — placed below the CTA, single row,
                not duplicated with anything above. */}
            <div className={`grid ${product.has_trial_period ? "grid-cols-3" : "grid-cols-2"} gap-3 mb-5`}>
              <div className="glass rounded-xl p-3 text-center">
                <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="text-xs text-foreground/70">אחריות {product.warranty_years ?? 10} שנים</span>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="text-xs text-foreground/70">משלוח עד הבית</span>
              </div>
              {product.has_trial_period && (
                <div className="glass rounded-xl p-3 text-center">
                  <RotateCcw className="w-5 h-5 text-primary mx-auto mb-1" />
                  <span className="text-xs text-foreground/70">30 לילות ניסיון</span>
                </div>
              )}
            </div>

            {/* Phone + custom sizes */}
            <div className="text-center space-y-2">
              <a href="tel:1700700464" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" /> 1700-700-464
              </a>
              <p className="text-xs text-muted-foreground/40">למידות מיוחדות צרו קשר עם מחלקת מכירות</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SECTION 2: Divider ===== */}
      <SectionDivider />

      {/* ===== USP Cards ===== */}
      <FadeInSection>
        <div className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "30 לילות ניסיון ללא ניילון",
                  desc: "לא מתאים? איסוף חינם על חשבוננו.",
                  icon: (
                    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                      <path d="M34 12c-1.2-1-2.6-1.5-4-1.7A14 14 0 0018 24a14 14 0 0016 13.9c-1.4-.3-2.8-.9-4-1.7A11 11 0 0120 24a11 11 0 0114-10.6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="38" cy="16" r="5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M38 13v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M24 42c-2 0-4-1.5-4-3.5s2-3.5 4-3.5c.8 0 1.6.2 2.2.7A5 5 0 0138 38a3.5 3.5 0 010 7H24z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  ),
                },
                {
                  title: "40 שנה של ייצור ישראלי",
                  desc: "כשאתם קונים קינג דיוויד — אתם תומכים בכלכלה הישראלית ובעובדים ישראליים.",
                  icon: (
                    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                      <circle cx="24" cy="20" r="12" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="24" cy="20" r="7" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M24 15l1.5 3 3.5.5-2.5 2.5.6 3.5L24 22.5l-3.1 2 .6-3.5-2.5-2.5 3.5-.5L24 15z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                      <path d="M17 36l3-6 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M31 36l-3-6-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                },
                {
                  title: "למעלה מ-100 דגמים",
                  desc: "\"לכל אחד יש הקינג דיוויד שלו\" — המגוון הכי רחב בישראל.",
                  icon: (
                    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                      <rect x="8" y="28" width="32" height="8" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="10" y="20" width="28" height="8" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="12" y="12" width="24" height="8" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M18 15c0 1.5 1.5 3 3 3s3-1.5 3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M26 15c0 1.5 1.5 3 3 3s3-1.5 3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M8 40h32" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 3" opacity="0.4"/>
                    </svg>
                  ),
                },
                {
                  title: "20 שנות אחריות מלאה",
                  desc: "\"אנחנו נותנים לכם גב!\" — האחריות הכי ארוכה בשוק הישראלי.",
                  icon: (
                    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                      <path d="M24 6l14 5v10c0 10-6 16-14 19C16 37 10 31 10 21V11l14-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M18 22l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                },
              ]
                .filter((item) => !(item.title?.includes("ניסיון") && !product.has_trial_period))
                .map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="glass-card rounded-2xl p-6 text-center border border-primary/10"
                >
                  <div className="w-12 h-12 mx-auto mb-4 text-foreground">{item.icon}</div>
                  <h3 className="font-bold text-primary text-base mb-2">{item.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* (Section 3 moved up next to the price/hero; description now lives
           directly under the sale banner in the product info column.) */}

      {/* ===== SECTION 4: Divider + Features ===== */}
      {product.features?.length > 0 && (
        <>
          <SectionDivider />
          <FadeInSection>
            <div className="py-16 md:py-20">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl font-bold text-foreground mb-8 text-center">תכונות המוצר</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {product.features.map((f, i) => {
                    const total = product.features.length;
                    const cols = 3;
                    const lastRowCount = total % cols || cols;
                    const isLastRow = i >= total - lastRowCount;
                    const isAloneInRow = lastRowCount === 1 && isLastRow;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        className={`glass-card rounded-2xl p-6 text-center border border-primary/10 hover:border-primary/20 transition-all ${isAloneInRow ? "lg:col-start-2" : ""}`}
                      >
                        <div className="w-10 h-10 mx-auto mb-4 text-primary">
                          {featureIcons[i % featureIcons.length]}
                        </div>
                        <p className="text-foreground/80 text-sm leading-relaxed">{f}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </FadeInSection>
        </>
      )}

      {/* ===== SECTION 5: Divider + Specs Strip ===== */}
      {(() => {
        const specs = [];
        if (product.height_cm) {
          specs.push({
            label: "גובה המזרן",
            value: `כ-${product.height_cm} ס"מ`,
            icon: (
              <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                <rect x="16" y="8" width="16" height="32" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M24 12v24" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.4"/>
                <path d="M10 14h4M10 34h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 14v20" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M34 20h4M34 28h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
              </svg>
            ),
          });
        }
        if (product.hardness) {
          specs.push({
            label: "דרגת קשיחות",
            value: `${product.hardness > 6 ? "קשיח" : product.hardness > 4 ? "חצי-קשיח" : "רך"} (${product.hardness}/10)`,
            icon: (
              <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                <rect x="8" y="20" width="32" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M14 24c0 3 2.5 6 5 6s5-3 5-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M26 24c0 3 2.5 6 5 6s5-3 5-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="36" cy="12" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <text x="36" y="15" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="700">?</text>
              </svg>
            ),
          });
        }
        specs.push({
          label: "סוג בד",
          value: "כותנה איכותי",
          icon: (
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
              <rect x="10" y="10" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M16 16v16M22 14v20M28 16v16M34 18v12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
              <path d="M14 38c2-3 4-4 6-4s4 1 6 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M26 38c2-3 4-4 6-4s4 1 4 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          ),
        });
        if (product.warranty_years) {
          specs.push({
            label: "אחריות",
            value: `${product.warranty_years} שנים`,
            icon: (
              <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                <path d="M24 6l16 6v12c0 10-8 16-16 18C16 40 8 34 8 24V12l16-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ),
          });
        }
        // Pick column count & container width based on number of specs so a
        // single/partial set doesn't leave huge empty gaps in the grid.
        const gridByCount = {
          1: "sm:grid-cols-1 max-w-xs",
          2: "sm:grid-cols-2 max-w-xl",
          3: "sm:grid-cols-3 max-w-4xl",
          4: "sm:grid-cols-2 lg:grid-cols-4 max-w-5xl",
        };
        const gridClass = gridByCount[specs.length] || "sm:grid-cols-3 max-w-4xl";
        return (
          <>
            <SectionDivider />
            <FadeInSection>
              <div className="py-16 md:py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                  <h2 className="text-2xl font-bold text-foreground mb-8 text-center">פרטי מוצר</h2>
                  <div className={`grid grid-cols-1 ${gridClass} gap-4 mx-auto`}>
                    {specs.map((spec, i) => (
                      <div
                        key={i}
                        className="glass rounded-2xl p-5 text-center group hover:border-primary/20 transition-all"
                      >
                        <div className="w-12 h-12 mx-auto mb-3 text-primary">{spec.icon}</div>
                        <p className="text-xs text-muted-foreground mb-1">{spec.label}</p>
                        <p className="font-bold text-foreground">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeInSection>
          </>
        );
      })()}

      {/* ===== SECTION 6: Technologies ===== */}
      {product.technologies?.length > 0 && (
        <>
          <SectionDivider />
          <FadeInSection>
            <div className="py-16 md:py-20">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl font-bold text-foreground mb-8 text-center">טכנולוגיות ומערכות</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.technologies.map((tech, i) => {
                    const techName = typeof tech === "string" ? tech : tech.name;
                    const techDesc = typeof tech !== "string" ? tech.description : null;
                    // Pick icon based on tech name keywords
                    const iconSvg = techName.includes("Visco") || techName.includes("ויסקו") ? (
                      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><path d="M20 6c-8 0-14 6-14 14s6 14 14 14 14-6 14-14S28 6 20 6z" stroke="currentColor" strokeWidth="1.3"/><path d="M14 20c0 4 3 6 6 6s6-2 6-6-3-6-6-6-6 2-6 6z" stroke="currentColor" strokeWidth="1.3"/><path d="M20 14v-4M20 30v-4M26 20h4M14 20h-4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/></svg>
                    ) : techName.includes("FLIP") || techName.includes("ONE") ? (
                      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><rect x="6" y="14" width="28" height="14" rx="3" stroke="currentColor" strokeWidth="1.3"/><path d="M12 14V8M28 14V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M12 8h16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M20 5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M17 32l3-4 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="20" y1="28" x2="20" y2="34" stroke="currentColor" strokeWidth="1.2"/></svg>
                    ) : techName.includes("Comfort") || techName.includes("Zone") || techName.includes("5D") ? (
                      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><rect x="4" y="22" width="32" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 22v8M14 22v8M20 22v8M26 22v8M32 22v8" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.4"/><path d="M8 20c2-6 4-8 6-8s4 1 6 4c2 3 4 4 6 4s4-1 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="10" cy="16" r="1" fill="currentColor"/><circle cx="20" cy="12" r="1" fill="currentColor"/><circle cx="30" cy="16" r="1" fill="currentColor"/></svg>
                    ) : techName.includes("Balance") || techName.includes("איזון") ? (
                      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><path d="M20 6v28" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8 14h24" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8 14l-2 10h12l-2-10" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M24 14l-2 10h12l-2-10" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M16 36h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    ) : techName.includes("Circu") || techName.includes("Flow") || techName.includes("סירקו") ? (
                      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.3"/><path d="M20 10a10 10 0 017.07 2.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M30 20a10 10 0 01-2.93 7.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20 30a10 10 0 01-7.07-2.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 20a10 10 0 012.93-7.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="1.2"/></svg>
                    ) : techName.includes("POCKET") || techName.includes("קפיצ") ? (
                      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><path d="M10 30c0-6 2-10 4-10s4 4 4 10" stroke="currentColor" strokeWidth="1.3"/><path d="M18 30c0-6 2-10 4-10s4 4 4 10" stroke="currentColor" strokeWidth="1.3"/><path d="M26 30c0-6 2-10 4-10s4 4 4 10" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="30" width="28" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="8" width="28" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
                    ) : (
                      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full"><circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.3"/><path d="M20 10v6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="20" cy="20" r="2" fill="currentColor"/></svg>
                    );
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.06 }}
                        className="flex items-center gap-4 glass rounded-xl p-4 hover:border-primary/20 transition-all"
                      >
                        <div className="w-10 h-10 text-primary shrink-0">{iconSvg}</div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-sm">{techName}</p>
                          {techDesc && <p className="text-xs text-foreground/50 mt-0.5">{techDesc}</p>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </FadeInSection>
        </>
      )}

      {/* ===== SECTION 7: Materials ===== */}
      <SectionDivider />
      <FadeInSection>
        <div className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">בד וחומרים</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { text: "בד כותנה איכותי", icon: <svg viewBox="0 0 36 36" fill="none" className="w-full h-full"><rect x="6" y="6" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.3"/><path d="M12 12v12M18 10v16M24 12v12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/><path d="M10 30c3-2 5-3 8-3s5 1 8 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
                { text: "אנטי-בקטריאלי והיפואלרגני", icon: <svg viewBox="0 0 36 36" fill="none" className="w-full h-full"><path d="M18 4l10 4v8c0 8-5 12-10 14C13 28 8 24 8 16V8l10-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M14 18l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                { text: "נשימה טובה ומניעת הזעה", icon: <svg viewBox="0 0 36 36" fill="none" className="w-full h-full"><path d="M18 4c-2 4-6 6-6 12a6 6 0 0012 0c0-6-4-8-6-12z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M10 26c2 4 5 6 8 6s6-2 8-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M14 20c0 2 2 3 4 3s4-1 4-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/></svg> },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 glass rounded-xl p-4 hover:border-primary/20 transition-all">
                  <div className="w-9 h-9 text-primary shrink-0">{item.icon}</div>
                  <span className="text-sm text-foreground/80">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Support Zones */}
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center mt-16">אזורי תמיכה</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { text: "תמיכת קצה משופרת", icon: <svg viewBox="0 0 36 36" fill="none" className="w-full h-full"><rect x="4" y="14" width="28" height="10" rx="3" stroke="currentColor" strokeWidth="1.3"/><path d="M8 14v10M28 14v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 28h28" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/></svg> },
                { text: "פיזור משקל ולחץ אופטימלי", icon: <svg viewBox="0 0 36 36" fill="none" className="w-full h-full"><rect x="4" y="20" width="28" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 18v-4M14 16v-4M22 16v-4M28 18v-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="12" r="1.5" fill="currentColor" opacity="0.6"/><circle cx="14" cy="10" r="1.5" fill="currentColor" opacity="0.6"/><circle cx="22" cy="10" r="1.5" fill="currentColor" opacity="0.6"/><circle cx="28" cy="12" r="1.5" fill="currentColor" opacity="0.6"/></svg> },
                { text: "תמיכה אנטומית מותאמת", icon: <svg viewBox="0 0 36 36" fill="none" className="w-full h-full"><path d="M8 28c2-10 4-16 6-16s4 3 4 8c0-5 2-8 4-8s4 6 6 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="4" y="28" width="28" height="4" rx="2" stroke="currentColor" strokeWidth="1.3"/></svg> },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 glass rounded-xl p-4 hover:border-primary/20 transition-all">
                  <div className="w-9 h-9 text-primary shrink-0">{item.icon}</div>
                  <span className="text-sm text-foreground/80">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* ===== SECTION 9: Shipping Info ===== */}
      <SectionDivider />
      <FadeInSection>
        <div className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">משלוחים ואספקה</h2>
            <div className={`grid grid-cols-1 ${product.has_trial_period ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-5 mb-10`}>
              <div className="glass-card rounded-2xl p-6 text-center border border-primary/10">
                <Truck className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-bold text-foreground mb-1">זמני אספקה</p>
                <p className="text-sm text-foreground/60">מזרנים: עד 14 ימי עסקים</p>
                <p className="text-sm text-foreground/60">מיטות: עד 30 ימי עסקים</p>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center border border-primary/10">
                <Package className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-bold text-foreground mb-1">עלויות משלוח</p>
                <p className="text-sm text-foreground/60">מזרן: 250 ₪</p>
                <p className="text-sm text-foreground/60">מיטות כולל הרכבה: 500 ₪</p>
              </div>
              {product.has_trial_period && (
                <div className="glass-card rounded-2xl p-6 text-center border border-primary/10">
                  <RotateCcw className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="font-bold text-foreground mb-1">30 לילות ניסיון</p>
                  <p className="text-sm text-foreground/60">לא מרוצים? החזרה בחינם על חשבוננו!</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 text-foreground/70">
              <Truck className="w-5 h-5 text-primary" />
              <span className="text-sm">תאריך אספקה משוער: <strong className="text-foreground">{getEstimatedDelivery()}</strong></span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-foreground/50">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>איסוף עצמי זמין בתיאום מראש ממפעל החברה בקרית מלאכי, רח׳ העמל 6</span>
              </div>
              <p className="text-xs text-muted-foreground/40">*לפרטים המלאים ראו את תנאי המשלוח המפורטים</p>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* ===== SECTION 7.5: 30 Nights Trial Banner — only when product
           opts in to the trial program via CRM has_trial_period flag ===== */}
      {product.has_trial_period && (
      <>
      <SectionDivider />
      <FadeInSection>
        <div className="relative overflow-hidden rounded-3xl mx-4 sm:mx-8 lg:mx-16" style={{ background: "linear-gradient(160deg, #0d2018 0%, #0a1a10 40%, #0f2a1a 100%)", minHeight: "520px" }}>

          {/* Ambient glow center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div style={{ width: "600px", height: "400px", background: "radial-gradient(ellipse, rgba(184,151,42,0.18) 0%, transparent 70%)", borderRadius: "50%" }} />
          </div>

          {/* Sunburst — top left large */}
          <div className="absolute top-0 left-0 w-72 h-72 opacity-25" style={{ transform: "translate(-35%, -35%)" }}>
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              {Array.from({ length: 32 }).map((_, i) => (
                <line key={i} x1="100" y1="100" x2={100 + 96 * Math.cos((i * Math.PI * 2) / 32)} y2={100 + 96 * Math.sin((i * Math.PI * 2) / 32)} stroke="#b8972a" strokeWidth="1" />
              ))}
              <circle cx="100" cy="100" r="8" fill="#b8972a" opacity="0.8" />
            </svg>
          </div>

          {/* Sunburst — bottom right large */}
          <div className="absolute bottom-0 right-0 w-80 h-80 opacity-25" style={{ transform: "translate(35%, 35%)" }}>
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              {Array.from({ length: 32 }).map((_, i) => (
                <line key={i} x1="100" y1="100" x2={100 + 96 * Math.cos((i * Math.PI * 2) / 32)} y2={100 + 96 * Math.sin((i * Math.PI * 2) / 32)} stroke="#b8972a" strokeWidth="1" />
              ))}
              <circle cx="100" cy="100" r="8" fill="#b8972a" opacity="0.8" />
            </svg>
          </div>

          {/* Sunburst — top right small */}
          <div className="absolute top-8 right-16 w-32 h-32 opacity-20">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={i} x1="100" y1="100" x2={100 + 90 * Math.cos((i * Math.PI * 2) / 20)} y2={100 + 90 * Math.sin((i * Math.PI * 2) / 20)} stroke="#b8972a" strokeWidth="1.5" />
              ))}
            </svg>
          </div>

          {/* Sunburst — bottom left small */}
          <div className="absolute bottom-8 left-16 w-28 h-28 opacity-20">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={i} x1="100" y1="100" x2={100 + 90 * Math.cos((i * Math.PI * 2) / 20)} y2={100 + 90 * Math.sin((i * Math.PI * 2) / 20)} stroke="#b8972a" strokeWidth="1.5" />
              ))}
            </svg>
          </div>

          {/* Horizontal gold divider lines */}
          <div className="absolute left-0 right-0" style={{ top: "38%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(184,151,42,0.3), rgba(184,151,42,0.3), transparent)" }} />
          <div className="absolute left-0 right-0" style={{ top: "62%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(184,151,42,0.3), rgba(184,151,42,0.3), transparent)" }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16 md:py-20">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-[#b8972a]/60 text-[#b8972a] text-sm font-bold px-6 py-2.5 rounded-full mb-8 tracking-widest uppercase" style={{ background: "rgba(184,151,42,0.08)" }}>
              <span>✦</span>
              <span>לילות ניסיון ללא ניילון</span>
              <span>✦</span>
            </div>

            {/* Big dramatic number */}
            <div
              className="font-bold leading-none mb-6 select-none"
              style={{
                fontFamily: "var(--font-sans-hebrew)",
                fontSize: "clamp(8rem, 20vw, 16rem)",
                color: "transparent",
                backgroundImage: "linear-gradient(180deg, #e8c84a 0%, #b8972a 40%, #8a6e1a 80%, #b8972a 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                textShadow: "none",
                filter: "drop-shadow(0 0 40px rgba(184,151,42,0.5)) drop-shadow(0 0 80px rgba(184,151,42,0.2))",
                lineHeight: 1.1,
              }}
            >
              30
            </div>

            {/* Main text */}
            <p className="text-white text-2xl md:text-4xl font-bold mb-4 leading-snug" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
              מנסים את המזרון במשך 30 לילות ללא ניילון
            </p>

            {/* Sub text */}
            <p className="text-white/60 text-base md:text-lg max-w-lg">
              לא מרוצים? מקבלים את הכסף חזרה ואיסוף בחינם על חשבוננו
            </p>

            {/* Gold dots separator */}
            <div className="flex items-center gap-3 mt-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#b8972a]/40" />
              <div className="w-2 h-2 rounded-full bg-[#b8972a]/70" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#b8972a]/40" />
            </div>
          </div>
        </div>
      </FadeInSection>
      </>
      )}

      {/* ===== SECTION 8: Reviews Carousel ===== */}
      <SectionDivider />
      <FadeInSection>
        <div className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ProductReviewsCarousel />
          </div>
        </div>
      </FadeInSection>

      {/* ===== SECTION 11: Sleep Advisor CTA banner ===== */}
      <SectionDivider />
      <FadeInSection>
        <div className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="relative rounded-3xl overflow-hidden border border-primary/15 bg-gradient-to-l from-primary/[0.08] via-primary/[0.03] to-transparent">
              <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
                {/* Image side (LTR end in RTL layout = visually left) */}
                <div className="relative min-h-[240px] md:min-h-[360px] order-last md:order-first">
                  <img
                    src="https://images.unsplash.com/photo-1616627561950-9f746e330187?w=1000&q=80"
                    alt="שינה נינוחה"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Soft gradient so the right side blends into the content panel */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent md:bg-gradient-to-l md:from-background md:via-background/30 md:to-transparent" />
                </div>

                {/* Content side (visual right / RTL start) */}
                <div className="p-8 md:p-12 flex flex-col justify-center gap-5">
                  <p className="text-[11px] tracking-[0.35em] text-primary/80 uppercase font-light">
                    ייעוץ שינה אישי
                  </p>
                  <h3 className="text-2xl md:text-[28px] font-bold text-foreground leading-snug">
                    בואו נמצא יחד את פתרון השינה
                    <br className="hidden md:block" />
                    המושלם עבורכם
                  </h3>
                  <p className="text-sm text-foreground/60 leading-relaxed max-w-md">
                    יועצי השינה שלנו כאן כדי לעזור לכם לבחור את המזרן המתאים,
                    לענות על כל שאלה ולהתאים פתרון בדיוק לצרכים שלכם.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 mt-1">
                    <a href="tel:1700700464" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 rounded-full gap-2 glow-gold">
                        <Phone className="w-4 h-4" />
                        להתייעצות עם נציג
                      </Button>
                    </a>
                    <Link to="/FAQ" className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto font-medium px-8 h-12 rounded-full border-primary/25 hover:border-primary/50 text-foreground/80 hover:text-foreground bg-transparent"
                      >
                        לשאלות נפוצות
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-foreground/50 font-light pt-1">
                    <Clock className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                    <span>
                      שעות פעילות המוקד: א׳—ה׳ 09:00—20:00, ו׳ 09:00—13:00
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* ===== SECTION 12: Related Products ===== */}
      {relatedProducts.length > 0 && (
        <>
          <SectionDivider />
          <FadeInSection>
            <div className="py-16 md:py-20">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl font-bold text-foreground mb-8 text-center">מזרנים דומים</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {relatedProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </FadeInSection>
        </>
      )}

      <StickyAddToCart ctaRef={ctaRef} product={product} onAddToCart={handleAddToCart} addedToCart={addedToCart} />
    </div>
  );
}