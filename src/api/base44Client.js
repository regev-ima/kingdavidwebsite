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

function transformProduct(row) {
  const variations = (row.variations || []).filter((v) => v.is_active !== false);
  variations.sort((a, b) => {
    const aw = a.width_cm || 0;
    const bw = b.width_cm || 0;
    if (aw !== bw) return aw - bw;
    return (a.length_cm || 0) - (b.length_cm || 0);
  });

  const finalPrices = variations.map((v) => Number(v.final_price ?? v.base_price ?? 0)).filter(Boolean);
  const basePrices = variations.map((v) => Number(v.base_price ?? v.final_price ?? 0)).filter(Boolean);

  const defaultVariation =
    variations.find((v) => v.id === row.default_variation_id) || variations[0] || null;

  const minFinal = finalPrices.length ? Math.min(...finalPrices) : null;

  const isOnSale = variations.some(
    (v) =>
      v.final_price != null &&
      v.base_price != null &&
      Number(v.final_price) < Number(v.base_price)
  );

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

const ENTITIES = {
  Product: productEntity,
  Order: orderEntity,
  BlogPost: stubEntity('BlogPost'),
  ContactInquiry: stubEntity('ContactInquiry'),
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
