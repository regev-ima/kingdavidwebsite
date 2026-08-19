// Supabase-backed shim that preserves the previous base44 API surface
// (`base44.entities.X.list/filter/create`) so existing components don't
// need to change.
//
// IMPORTANT: the kcrm CRM has a security layer that blocks direct table
// access from the anon key. The website therefore calls two dedicated
// SECURITY DEFINER functions on the CRM:
//
//   website_get_products()  -> returns products joined with their variations
//   website_create_order(order_data jsonb) -> inserts a new order with
//                                             source='website'
//
// Keep these function signatures in sync with the SQL in
// supabase/schema.sql (reference doc).

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fallbackProducts } from '@/data/fallbackProducts';
import { withVat, VAT_APPLIES_TO_SHIPPING } from '@/lib/vat';

// ---------------------------------------------------------------------
// Transformers — CRM shape -> UI shape
// ---------------------------------------------------------------------

function dimsToSize(v) {
  if (v.name && /\d/.test(v.name)) return v.name;
  if (v.width_cm && v.length_cm) return `${v.width_cm}x${v.length_cm}`;
  // Don't fall back to SKU — internal codes like "MP140190" should never
  // appear in the size dropdown. Returning null here lets the UI decide
  // whether to show the selector at all.
  return v.name || null;
}

function splitFeatures(text) {
  if (!text) return [];
  if (Array.isArray(text)) return text;
  return String(text)
    .split(/\r?\n|·|•|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Map kcrm's (category, bed_type) to the Hebrew category names the
// storefront tabs use ("מזרנים זוגיים", "מזרני יחיד", "מיטות זוגיות",
// "מיטות יהודיות", "מיטות מעוצבות"). Falls back to the raw CRM value
// when we can't infer a match.
function mapCategoryToHebrew(rawCategory, rawBedType) {
  const cat = (rawCategory || '').toString().trim().toLowerCase();
  const type = (rawBedType || '').toString().trim().toLowerCase();

  if (
    cat === 'mattress' ||
    cat === 'מזרן' ||
    cat === 'מזרנים' ||
    cat === 'מזרון' ||
    cat === 'מזרונים'
  ) {
    if (type === 'single' || type === 'יחיד') return 'מזרני יחיד';
    if (type === 'double' || type === 'זוגי') return 'מזרנים זוגיים';
    return 'מזרנים';
  }

  if (cat === 'bed' || cat === 'מיטה' || cat === 'מיטות') {
    if (type === 'single' || type === 'יחיד') return 'מיטות יחיד';
    if (type === 'double' || type === 'זוגי') return 'מיטות זוגיות';
    if (type === 'jewish' || type === 'yehudit' || type === 'יהודית')
      return 'מיטות יהודיות';
    if (type === 'designed' || type === 'designer' || type === 'מעוצבת')
      return 'מיטות מעוצבות';
    return 'מיטות';
  }

  return rawCategory || null;
}

// Apply a product-level sale (percentage or amount off each variation's
// base_price). Returns variations with the possibly-updated final_price.
function applyProductSale(variations, row, now) {
  const startsAt = row.sale_starts_at ? new Date(row.sale_starts_at).getTime() : 0;
  const endsAt = row.sale_ends_at ? new Date(row.sale_ends_at).getTime() : Infinity;
  const saleActive =
    row.is_on_sale === true &&
    now >= startsAt &&
    now <= endsAt &&
    row.discount_type &&
    Number(row.discount_value) > 0;
  if (!saleActive) return { variations, saleActive: false };

  const value = Number(row.discount_value);
  const adjusted = variations.map((v) => {
    const base = Number(v.base_price ?? v.final_price ?? 0);
    let newFinal = base;
    if (row.discount_type === 'percentage') {
      newFinal = Math.round(base * (1 - value / 100));
    } else if (row.discount_type === 'amount') {
      newFinal = Math.max(0, Math.round(base - value));
    }
    return { ...v, final_price: newFinal, _sale_applied: true };
  });
  return { variations: adjusted, saleActive: true };
}

function transformProduct(row) {
  let variations = (row.variations || []).filter((v) => v.is_active !== false);
  variations.sort((a, b) => {
    const aw = a.width_cm || 0;
    const bw = b.width_cm || 0;
    if (aw !== bw) return aw - bw;
    return (a.length_cm || 0) - (b.length_cm || 0);
  });

  // The CRM prices its catalogue NET. Gross every variation up here —
  // before any sale maths — so a price is VAT-inclusive from the moment
  // it enters the app, and so the shim and src/lib/pricing.js (which
  // re-derives the same sale in the UI) work off identical numbers.
  variations = variations.map((v) => ({
    ...v,
    base_price: withVat(v.base_price, v.vat_percent),
    final_price: withVat(v.final_price, v.vat_percent),
  }));

  // A ₪ discount is entered as the amount off the customer's price, so it is
  // subtracted from the grossed-up figures as-is. It used to be grossed up
  // first, on the assumption that it was stored net like base_price — which
  // turned "₪500 off" in the catalogue into ₪590 off at the till. A percentage
  // never needed converting: a share of a gross price is already gross.
  const pricedRow = row;

  // Apply product-level sale, if any. This replaces each variation's
  // final_price with the discounted value so the rest of the UI keeps
  // using its existing base_price / final_price shape.
  const { variations: saleVariations, saleActive } = applyProductSale(
    variations,
    pricedRow,
    Date.now()
  );
  variations = saleVariations;

  const finalPrices = variations.map((v) => Number(v.final_price ?? v.base_price ?? 0)).filter(Boolean);
  const basePrices = variations.map((v) => Number(v.base_price ?? v.final_price ?? 0)).filter(Boolean);

  const defaultVariation =
    variations.find((v) => v.id === row.default_variation_id) || variations[0] || null;

  const minFinal = finalPrices.length ? Math.min(...finalPrices) : null;

  const hasVariationLevelSale = variations.some(
    (v) =>
      v.final_price != null &&
      v.base_price != null &&
      Number(v.final_price) < Number(v.base_price)
  );
  const isOnSale = saleActive || hasVariationLevelSale;

  // Categories: website_categories[] wins if set; otherwise fall back to
  // a sensible default derived from category + bed_type.
  const fromCrm = Array.isArray(row.website_categories)
    ? row.website_categories.filter(Boolean)
    : [];
  const fallback = mapCategoryToHebrew(row.category, row.bed_type);
  const categories = fromCrm.length > 0 ? fromCrm : (fallback ? [fallback] : []);

  return {
    ...row,
    price: defaultVariation
      ? Number(defaultVariation.base_price ?? defaultVariation.final_price ?? 0)
      : (basePrices.length ? Math.max(...basePrices) : null),
    sale_price: isOnSale && defaultVariation
      ? Number(defaultVariation.final_price ?? defaultVariation.base_price ?? 0)
      : null,
    price_from: minFinal,
    available_sizes: variations.map(dimsToSize).filter(Boolean),
    is_on_sale: isOnSale,
    is_featured: row.is_active !== false,
    features: splitFeatures(row.features),
    variations,
    // New: array of Hebrew tab labels this product appears under.
    // Shop.jsx reads this first, falls back to `category` (below).
    categories,
    // `category` is the first of the categories — kept for components
    // that still read the singular field (e.g. ProductCard label).
    category: categories[0] || row.category,
    category_raw: row.category,
    bed_type_raw: row.bed_type,
    sale_ends_at: row.sale_ends_at || null,
    // Passed through as entered. pricing.js recomputes the same sale in the
    // UI and subtracts this from the gross base_price, so the two paths agree
    // only while both treat it as an amount off the customer's price.
    discount_value: row.discount_value,
  };
}

// ---------------------------------------------------------------------
// Cached single RPC — we fetch all products once and derive filters
// locally. The CRM does not expose the products table directly to anon.
// ---------------------------------------------------------------------

let productsCachePromise = null;

async function loadAllProducts() {
  if (!isSupabaseConfigured) {
    return fallbackProducts.map((p) => ({ ...p, variations: [] }));
  }
  if (!productsCachePromise) {
    productsCachePromise = (async () => {
      const { data, error } = await supabase.rpc('website_get_products');
      if (error) {
        console.error('[base44Client shim] website_get_products failed:', error.message);
        productsCachePromise = null; // allow retry later
        return fallbackProducts.map((p) => ({ ...p, variations: [] }));
      }
      return (data || []).map(transformProduct);
    })();
  }
  return productsCachePromise;
}

// ---------------------------------------------------------------------
// Addons cache (product_addons + product_addon_prices)
// ---------------------------------------------------------------------

let addonsCachePromise = null;

async function loadAllAddons() {
  if (!isSupabaseConfigured) return [];
  if (!addonsCachePromise) {
    addonsCachePromise = (async () => {
      const { data, error } = await supabase.rpc('website_get_addons');
      if (error) {
        console.error('[base44Client shim] website_get_addons failed:', error.message);
        addonsCachePromise = null;
        return [];
      }
      return (data || []).map((row) => ({
        ...row,
        // VAT-inclusive, like every other price the storefront shows.
        // priceForAddon() below grosses up the per-size overrides too.
        effective_base_price: withVat(
          Number(row.final_price ?? row.base_price ?? 0),
          row.vat_percent
        ),
      }));
    })();
  }
  return addonsCachePromise;
}

/**
 * Resolve the price a single addon charges for the currently selected variation.
 * Priority:
 *   1. product_addon_prices (variation_prices map, by variation.id)
 *   2. size_prices — a per-size override
 *   3. addon.final_price
 *   4. addon.base_price
 *
 * Every one of those sources is a net CRM price, so the result is
 * grossed up here — this is the only path the UI uses to price an addon.
 */
function sizePriceFor(sizePrices, variation) {
  if (!sizePrices || !variation) return null;

  // What the CRM actually writes: a list of {width_cm, length_cm, price} rows,
  // matched on both dimensions. This was previously read as an object keyed by
  // size, which an array can never satisfy — every lookup came back undefined
  // and the price silently fell through to the addon's base, so a per-size
  // override entered in the catalogue was never charged.
  if (Array.isArray(sizePrices)) {
    const hit = sizePrices.find(
      (sp) =>
        Number(sp?.width_cm) === Number(variation.width_cm) &&
        Number(sp?.length_cm) === Number(variation.length_cm)
    );
    return hit?.price ?? null;
  }

  // Older rows stored it as an object keyed by variation id, size name, or
  // "160x200". Still honoured so nothing that already worked stops working.
  if (typeof sizePrices === 'object') {
    const byId = variation.id ? sizePrices[variation.id] : undefined;
    const byName = variation.name ? sizePrices[variation.name] : undefined;
    const byDims =
      variation.width_cm && variation.length_cm
        ? sizePrices[`${variation.width_cm}x${variation.length_cm}`]
        : undefined;
    return byId ?? byName ?? byDims ?? null;
  }
  return null;
}

export function priceForAddon(addon, variation) {
  if (!addon) return 0;
  const gross = (net) => withVat(Number(net), addon.vat_percent);
  if (variation?.id && addon.variation_prices && addon.variation_prices[variation.id] != null) {
    return gross(addon.variation_prices[variation.id]);
  }
  const sized = sizePriceFor(addon.size_prices, variation);
  if (sized != null) return gross(sized);
  return gross(addon.final_price ?? addon.base_price ?? 0);
}

// The CRM and the storefront label categories differently. The CRM tags an
// addon with a broad category ('bed' / 'מיטה' / 'מיטות'), while a product on
// the website carries the narrow storefront tab it belongs to
// ('מיטות יהודיות', 'מיטות זוגיות', ...). An exact string compare between the
// two never matches, which is why bed addons ("הפרדה יהודית", "ארגז מצעים")
// never reached a bed's product page.
//
// Both sides are therefore reduced to a family — 'bed' or 'mattress' — and a
// broad tag matches every product in its family. Narrow tags still have to
// match the product exactly, so "מיטות יהודיות" won't pull an addon onto a
// designer bed.

function normalizeLabel(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

const BED_WORDS = ['bed', 'beds', 'מיטה', 'מיטות', 'מיטת'];
const MATTRESS_WORDS = ['mattress', 'mattresses', 'מזרן', 'מזרון', 'מזרנים', 'מזרונים', 'מזרני'];

/** 'bed' | 'mattress' | null — the family a category label belongs to. */
function categoryFamily(label) {
  const n = normalizeLabel(label);
  if (!n) return null;
  const words = n.split(' ');
  if (words.some((w) => BED_WORDS.includes(w))) return 'bed';
  if (words.some((w) => MATTRESS_WORDS.includes(w))) return 'mattress';
  return null;
}

/**
 * True when a label names a whole family rather than one storefront tab —
 * 'bed', 'מיטות', 'מיטה'. Those are the values the CRM tags addons with.
 */
function isBroadCategory(label) {
  const n = normalizeLabel(label);
  return Boolean(n) && (BED_WORDS.includes(n) || MATTRESS_WORDS.includes(n));
}

/**
 * Coerce applicable_categories into a plain list of labels.
 * Returns null when the addon declares no restriction at all — that is
 * different from declaring a restriction that resolves to nothing.
 */
function toCategoryList(value) {
  if (value == null) return null; // no restrictions declared
  let v = value;
  // The column is jsonb, but a text column holding JSON arrives as a string.
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        v = JSON.parse(trimmed);
      } catch {
        // Not JSON — treat it as a comma-separated label list.
        return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else {
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    if (keys.length === 0) return null;
    // { "מיטות": true, "מזרנים": false } -> only the enabled keys. An
    // all-false object is a real restriction, so it stays an empty list.
    return keys.filter((k) => k && v[k] !== false && v[k] !== null);
  }
  return [String(v)].filter(Boolean);
}

/**
 * Filter addons that apply to the given product.
 * Matches against `applicable_categories` (jsonb array), falling back to
 * `categories` — the CRM populates one or the other depending on how the
 * addon was created. No categories at all -> the addon shows everywhere.
 */
export function addonsForProduct(addons, product) {
  if (!Array.isArray(addons) || !product) return [];

  const productLabels = [
    product.category,
    product.category_raw,
    product.bed_type_raw,
    ...(Array.isArray(product.categories) ? product.categories : []),
  ].filter(Boolean);
  const productNormalized = new Set(productLabels.map(normalizeLabel));
  const productFamilies = new Set(productLabels.map(categoryFamily).filter(Boolean));

  return addons.filter((addon) => {
    const declared = toCategoryList(addon.applicable_categories);
    const list = declared ?? toCategoryList(addon.categories);
    if (list === null) return true; // no restrictions -> show for all
    // An empty jsonb array is how the CRM stores "no restriction" too; only
    // an object that disabled every one of its keys means "applies to none".
    if (list.length === 0) {
      const src = declared !== null ? addon.applicable_categories : addon.categories;
      const isAllDisabledObject =
        src && typeof src === 'object' && !Array.isArray(src) && Object.keys(src).length > 0;
      return !isAllDisabledObject;
    }

    return list.some((raw) => {
      const label = normalizeLabel(raw);
      if (!label) return false;
      if (productNormalized.has(label)) return true;
      // A broad CRM tag ('מיטות') covers every storefront tab in its family
      // ('מיטות יהודיות', 'מיטות זוגיות', ...).
      if (isBroadCategory(label)) return productFamilies.has(categoryFamily(label));
      return false;
    });
  });
}

function applyClientSideFilter(products, filter) {
  if (!filter) return products;
  return products.filter((row) => {
    for (const [key, value] of Object.entries(filter)) {
      if (key === 'is_featured') {
        // CRM has no is_featured flag -> treat as is_active (already enforced
        // by the DB function; keep as pass-through)
        if (value && row.is_featured !== true) return false;
        continue;
      }
      if (key === 'is_on_sale') {
        if (value && row.is_on_sale !== true) return false;
        continue;
      }
      if (row[key] !== value) return false;
    }
    return true;
  });
}

function applySort(products, sort) {
  if (!sort) return products;
  const desc = sort.startsWith('-');
  const col = desc ? sort.slice(1) : sort;
  return [...products].sort((a, b) => {
    const av = a[col];
    const bv = b[col];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return (av < bv ? -1 : 1) * (desc ? -1 : 1);
  });
}

// ---------------------------------------------------------------------
// Entity implementations
// ---------------------------------------------------------------------

const productEntity = {
  async list(sort, limit) {
    let rows = await loadAllProducts();
    rows = applySort(rows, sort || '-created_date');
    if (typeof limit === 'number') rows = rows.slice(0, limit);
    return rows;
  },
  async filter(filter, sort, limit) {
    let rows = await loadAllProducts();
    rows = applyClientSideFilter(rows, filter);
    rows = applySort(rows, sort || '-created_date');
    if (typeof limit === 'number') rows = rows.slice(0, limit);
    return rows;
  },
  async get(id) {
    const rows = await loadAllProducts();
    return rows.find((r) => r.id === id) || null;
  },
  async create() {
    throw new Error('[base44Client shim] Product.create is disabled on the website — use the CRM.');
  },
};

const orderEntity = {
  async list() {
    return [];
  },
  async filter() {
    return [];
  },
  async get() {
    return null;
  },
  async create(payload) {
    if (!isSupabaseConfigured) {
      console.warn('[base44Client shim] Order.create called but Supabase is not configured.');
      return null;
    }
    const { data, error } = await supabase.rpc('website_create_order', {
      order_data: payload,
    });
    if (error) {
      console.error('[base44Client shim] website_create_order failed:', error.message);
      throw error;
    }
    return { id: data };
  },
};

// Minimal stubs for legacy entities the site references (BlogPost, ContactInquiry).
// These are not yet wired to CRM tables — they return empty / no-op so the UI
// renders without errors.
function stubEntity(name) {
  return {
    async list() {
      return [];
    },
    async filter() {
      return [];
    },
    async get() {
      return null;
    },
    async create() {
      console.warn(`[base44Client shim] ${name}.create is a no-op — wire a CRM RPC when ready.`);
      return null;
    },
  };
}

const addonEntity = {
  async list() {
    return loadAllAddons();
  },
  async filter(filter) {
    const rows = await loadAllAddons();
    return applyClientSideFilter(rows, filter);
  },
  async get(id) {
    const rows = await loadAllAddons();
    return rows.find((r) => r.id === id) || null;
  },
  async create() {
    throw new Error('[base44Client shim] Addon.create is disabled on the website — use the CRM.');
  },
};

const clubSignupEntity = {
  async list() {
    return [];
  },
  async filter() {
    return [];
  },
  async get() {
    return null;
  },
  async create(payload) {
    if (!isSupabaseConfigured) {
      console.warn('[base44Client shim] ClubSignup.create called but Supabase is not configured.');
      return null;
    }
    const { data, error } = await supabase.rpc('website_create_club_signup', {
      signup_data: payload,
    });
    if (error) {
      console.error('[base44Client shim] website_create_club_signup failed:', error.message);
      throw error;
    }
    return { id: data };
  },
};

const leadEntity = {
  async list() {
    return [];
  },
  async filter() {
    return [];
  },
  async get() {
    return null;
  },
  async create(payload) {
    if (!isSupabaseConfigured) {
      console.warn('[base44Client shim] Lead.create called but Supabase is not configured.');
      return null;
    }
    const { data, error } = await supabase.rpc('website_create_lead', {
      lead_data: payload,
    });
    if (error) {
      console.error('[base44Client shim] website_create_lead failed:', error.message);
      throw error;
    }
    return { id: data };
  },
};

// Blog posts live in the CRM's public.blog_posts. Reads go through two
// SECURITY DEFINER RPCs so the anon key never touches the table directly.
// Frontend components expect `created_date`, so map `published_at` into it.
function mapBlogRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    image_url: row.image_url,
    created_date: row.published_at,
  };
}

const blogPostEntity = {
  async list() {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.rpc('website_list_blog_posts', { p_limit: 50 });
    if (error) {
      console.error('[base44Client shim] website_list_blog_posts failed:', error.message);
      return [];
    }
    return (data || []).map(mapBlogRow);
  },
  async filter(filter) {
    if (!isSupabaseConfigured) return [];
    if (filter?.id) {
      const { data, error } = await supabase.rpc('website_get_blog_post', { p_id: filter.id });
      if (error) {
        console.error('[base44Client shim] website_get_blog_post failed:', error.message);
        return [];
      }
      const row = Array.isArray(data) ? data[0] : data;
      return row ? [mapBlogRow(row)] : [];
    }
    if (filter?.slug) {
      const { data, error } = await supabase.rpc('website_get_blog_post_by_slug', { p_slug: filter.slug });
      if (!error) {
        const row = Array.isArray(data) ? data[0] : data;
        return row ? [mapBlogRow(row)] : [];
      }
      // Fallback path: if the slug RPC isn't deployed yet, resolve the slug
      // client-side against the full list so /blog/:slug keeps working.
      console.warn('[base44Client shim] website_get_blog_post_by_slug unavailable, falling back to list lookup:', error.message);
      const all = await this.list();
      const match = all.find((p) => p.slug === filter.slug);
      return match ? [match] : [];
    }
    return this.list();
  },
  async get(id) {
    const rows = await this.filter({ id });
    return rows[0] || null;
  },
  async create() {
    throw new Error('[base44Client shim] BlogPost.create is disabled on the website — author posts in the CRM.');
  },
};

// Shipping/extra-charge rules. The CRM owns the `extra_charges` table
// (a row per "rule" — e.g. "הובלה ל-2 מזרנים", 350₪). The website
// reads the active rows and matches them against the cart contents
// in CartContext to compute the actual shipping cost.
const extraChargeEntity = {
  async list() {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('extra_charges')
      .select('id, name, cost, min_mattresses, max_mattresses, min_beds, max_beds, priority')
      .eq('is_active', true);
    if (error) {
      console.warn('[base44Client shim] extra_charges fetch failed:', error.message);
      return [];
    }
    // The dashboard's shipping rules are entered as customer-facing
    // prices, so they are left alone by default. Set
    // VITE_VAT_INCLUDE_SHIPPING=true if they ever become net figures.
    if (!VAT_APPLIES_TO_SHIPPING) return data || [];
    return (data || []).map((row) => ({ ...row, cost: withVat(row.cost) }));
  },
  async filter() {
    return [];
  },
  async get() {
    return null;
  },
  async create() {
    throw new Error('[base44Client shim] ExtraCharge.create is disabled on the website — manage rules in the CRM.');
  },
};

// ---------------------------------------------------------------------
// Bed configurator (bed_option_groups / bed_option_values)
// ---------------------------------------------------------------------
//
// The CRM's bed questions, reached through website_get_bed_options(). The RPC
// returns one flat row per (question, choice); this rebuilds the nesting the UI
// needs and drops nothing else on the way.
//
// PRICES ARE ALREADY VAT-INCLUSIVE HERE. The RPC resolves both kinds of choice
// — a manual price (stored gross) and one linked to an add-on (stored net,
// grossed up in SQL) — to one convention, so this is the one price path on the
// site that must NOT go through withVat(). Doing so would bill 18% twice.

let bedOptionsCachePromise = null;

async function loadBedOptions() {
  if (!isSupabaseConfigured) return [];
  if (!bedOptionsCachePromise) {
    bedOptionsCachePromise = (async () => {
      const { data, error } = await supabase.rpc('website_get_bed_options');
      if (error) {
        // A site whose CRM has not run the migration yet simply has no bed
        // questions — the product page renders without them rather than
        // breaking. Same posture as the products/addons caches.
        console.error('[base44Client shim] website_get_bed_options failed:', error.message);
        bedOptionsCachePromise = null;
        return [];
      }
      const byGroup = new Map();
      for (const row of data || []) {
        if (!byGroup.has(row.group_id)) {
          byGroup.set(row.group_id, {
            id: row.group_id,
            key: row.group_key,
            label: row.group_label,
            sort_order: row.group_sort_order,
            skippable: row.skippable,
            website_mode: row.website_mode,
            depends_on_group_key: row.depends_on_group_key,
            depends_on_value_key: row.depends_on_value_key,
            values: [],
          });
        }
        byGroup.get(row.group_id).values.push({
          id: row.value_id,
          key: row.value_key,
          label: row.value_label,
          price: Number(row.price) || 0, // gross already — see above
          image_url: row.image_url,
          sort_order: row.value_sort_order,
          min_width_cm: row.min_width_cm,
          max_width_cm: row.max_width_cm,
        });
      }
      return [...byGroup.values()].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    })();
  }
  return bedOptionsCachePromise;
}

const bedOptionEntity = {
  async list() {
    return loadBedOptions();
  },
  async filter(filter) {
    const rows = await loadBedOptions();
    return applyClientSideFilter(rows, filter);
  },
  async get(id) {
    const rows = await loadBedOptions();
    return rows.find((r) => r.id === id) || null;
  },
  async create() {
    throw new Error('[base44Client shim] BedOption.create is disabled on the website — use the CRM.');
  },
};

const ENTITIES = {
  Product: productEntity,
  BedOption: bedOptionEntity,
  Order: orderEntity,
  Addon: addonEntity,
  ProductAddon: addonEntity, // legacy alias
  ClubSignup: clubSignupEntity,
  Lead: leadEntity,
  // Legacy alias — the old Contact page used ContactInquiry.create.
  // Route it through the same lead RPC so every "contact us" form
  // lands as a tagged lead in the CRM.
  ContactInquiry: leadEntity,
  BlogPost: blogPostEntity,
  ExtraCharge: extraChargeEntity,
};

const entities = new Proxy(
  {},
  {
    get(_t, prop) {
      if (typeof prop !== 'string') return undefined;
      if (ENTITIES[prop]) return ENTITIES[prop];
      return stubEntity(prop);
    },
  }
);

// Auth: public storefront, no real login flow.
const auth = {
  async me() {
    return null;
  },
  logout(redirectUrl) {
    if (redirectUrl && typeof window !== 'undefined') window.location.href = redirectUrl;
  },
  redirectToLogin(redirectUrl) {
    if (redirectUrl && typeof window !== 'undefined') window.location.href = redirectUrl;
  },
};

export const base44 = { entities, auth };
