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

// ---------------------------------------------------------------------
// Transformers — CRM shape -> UI shape
// ---------------------------------------------------------------------

function dimsToSize(v) {
  if (v.name && /\d/.test(v.name)) return v.name;
  if (v.width_cm && v.length_cm) return `${v.width_cm}x${v.length_cm}`;
  return v.name || v.sku || 'default';
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

  if (cat === 'mattress' || cat === 'מזרן' || cat === 'מזרנים') {
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

  // Apply product-level sale, if any. This replaces each variation's
  // final_price with the discounted value so the rest of the UI keeps
  // using its existing base_price / final_price shape.
  const { variations: saleVariations, saleActive } = applyProductSale(
    variations,
    row,
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
    available_sizes: variations.map(dimsToSize),
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
        // Prefer VAT-inclusive price when present.
        effective_base_price: Number(row.final_price ?? row.base_price ?? 0),
      }));
    })();
  }
  return addonsCachePromise;
}

/**
 * Resolve the price a single addon charges for the currently selected variation.
 * Priority:
 *   1. product_addon_prices (variation_prices map, by variation.id)
 *   2. size_prices jsonb by variation.name ("160x200") or variation.id
 *   3. addon.final_price
 *   4. addon.base_price
 */
export function priceForAddon(addon, variation) {
  if (!addon) return 0;
  if (variation?.id && addon.variation_prices && addon.variation_prices[variation.id] != null) {
    return Number(addon.variation_prices[variation.id]);
  }
  if (variation && addon.size_prices && typeof addon.size_prices === 'object') {
    const byId = variation.id && addon.size_prices[variation.id];
    const byName = variation.name && addon.size_prices[variation.name];
    const byDims = variation.width_cm && variation.length_cm &&
      addon.size_prices[`${variation.width_cm}x${variation.length_cm}`];
    const match = byId ?? byName ?? byDims;
    if (match != null) return Number(match);
  }
  return Number(addon.final_price ?? addon.base_price ?? 0);
}

/**
 * Filter addons that apply to the given product.
 * Matches against `applicable_categories` (jsonb array) — falls back to
 * showing all addons if no categories are declared.
 */
export function addonsForProduct(addons, product) {
  if (!Array.isArray(addons) || !product) return [];
  return addons.filter((addon) => {
    const apc = addon.applicable_categories;
    if (!apc) return true; // no restrictions -> show for all
    const list = Array.isArray(apc) ? apc : (typeof apc === 'object' ? Object.keys(apc) : []);
    if (list.length === 0) return true;
    const productCategories = [
      product.category,
      product.category_raw,
      product.bed_type_raw,
      ...(Array.isArray(product.categories) ? product.categories : []),
    ].filter(Boolean);
    return list.some((c) => productCategories.includes(c));
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

const ENTITIES = {
  Product: productEntity,
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
