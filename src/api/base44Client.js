// Supabase-backed shim that preserves the previous base44 API surface
// (`base44.entities.X.list/filter/create`) so existing components don't
// need to change. The wrapper translates between the kcrm CRM schema
// and the shape the UI expects.
//
// kcrm schema (relevant columns):
//   products(id uuid, name, description, sku, image_url, category, bed_type,
//            warranty_years, features text, is_active, default_variation_id)
//   product_variations(id uuid, product_id uuid, name, sku,
//                      base_price, final_price, width_cm, length_cm, is_active)
//   orders(id uuid, order_number, customer_name, customer_phone, customer_email,
//          delivery_address, delivery_city, apartment_number, floor,
//          property_type, elevator_type, items jsonb, extras jsonb,
//          subtotal, discount_total, vat_amount, total, source,
//          payment_status, production_status, delivery_status, notes_sales)
//   contact_inquiries(...)  // kept generic for now
//
// The UI expects (from the original Base44 model):
//   products[].price            <- max(variations.base_price)
//   products[].sale_price       <- corresponding final_price (only if discounted)
//   products[].available_sizes  <- variations[].name (or "WxH" from cm)
//   products[].is_on_sale       <- any variation has final_price < base_price
//   products[].is_featured      <- (CRM has no such flag) -> is_active
//   products[].features         <- text split by newline/comma
//   products[].variations       <- raw variations list (used by cart)

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fallbackProducts } from '@/data/fallbackProducts';

// ---------------------------------------------------------------------
// Transformers
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
  const variations = (row.product_variations || []).filter((v) => v.is_active !== false);
  // Sort variations by display name / size for consistent UX
  variations.sort((a, b) => {
    const aw = a.width_cm || 0;
    const bw = b.width_cm || 0;
    if (aw !== bw) return aw - bw;
    return (a.length_cm || 0) - (b.length_cm || 0);
  });

  const prices = variations.map((v) => Number(v.base_price ?? v.final_price ?? 0)).filter(Boolean);
  const finalPrices = variations.map((v) => Number(v.final_price ?? v.base_price ?? 0)).filter(Boolean);

  const basePrice = prices.length ? Math.max(...prices) : null;
  const finalPrice = finalPrices.length ? Math.max(...finalPrices) : null;

  // Pick the default variation if set, otherwise the first
  const defaultVariation =
    variations.find((v) => v.id === row.default_variation_id) || variations[0] || null;

  const minBase = prices.length ? Math.min(...prices) : null;
  const minFinal = finalPrices.length ? Math.min(...finalPrices) : null;

  const isOnSale = variations.some(
    (v) =>
      v.final_price != null &&
      v.base_price != null &&
      Number(v.final_price) < Number(v.base_price)
  );

  return {
    ...row,
    // Headline price = the default (or cheapest) final_price
    price: defaultVariation
      ? Number(defaultVariation.base_price ?? defaultVariation.final_price ?? 0)
      : minBase,
    sale_price: isOnSale && defaultVariation
      ? Number(defaultVariation.final_price ?? defaultVariation.base_price ?? 0)
      : null,
    price_from: minFinal,
    price_to: finalPrice,
    available_sizes: variations.map(dimsToSize),
    is_on_sale: isOnSale,
    is_featured: row.is_active !== false, // CRM has no is_featured -> use is_active
    features: splitFeatures(row.features),
    variations,
  };
}

function transformBlogPost(row) {
  return row;
}

// ---------------------------------------------------------------------
// Entity definitions
// ---------------------------------------------------------------------

const ENTITY_MAP = {
  Product: {
    table: 'products',
    select: '*, product_variations(*)',
    defaultOrder: 'created_date',
    transform: transformProduct,
    fallback: () => fallbackProducts,
    activeOnly: true,
  },
  BlogPost: {
    table: 'blog_posts',
    select: '*',
    defaultOrder: 'created_date',
    transform: transformBlogPost,
    fallback: () => [],
    activeOnly: false,
  },
  ContactInquiry: {
    table: 'contact_inquiries',
    select: '*',
    defaultOrder: 'created_date',
    transform: (r) => r,
    fallback: () => [],
    activeOnly: false,
  },
  Order: {
    table: 'orders',
    select: '*',
    defaultOrder: 'created_date',
    transform: (r) => r,
    fallback: () => [],
    activeOnly: false,
  },
};

function parseSort(sort, fallback) {
  const raw = sort || fallback;
  if (!raw) return null;
  if (raw.startsWith('-')) return { column: raw.slice(1), ascending: false };
  return { column: raw, ascending: true };
}

// Translate Base44-style filter keys to CRM columns where they differ.
// Returns the [filtered base44 filter, supabaseQueryModifier] pair.
function applyProductFilter(q, filter) {
  if (!filter) return q;
  for (const [key, value] of Object.entries(filter)) {
    switch (key) {
      case 'is_featured':
        // CRM has no is_featured; just require active products
        if (value) q = q.eq('is_active', true);
        break;
      case 'is_on_sale':
        // Can't express directly in SQL without a join; we filter client-side
        // after the transform. Skip server-side filter here.
        break;
      case 'is_active':
      case 'category':
      case 'bed_type':
      case 'sku':
      case 'id':
        q = q.eq(key, value);
        break;
      default:
        // Unknown columns: try eq blindly. Supabase will return 400 if column
        // doesn't exist; we catch that downstream.
        q = q.eq(key, value);
    }
  }
  return q;
}

function makeEntity(name) {
  const config = ENTITY_MAP[name];
  if (!config) {
    throw new Error(
      `[base44Client shim] Unknown entity: ${name}. Add it to ENTITY_MAP in src/api/base44Client.js.`
    );
  }

  async function query(filter, sort, limit) {
    if (!isSupabaseConfigured) {
      let result = config.fallback();
      if (filter) {
        result = result.filter((row) => Object.entries(filter).every(([k, v]) => row[k] === v));
      }
      if (typeof limit === 'number') result = result.slice(0, limit);
      return result;
    }

    let q = supabase.from(config.table).select(config.select);

    if (config.activeOnly) q = q.eq('is_active', true);

    if (name === 'Product') {
      q = applyProductFilter(q, filter);
    } else if (filter) {
      for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    }

    const order = parseSort(sort, config.defaultOrder);
    if (order) q = q.order(order.column, { ascending: order.ascending });
    if (typeof limit === 'number') q = q.limit(limit);

    const { data, error } = await q;
    if (error) {
      console.error(`[base44Client shim] ${name} query failed:`, error.message);
      return config.fallback();
    }

    let rows = (data || []).map(config.transform);

    // Client-side filters not expressible at SQL level
    if (name === 'Product' && filter) {
      if (filter.is_on_sale === true) rows = rows.filter((r) => r.is_on_sale);
    }

    return rows;
  }

  return {
    list(sort, limit) {
      return query(null, sort, limit);
    },
    filter(filter, sort, limit) {
      return query(filter, sort, limit);
    },
    async create(payload) {
      if (!isSupabaseConfigured) {
        console.warn(`[base44Client shim] ${name}.create called but Supabase is not configured.`);
        return null;
      }
      const { data, error } = await supabase
        .from(config.table)
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error(`[base44Client shim] ${name}.create failed:`, error.message);
        throw error;
      }
      return data;
    },
    async get(id) {
      const result = await query({ id }, null, 1);
      return result[0] || null;
    },
  };
}

const entities = new Proxy(
  {},
  {
    get(_t, prop) {
      if (typeof prop !== 'string') return undefined;
      return makeEntity(prop);
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
