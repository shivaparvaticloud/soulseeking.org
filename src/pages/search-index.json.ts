import type { APIRoute } from 'astro';
import { buildSearchDocs } from '../lib/search';

// Emitted as a static /search-index.json at build time. The search page fetches
// this once and runs the whole search in the browser — works in `astro dev` and
// in production, with no third-party service and no network calls beyond 'self'.
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildSearchDocs()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
