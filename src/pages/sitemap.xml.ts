import type { APIRoute } from 'astro';
import { getArticles, getCourses } from '../lib/content';

export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() || 'https://soulseeking.org/').replace(/\/$/, '');
  const staticPaths = ['/', '/about', '/knowledge', '/courses', '/donate', '/search'];
  const articlePaths = getArticles().map((a) => `/knowledge/${a.slug}`);
  const coursePaths = getCourses().map((c) => `/courses/${c.slug}`);
  const all = [...staticPaths, ...articlePaths, ...coursePaths];

  const urls = all
    .map((p) => `  <url><loc>${base}${p === '/' ? '/' : p + '/'}</loc></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
