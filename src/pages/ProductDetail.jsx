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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

// Social share row — brand-coloured circular buttons. Uses window.location
// at click time so the URL is always the current product page.
function ShareButtons({ productName }) {
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const text = productName ? `${productName} - קינג דיויד מזרנים` : "קינג דיויד מזרנים";
  const u = encodeURIComponent(pageUrl);
  const t = encodeURIComponent(text);

  const links = [
    {
      name: "פייסבוק",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      bg: "bg-[#1877F2] hover:bg-[#1668d8]",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "וואטסאפ",
      href: `https://wa.me/?text=${t}%20${u}`,
      bg: "bg-[#25D366] hover:bg-[#1fbd5a]",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
    },
    {
      name: "טלגרם",
      href: `https://t.me/share/url?url=${u}&text=${t}`,
      bg: "bg-[#26A5E4] hover:bg-[#1d94d1]",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005-.002l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
        </svg>
      ),
    },
    {
      name: "טוויטר",
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      bg: "bg-[#1DA1F2] hover:bg-[#1a91da]",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 9.91 9.91 0 01-3.127 1.195 4.924 4.924 0 00-8.38 4.49A13.978 13.978 0 011.64 3.162a4.922 4.922 0 001.524 6.574 4.903 4.903 0 01-2.229-.616v.061a4.924 4.924 0 003.946 4.827 4.935 4.935 0 01-2.224.084 4.927 4.927 0 004.6 3.419A9.876 9.876 0 010 19.54a13.94 13.94 0 007.548 2.212c9.057 0 14.01-7.503 14.01-14.01 0-.213-.005-.425-.014-.636A10.005 10.005 0 0024 4.59l-.047-.02z" />
        </svg>
      ),
    },
    {
      name: "אימייל",
      href: `mailto:?subject=${t}&body=${u}`,
      bg: "bg-[#EA4335] hover:bg-[#d43a2f]",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
          <path d="M1.5 4.5h21A1.5 1.5 0 0124 6v12a1.5 1.5 0 01-1.5 1.5h-21A1.5 1.5 0 010 18V6a1.5 1.5 0 011.5-1.5zm10.5 9.19L2.34 7.01l-.84 1.24L12 15.75l10.5-7.5-.84-1.24L12 13.69z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap" dir="rtl">
      <span className="text-base md:text-lg font-medium text-foreground">
        אהבתם את המוצר? שתף
      </span>
      <div className="flex items-center gap-2.5">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`שתף ב${link.name}`}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 ${link.bg}`}
          >
            {link.icon}
          </a>
        ))}
      </div>
    </div>
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
      <div className="section-band-cream">
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

            {/* Product description + accordion (על המזרן / בתוך המזרן) */}
            {(product.description || product.features?.length > 0 || product.technologies?.length > 0) && (
              <div className="mb-6 pb-5 border-b border-foreground/10 space-y-4">
                {product.description && (
                  <p className="text-sm md:text-[15px] leading-relaxed text-foreground/75 whitespace-pre-line">
                    {product.description}
                  </p>
                )}

                {(product.features?.length > 0 || product.technologies?.length > 0) && (
                  <Accordion type="multiple" className="w-full border-t border-foreground/10 pt-1" dir="rtl">
                    {product.features?.length > 0 && (
                      <AccordionItem value="about" className="border-b border-foreground/10">
                        <AccordionTrigger className="text-sm font-semibold text-foreground py-3 hover:no-underline">
                          על המזרן
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1.5 text-sm text-foreground/75 pr-4 list-disc marker:text-primary/60">
                            {product.features.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {product.technologies?.length > 0 && (
                      <AccordionItem value="inside" className="border-b-0">
                        <AccordionTrigger className="text-sm font-semibold text-foreground py-3 hover:no-underline">
                          בתוך המזרן
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-sm text-foreground/75 pr-4 list-disc marker:text-primary/60">
                            {product.technologies.map((tech, i) => {
                              const name = typeof tech === "string" ? tech : tech.name;
                              const desc = typeof tech !== "string" ? tech.description : null;
                              return (
                                <li key={i}>
                                  <span className="font-medium text-foreground">{name}</span>
                                  {desc && <span className="text-foreground/60"> — {desc}</span>}
                                </li>
                              );
                            })}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                )}
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
      </div>

      {/* ===== SECTION 2: Divider ===== */}
      <SectionDivider />

      {/* ===== USP Cards ===== */}
      <FadeInSection>
        <div className="section-band-peach-soft py-16 md:py-20">
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

      {/* ===== SECTION 9: Shipping Info ===== */}
      <SectionDivider />
      <FadeInSection>
        <div className="section-band-shipping py-16 md:py-20">
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
        <div className="section-band-gold-glow py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ProductReviewsCarousel />
          </div>
        </div>
      </FadeInSection>

      {/* ===== SECTION 11: Sleep Advisor CTA banner ===== */}
      <SectionDivider />
      <FadeInSection>
        <div className="section-band-beige py-16 md:py-20">
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
            <div className="section-band-peach py-16 md:py-20">
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

      {/* ===== SECTION 13: Share ===== */}
      <SectionDivider />
      <FadeInSection>
        <div className="section-band-cream-warm py-10 md:py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ShareButtons productName={product?.name} />
          </div>
        </div>
      </FadeInSection>

      <StickyAddToCart ctaRef={ctaRef} product={product} onAddToCart={handleAddToCart} addedToCart={addedToCart} />
    </div>
  );
}