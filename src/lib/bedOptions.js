// The bed configurator, as the storefront sees it.
//
// The CRM asks a rep six or seven questions when a bed goes on a quote. The
// customer is asked far fewer: a question reaches this file only when the CRM
// marked it 'ask' or 'auto' (see website_get_bed_options), and only when the
// bed itself has not switched it off.
//
// Prices arriving from the RPC are ALREADY VAT-inclusive — it resolves manual
// prices (stored gross) and add-on linked ones (stored net) to one convention.
// Nothing here may apply withVat().

/**
 * Does this bed offer this question?
 *
 * `product.bed_options` carries only the exceptions — {"storage_box": false}.
 * An absent key means the question applies, so a bed nobody has configured
 * behaves exactly as it did before the column existed.
 */
export function isGroupEnabledForProduct(group, product) {
  if (!group?.key) return true;
  const scope = product?.bed_options;
  if (!scope || typeof scope !== 'object' || Array.isArray(scope)) return true;
  return scope[group.key] !== false;
}

/**
 * The choice whose size band covers `widthCm`.
 *
 * Bands are declared per choice (standard ≤160, king ≥180) so the site can
 * answer an 'auto' question from the bed size already in the cart instead of
 * asking the customer something they have answered.
 *
 * Returns null when nothing matches. Callers must treat that as "cannot offer
 * this", never as free — a bed shipping with a box nobody was charged for is
 * the failure this guards against.
 */
export function valueForWidth(values = [], widthCm) {
  const w = Number(widthCm);
  if (!Number.isFinite(w) || w <= 0) return null;
  const bounds = (v) => [
    v?.min_width_cm == null ? -Infinity : Number(v.min_width_cm),
    v?.max_width_cm == null ? Infinity : Number(v.max_width_cm),
  ];
  const matches = values.filter((v) => {
    const [min, max] = bounds(v);
    return w >= min && w <= max;
  });
  if (!matches.length) return null;
  // Narrowest band wins, so a specific rule beats a catch-all.
  const span = (v) => { const [min, max] = bounds(v); return max - min; };
  return matches.reduce((best, v) => (span(v) < span(best) ? v : best));
}

/**
 * Resolve the whole configurator for one bed at one size.
 *
 * `answers` maps a group key to the chosen value key, for the questions the
 * customer was asked. Everything else is derived here, in one place, so the
 * product page, the cart and the order all describe the same purchase.
 *
 * Returns:
 *   ask     — the questions to render, in order, already filtered by product
 *             scope and by their dependency being satisfied
 *   chosen  — [{ group, value }] for every resolved question, asked or auto
 *   total   — what the chosen options add, VAT included
 */
export function resolveBedConfig({ groups = [], product, variation, answers = {} }) {
  const scoped = groups.filter((g) => isGroupEnabledForProduct(g, product));
  const byKey = new Map(scoped.map((g) => [g.key, g]));

  const chosen = [];
  const ask = [];
  const chosenKeyOf = (groupKey) => chosen.find((c) => c.group.key === groupKey)?.value?.key;

  for (const group of scoped) {
    // A dependency on a question this bed does not ask, or has not answered,
    // is not satisfied — which correctly hides "סוג ארגז" when there is no box.
    if (group.depends_on_group_key) {
      if (!byKey.has(group.depends_on_group_key)) continue;
      if (chosenKeyOf(group.depends_on_group_key) !== group.depends_on_value_key) continue;
    }

    const values = [...(group.values || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    if (group.website_mode === 'auto') {
      // Answered from the size the customer already picked. No match means the
      // size falls outside every band: skip it rather than invent a price, and
      // let the caller notice the question is missing.
      const value = valueForWidth(values, variation?.width_cm);
      if (value) chosen.push({ group, value });
      continue;
    }

    ask.push({ ...group, values });
    const value = values.find((v) => v.key === answers[group.key]);
    if (value) chosen.push({ group, value });
  }

  const total = chosen.reduce((sum, c) => sum + (Number(c.value?.price) || 0), 0);
  return { ask, chosen, total };
}
