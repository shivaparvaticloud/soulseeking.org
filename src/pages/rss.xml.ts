import type { APIRoute } from 'astro';
import { getArticles, getCourses } from '../lib/content';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() || 'https://soulseeking.org/').replace(/\/$/, '');
  const items = [
    ...getArticles().map((a) => ({
      title: a.title,
      link: `${base}/knowledge/${a.slug}/`,
      desc: a.description,
      cat: a.category,
    })),
    ...getCourses().map((c) => ({
      title: c.title,
      link: `${base}/courses/${c.slug}/`,
      desc: c.description || c.tagline,
      cat: 'Course',
    })),
  ];

  const body = items
    .map(
      (it) =>
        `    <item>\n      <title>${esc(it.title)}</title>\n      <link>${it.link}</link>\n      <guid>${it.link}</guid>\n      <category>${esc(it.cat)}</category>\n      <description>${esc(it.desc)}</description>\n    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Soul Seeking</title>
    <link>${base}/</link>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Higher answers for deeper questions — writings and courses on the soul, the mind and the meaning of life.</description>
    <language>en</language>
${body}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
