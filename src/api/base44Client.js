// Supabase-backed shim that preserves the previous base44 API surface.
// This lets existing components keep using `base44.entities.X.list/filter`
// without any code changes. Only the data source has changed.
//
// To rename a table or column for a specific entity, edit the ENTITY_MAP below.

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fallbackProducts } from '@/data/fallbackProducts';

// Map "base44 entity name" -> { table, defaultOrder, fallback }
// Edit the `table` field if your kcrm uses different table names.
const ENTITY_MAP = {
  Product: {
    table: 'products',
    defaultOrder: 'created_date',
    fallback: () => fallbackProducts,
  },
  BlogPost: {
    table: 'blog_posts',
    defaultOrder: 'created_date',
    fallback: () => [],
  },
  ContactInquiry: {
    table: 'contact_inquiries',
    defaultOrder: 'created_date',
    fallback: () => [],
  },
  Order: {
    table: 'orders',
    defaultOrder: 'created_date',
    fallback: () => [],
  },
  OrderItem: {
    table: 'order_items',
    defaultOrder: 'created_date',
    fallback: () => [],
  },
};

// Parse base44-style sort: "-field" => desc, "field" => asc
function parseSort(sort, fallback) {
  const raw = sort || fallback;
  if (!raw) return null;
  if (raw.startsWith('-')) return { column: raw.slice(1), ascending: false };
  return { column: raw, ascending: true };
}

function makeEntity(name) {
  const config = ENTITY_MAP[name];
  if (!config) {
    throw new Error(`[base44Client shim] Unknown entity: ${name}. Add it to ENTITY_MAP in src/api/base44Client.js.`);
  }

  async function query(filter, sort, limit) {
    if (!isSupabaseConfigured) {
      const data = config.fallback();
      let result = data;
      if (filter) {
        result = result.filter((row) =>
          Object.entries(filter).every(([k, v]) => row[k] === v)
        );
      }
      if (typeof limit === 'number') result = result.slice(0, limit);
      return result;
    }

    let q = supabase.from(config.table).select('*');
    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        q = q.eq(key, value);
      }
    }
    const order = parseSort(sort, config.defaultOrder);
    if (order) q = q.order(order.column, { ascending: order.ascending });
    if (typeof limit === 'number') q = q.limit(limit);

    const { data, error } = await q;
    if (error) {
      console.error(`[base44Client shim] ${name} query failed:`, error.message);
      return config.fallback();
    }
    return data || [];
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

// Build the entities namespace lazily so unknown entity access throws clearly.
const entities = new Proxy(
  {},
  {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      return makeEntity(prop);
    },
  }
);

// Auth: this site doesn't actually require user auth for shopping (orders go
// through WhatsApp / phone). We expose a no-op auth surface so existing call
// sites don't crash.
const auth = {
  async me() {
    return null;
  },
  logout(redirectUrl) {
    if (redirectUrl && typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  },
  redirectToLogin(redirectUrl) {
    // No login flow — just go back where the user came from.
    if (redirectUrl && typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  },
};

export const base44 = { entities, auth };
