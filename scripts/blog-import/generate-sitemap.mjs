// Generates public/sitemap.xml with:
//  - the static site pages
//  - one entry per blog post (slug + lastmod = post_date)
// Reads slugs + dates from the same WXR as the blog importer.
// Run: node scripts/blog-import/generate-sitemap.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SITE_URL = 'https://kingdavid4u.co.il';

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/Home', priority: '1.0', changefreq: 'daily' },
  { path: '/Shop', priority: '0.9', changefreq: 'daily' },
  { path: '/Shop/מזרנים', priority: '0.9', changefreq: 'daily' },
  { path: '/Shop/מזרני יחיד', priority: '0.8', changefreq: 'weekly' },
  { path: '/Shop/מיטות', priority: '0.9', changefreq: 'weekly' },
  { path: '/Shop/מיטות יחיד', priority: '0.7', changefreq: 'weekly' },
  { path: '/Shop/מיטות יהודיות', priority: '0.7', changefreq: 'weekly' },
  { path: '/Shop/מיטות מעוצבות', priority: '0.7', changefreq: 'weekly' },
  { path: '/Shop/מבצעים', priority: '0.8', changefreq: 'weekly' },
  { path: '/About', priority: '0.6', changefreq: 'monthly' },
  { path: '/FAQ', priority: '0.7', changefreq: 'monthly' },
  { path: '/Contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/Reviews', priority: '0.7', changefreq: 'weekly' },
  { path: '/Blog', priority: '0.9', changefreq: 'weekly' },
  { path: '/Terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/Privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/Returns', priority: '0.3', changefreq: 'yearly' },
];

const xml = readFileSync(resolve('post.xml'), 'utf8');
const chunks = xml.split('</item>').slice(0, -1).map((c) => c.split('<item>')[1]).filter(Boolean);

const cdata = (chunk, tag) => {
  const m = chunk.match(new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`));
  return m ? m[1] : null;
};

const decodeSlug = (n) => { try { return decodeURIComponent(n || ''); } catch { return n || ''; } };

const posts = [];
for (const chunk of chunks) {
  if (cdata(chunk, 'wp:post_type') !== 'post') continue;
  if (cdata(chunk, 'wp:status') !== 'publish') continue;
  const slug = decodeSlug(cdata(chunk, 'wp:post_name'));
  const date = cdata(chunk, 'wp:post_date_gmt');
  if (!slug || !date) continue;
  posts.push({ slug, lastmod: `${date.replace(' ', 'T')}Z` });
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const entries = [
  ...STATIC_PAGES.map((p) => ({
    loc: `${SITE_URL}${encodeURI(p.path)}`,
    priority: p.priority,
    changefreq: p.changefreq,
  })),
  ...posts.map((p) => ({
    loc: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`,
    lastmod: p.lastmod,
    priority: '0.7',
    changefreq: 'monthly',
  })),
];

const xmlOut = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${esc(e.loc)}</loc>${e.lastmod ? `
    <lastmod>${e.lastmod}</lastmod>` : ''}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync(resolve('public/sitemap.xml'), xmlOut);
console.log(`Wrote public/sitemap.xml with ${entries.length} URLs (${STATIC_PAGES.length} static + ${posts.length} blog posts).`);
