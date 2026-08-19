#!/usr/bin/env node
/**
 * Guard: every local asset the source points at must exist in public/.
 *
 * The homepage story panel rendered as a grey box for some time because the
 * video it asked for was not in the repo, and the About gallery had two dead
 * product photos in it. Both failed silently — a missing image is just an empty
 * box, and nothing in the build complains. This turns that into a failed check.
 *
 * Run: npm run check:assets
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// A hand-rolled walk rather than fs.globSync, which only exists from Node 22.
// The check ran locally and failed in CI on Node 20 — a guard that depends on
// the newest runtime is a guard that does not run where it matters.
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk('src');
const REF = /["'`](\/(?:images|videos|assets|fonts)\/[^"'`]+)["'`]/g;

const missing = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(REF)) {
    // srcset entries carry a width descriptor — "/a.jpg 640w" — which is not
    // part of the path.
    const path = m[1].split(/\s+/)[0];
    if (!existsSync(`public${path}`)) missing.push(`${file}: ${path}`);
  }
}

if (missing.length) {
  console.error('✗ referenced but not in public/:');
  for (const m of [...new Set(missing)]) console.error('   ' + m);
  process.exit(1);
}
console.log('✓ every referenced local asset exists');
