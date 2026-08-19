#!/usr/bin/env node
/**
 * Guard: the website RPCs must never hand internal columns to anon.
 *
 * Every public.website_* function is SECURITY DEFINER, so it bypasses RLS and
 * its OUTPUT SHAPE is the security boundary — nothing else is. This checks the
 * shape each function declares:
 *
 *   RETURNS TABLE (...)   — the column list is explicit. Fails if it names an
 *                           internal-only column, or if the body still uses a
 *                           star select.
 *   RETURNS SETOF <table> — the shape is whatever the table happens to hold,
 *                           so a column added later is published without anyone
 *                           deciding to. Reported as a warning: the blog RPCs
 *                           predate this guard and return public post content.
 *
 * Checking the declared output (not every mention of a name) is deliberate: a
 * function may legitimately JOIN on or test an internal column — e.g.
 * `WHERE v.addon_id IS NOT NULL` — without ever returning it.
 *
 * Run: npm run check:rpc
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'supabase/migrations';

// Columns a customer must never receive. `note`/`note_type` are the sales
// script the reps read from; the rest is internal catalog / cost plumbing.
const FORBIDDEN = ['note', 'note_type', 'addon_id', 'base_cost', 'manager_notes', 'cost'];

const errors = [];
const warnings = [];

// Migrations run in order and a later one redefines what an earlier one
// created, so only the last definition of each function is live. Findings are
// collected per function name and overwritten as the scan advances, otherwise a
// definition that has already been superseded keeps reporting forever.
const latest = new Map();

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()) {
  const sql = readFileSync(join(DIR, file), 'utf8');
  const re =
    /create\s+(?:or\s+replace\s+)?function\s+(public\.website_[a-z0-9_]+)\s*\(([^)]*)\)\s*returns\s+([\s\S]*?)\s+language\s+([\s\S]*?)\$\$([\s\S]*?)\$\$/gi;

  let m;
  while ((m = re.exec(sql)) !== null) {
    const [, name, , returns, , body] = m;
    const where = `${file} · ${name}()`;

    if (/^\s*table\s*\(/i.test(returns)) {
      // Explicit column list — parse the declared names.
      const inner = returns.replace(/^\s*table\s*\(/i, '').replace(/\)\s*$/, '');
      const declared = inner
        .split(',')
        .map((s) => s.trim().split(/\s+/)[0]?.toLowerCase())
        .filter(Boolean);

      const found = [];
      for (const col of declared) {
        if (FORBIDDEN.includes(col)) {
          found.push(['error', `${where}: returns "${col}" — internal only, never send it to anon`]);
        }
      }
      const code = body.replace(/--[^\n]*/g, ' ').replace(/'(?:[^']|'')*'/g, "''");
      if (/\bselect\s+(?:\*|[a-z_]+\.\*)/i.test(code)) {
        found.push(['error', `${where}: declares columns but the body uses SELECT * — list them explicitly`]);
      }
      latest.set(name, found);
    } else if (/setof\s+[a-z_.]+|^\s*public\.[a-z_]+\s*$/i.test(returns)) {
      latest.set(name, [
        [
          'warn',
          `${where}: returns a whole table row (${returns.trim()}) — any column added to that table later is published automatically`,
        ],
      ]);
    } else {
      latest.set(name, []);
    }
  }
}

for (const found of latest.values()) {
  for (const [kind, message] of found) (kind === 'error' ? errors : warnings).push(message);
}

for (const w of warnings) console.warn(`! ${w}`);
for (const e of errors) console.error(`✗ ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s). Anon must not receive internal columns.`);
  process.exit(1);
}
console.log(`✓ website_* RPCs declare no internal columns${warnings.length ? ` (${warnings.length} warning(s) above)` : ''}`);
