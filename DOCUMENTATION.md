# Soul Seeking — Technical Documentation

A complete reference for developing, extending, deploying and maintaining
**soulseeking.org** — a static, privacy-first, fully self-coded contemplative
library on the soul, the mind and the meaning of life.

> **Guiding principle.** Everything is authored in code (SVG, CSS, Canvas 2D,
> WebGL) with **zero third-party runtime requests** and **no raster/stock
> media**. The test for every addition: _does this help an earnest person look
> inward, or does it just show off?_

---

## Table of contents

1. [Overview](#1-overview)
2. [Tech stack](#2-tech-stack)
3. [Quick start](#3-quick-start)
4. [Project structure](#4-project-structure)
5. [Content pipeline](#5-content-pipeline)
6. [Routing & pages](#6-routing--pages)
7. [Design system](#7-design-system)
8. [The experience layer (motion / WebGL)](#8-the-experience-layer-motion--webgl)
9. [Component catalogue](#9-component-catalogue)
10. [Search](#10-search)
11. [SEO & structured data](#11-seo--structured-data)
12. [Security & privacy](#12-security--privacy)
13. [Performance](#13-performance)
14. [Accessibility & motion preferences](#14-accessibility--motion-preferences)
15. [Deployment](#15-deployment)
16. [Configuration reference](#16-configuration-reference)
17. [Maintenance & dashboard actions](#17-maintenance--dashboard-actions)
18. [Related documents](#18-related-documents)

---

## 1. Overview

Soul Seeking is an **Astro static site**. Every page is pre-rendered to plain
HTML at build time and served from a CDN (Cloudflare Pages). There is no server,
no database, no accounts, no cookies and no third-party scripts. Interactivity
is added as small, lazy **Astro islands** layered on top of fully
server-rendered content — never the only source of text or links.

**Core tenets**

- **Self-contained.** Fonts, the 3D library and all imagery are bundled and
  served same-origin. The site makes no cross-origin requests at runtime.
- **Privacy by construction.** No analytics, trackers, cookies or fingerprinting.
  The only client storage is a single `localStorage` key for the motion
  preference.
- **Coded visuals.** All artwork, textures and cosmic scenes are generated from
  code; there are no `.png`/`.jpg` assets (only `favicon.svg` and `og.svg`).
- **Accessible & calm.** Honours `prefers-reduced-motion` / `prefers-reduced-data`
  and a persistent on-screen Motion toggle.

---

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | [Astro](https://astro.build) v4 (`output: 'static'`, directory URLs) |
| Styling | Tailwind CSS v3 + a token-driven `global.css` |
| Typography | Self-hosted **Space Grotesk** (display) + **EB Garamond** (reading) via `@fontsource` |
| 3D | **three.js** (bundled locally, dynamically imported, code-split) |
| Smooth scroll | **Lenis** (lazy) |
| Scroll choreography | **GSAP + ScrollTrigger** (lazy) |
| Content | Plain-text (`.txt`) files parsed at build time |
| Search | Client-side over a generated `search-index.json` |
| Hosting | Cloudflare Pages |

Dependencies are intentionally few and **all self-hosted** — no CDN scripts,
fonts or analytics.

---

## 3. Quick start

```bash
npm install        # install dependencies
npm run dev        # local dev server (http://localhost:4321)
npm run build      # production build → ./dist
npm run preview    # preview the production build
npm run check      # astro/type checks
```

**Requirements:** Node 18+ and npm. The build is fully static; the output in
`dist/` can be served by any static host.

---

## 4. Project structure

```
soulseeking.org/
├─ content/
│  ├─ knowledge/*.txt        # articles (Knowledge Hub)
│  └─ courses/*.txt          # courses (guided "books")
├─ public/
│  ├─ _headers               # Cloudflare security + cache headers
│  ├─ _redirects             # legacy icon → favicon redirects
│  ├─ robots.txt             # search engines allowed, AI crawlers blocked
│  ├─ site.webmanifest       # PWA manifest
│  ├─ favicon.svg, og.svg    # the only coded image assets
│  └─ .well-known/security.txt
├─ src/
│  ├─ layouts/Layout.astro   # the shell: <head>, header, footer, backgrounds
│  ├─ pages/                 # routes (see §6)
│  │  ├─ index.astro
│  │  ├─ about.astro, donate.astro, search.astro, 404.astro
│  │  ├─ knowledge/index.astro, knowledge/[slug].astro
│  │  ├─ courses/index.astro,  courses/[slug].astro
│  │  ├─ search-index.json.ts # generated client-search index
│  │  ├─ sitemap.xml.ts, rss.xml.ts
│  ├─ components/            # coded UI + visuals (see §9)
│  ├─ lib/
│  │  ├─ parser.ts           # .txt → structured content
│  │  ├─ content.ts          # build-time content loaders
│  │  ├─ search.ts           # search index builder
│  │  └─ fx/                 # the experience layer (see §8)
│  └─ styles/global.css      # design tokens, components, utilities
├─ astro.config.mjs
├─ tailwind.config.mjs
└─ docs: README.md · DOCUMENTATION.md · CONTENT-GUIDE.md · UPGRADE-NOTES.md
```

---

## 5. Content pipeline

The Knowledge Hub and Courses are **built automatically from plain-text files**.
Drop a `.txt` into `content/knowledge/` or `content/courses/`, rebuild, and a new
article/course appears — in its hub/tab, at its own URL, in search and in the
sitemap, laid out exactly like the others.

- `src/lib/parser.ts` — a forgiving, deterministic parser. It reads an optional
  `Key: value` header (Title, Category, Order, Quote, Description, Course,
  Tagline, Level) and turns a natural-looking body into structured blocks
  (headings, paragraphs, lists, quotes, glossaries, quizzes, course modules).
  Rough files still produce a consistent layout (e.g. a title-like first line
  becomes the title).
- `src/lib/content.ts` — globs the `.txt` files at build time (`import.meta.glob`)
  and exposes `getArticles()`, `getCourses()`, `getArticleBySlug()`,
  `getCourseBySlug()`, `getCategories()`.

**Full authoring conventions are in [`CONTENT-GUIDE.md`](./CONTENT-GUIDE.md).**

---

## 6. Routing & pages

| Route | Source | Notes |
|---|---|---|
| `/` | `pages/index.astro` | Home — bespoke `HomeAtmosphere` (stars + light + 5-layer mandala) |
| `/about` | `pages/about.astro` | |
| `/knowledge` | `pages/knowledge/index.astro` | article index, grouped by category |
| `/knowledge/<slug>` | `pages/knowledge/[slug].astro` | article reader (`getStaticPaths`) |
| `/courses` | `pages/courses/index.astro` | **tabbed** course browser (deep-linkable `?c=slug`) |
| `/courses/<slug>` | `pages/courses/[slug].astro` | course "book" reader + chapter quick-nav |
| `/donate` | `pages/donate.astro` | a pay-it-forward page (no payment processor) |
| `/search` | `pages/search.astro` | client-side keyword search |
| `/404` | `pages/404.astro` | |
| `/search-index.json` | endpoint | generated search corpus |
| `/sitemap.xml`, `/rss.xml` | endpoints | generated from content |

Client-side navigation uses **Astro View Transitions** with a slow warm
cross-dissolve; the fixed background canvas persists across navigations.

---

## 7. Design system

All visual tokens live as CSS custom properties in `src/styles/global.css`
(`:root`) and are mirrored in `tailwind.config.mjs`.

**Palette (dark-first).** `--void`/`--abyss` (page base), `--surface`/`--surface-2`
(panels), `--mist`/`--text` (warm off-white text), `--line` (hairlines), and one
restrained accent: `--gold` (`#E7C68B`) with `--ochre` / `--ember` / `--oxblood`.

**Type.** Space Grotesk for display + chrome (`.kicker`, `.display-xl/-lg`),
EB Garamond for reading and italic pull-quotes (`.pull`).

**Controls — one vocabulary, used everywhere:**

| Class | Role |
|---|---|
| `.btn-soul` | primary (luminous gold; one per view) |
| `.btn-soul-dark` | secondary (hairline ghost, fills on hover) |
| `.btn-link` | tertiary (animated-underline text link) |

Every control has a ≥44px target and distinct hover / focus-visible / active /
disabled states. Other building blocks: `.kicker`, `.pull`, `.card-soul`,
`.glass`, `.aurora`, `.bg-grid`, `.bg-brand-*` (coded brand textures),
`.brand-veil`, `.brand-divider`.

---

## 8. The experience layer (motion / WebGL)

Everything in `src/lib/fx/` is **lazy-loaded, code-split, and stands down under
reduced motion / the Motion toggle** — the reduced-motion path ships none of the
heavy JS.

| File | Responsibility |
|---|---|
| `env.ts` | motion/touch/reduced-motion helpers + the motion event bus |
| `background.ts` | the shared three.js light/dust field + particle motes |
| `scroll.ts` | Lenis smooth scroll + GSAP/ScrollTrigger reveals & line-splits |
| `cursor.ts` | the soft gold accent cursor (pointer-fine devices only) |
| `boot.ts` | orchestration; rebinds per page on `astro:page-load` |

`SiteFX.astro` renders the one persistent canvas + cursor (kept alive across
View-Transition navigations). The **Motion toggle** (footer) flips
`data-motion` on `<html>`, persists the choice in `localStorage` (`ss-motion`),
and dispatches `ss-motion-change` so the islands pause/resume.

**Backgrounds.** Each page gets a fixed coded "universe" (`CosmicBackground`) —
a realistic deep-space base (fractal-noise gas + HD stars + grain) plus a
per-page focal phenomenon (nebula, galaxy, wormhole, supernova, starfield,
aurora…). The Home page uses the bespoke `HomeAtmosphere` (moving stars,
emerging central light, and a slowly rotating **five-layer mandala**). The
background stays fixed while text scrolls; reading pages dim it for legibility.

---

## 9. Component catalogue

**Chrome & content**
- `Logo.astro` — coded gold, engraved "Victorian" soaring eagle (props:
  `size`, `withWordmark`, `tone`).
- `Blocks.astro`, `Glossary.astro`, `Quiz.astro` — render parsed article/course
  blocks (interactive quiz; `tone="dark"`).
- `CourseTabs.astro` — data-driven ARIA `tablist` for `/courses` (deep-linkable).
- `CourseChapterNav.astro` — sticky chapter quick-nav for the course reader.
- `ProgressFooter.astro`, `JourneyPath.astro` — course progress + map.

**Coded illustration & brand**
- `KosaScene.astro` — the flagship lazy three.js scene (five luminous sheaths +
  the Self), with an SVG fallback and keyboard-selectable chips.
- `HomeAtmosphere.astro`, `CosmicBackground.astro`, `Starfield.astro`,
  `Phyllotaxis.astro`, `Nadis.astro`, `PulsarMap.astro` — coded cosmic visuals.
- `BrandArt.astro` — 10 coded "artworks" (dot-painting / etched register).
- `BrandDivider.astro` — the dot-field ⇢ maze ⇢ river brand band.
- `LampKeeper.astro`, `ThreeModes.astro`, `TurningPages.astro` — themed motifs.

Every decorative component is `aria-hidden`, namespaces its SVG ids, and
disables its own animation under `prefers-reduced-motion`.

---

## 10. Search

`src/pages/search-index.json.ts` emits a static `/search-index.json` at build
(via `src/lib/search.ts`), flattening every page/article/course into
`{title, url, type, category, excerpt, body}` with diacritics folded.
`pages/search.astro` fetches it once and searches in-browser — no third-party
search service. The page reads `?q=` for deep links (used by the SEO
`SearchAction`).

---

## 11. SEO & structured data

- **Metadata** (`Layout.astro`): unique `<title>`/description per page,
  canonical URL, Open Graph + Twitter (`summary_large_image`, `og.svg`),
  `robots` directives, keywords, theme-color.
- **Structured data** (JSON-LD `@graph`): `Organization` + `WebSite`
  (with `SearchAction`) site-wide; `Article` + `BreadcrumbList` on writings;
  `Course` + `BreadcrumbList` on courses. Pass page schema via the Layout
  `jsonld` prop.
- **Discovery**: `sitemap.xml`, `rss.xml`, `robots.txt`, `site.webmanifest`.

> Technical SEO is maximised here, but ranking also depends on content depth and
> external authority accruing over time — no code guarantees a #1 position.

---

## 12. Security & privacy

Defined in `public/_headers` (served by Cloudflare) and mirrored in a `<meta>`
CSP for defence-in-depth.

- **Content-Security-Policy** — `default-src 'self'`; `object-src 'none'`;
  `frame-ancestors 'none'`; `img-src 'self' data:`; `connect-src 'self'`.
  `script-src` allows **only `'self'` + SHA-256 hashes** of the two inline
  scripts (no `'unsafe-inline'` for scripts). `style-src` retains
  `'unsafe-inline'` for inline style attributes (a documented, low-risk residual
  on a static host).
- **Transport / isolation** — HSTS (`includeSubDomains; preload`), COOP, CORP,
  `Cross-Origin-Embedder-Policy: credentialless`, `Origin-Agent-Cluster`,
  X-Frame-Options `DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, a locked-down `Permissions-Policy`.
- **AI crawlers blocked** — `robots.txt` disallows GPTBot, ClaudeBot,
  PerplexityBot, CCBot, Google-Extended, Applebot-Extended, Bytespider, … while
  allowing search engines. `X-Robots-Tag: noai, noimageai` reinforces this.
- **`/.well-known/security.txt`** (RFC 9116) provides a security contact.
- **No cookies, trackers, analytics or service worker.** Only `ss-motion` is
  stored locally.

> **Hashed-CSP note.** The two allow-listed script hashes correspond to the
> pre-paint motion script and the search script. If you change either script's
> source, recompute its SHA-256 and update both the `_headers` CSP and the
> `<meta>` CSP (see `git log` for the helper).

---

## 13. Performance

- Near-zero JS on the static HTML; only visited islands ship meaningful JS, and
  three.js/GSAP/Lenis are dynamically imported and code-split.
- Heavy scenes pause off-screen / when the tab is hidden; pixel ratios are
  capped and particle counts are lighter on mobile.
- The mandala and cosmic layers animate via **GPU-composited transforms**
  (no per-frame raster); textures are generated once.
- Hashed bundles, fonts and `og.svg` are cached `immutable` for one year.

---

## 14. Accessibility & motion preferences

- All real content is server-rendered HTML; decorative visuals are `aria-hidden`.
- `prefers-reduced-motion` and `prefers-reduced-data` are honoured, plus a
  persistent **Motion: on/off** control. The reduced path ships no heavy JS and
  freezes all CSS animation via a global gate (`html[data-motion='off']`).
- Logical focus order, visible focus rings, ARIA tablists/tabpanels with
  arrow-key navigation (Courses), and an `aria-live` caption for the 3D teaching.

---

## 15. Deployment

The site deploys to **Cloudflare Pages** from the default branch.

- **Build command:** `npm run build` · **Output:** `dist`
- `public/_headers` sets security + cache headers; `public/_redirects` handles
  legacy icon probes. Both are copied verbatim into `dist/`.
- Any static host works; on non-Cloudflare hosts, replicate `_headers`/
  `_redirects` behaviour in that platform's config.

---

## 16. Configuration reference

**`Layout.astro` props**

| Prop | Default | Purpose |
|---|---|---|
| `title` | site default | `<title>` + OG/Twitter title |
| `description` | site default | meta description + OG/Twitter |
| `fxPage` | `'default'` | selects the page's cosmic + artwork variant; `'knowledge'`/`'courses'` dim the backdrop for reading |
| `ogType` | `'website'` | Open Graph type (`'article'` on detail pages) |
| `image` | `/og.svg` | social/OG image |
| `jsonld` | – | page-specific structured data (object or array) |
| `noindex` | `false` | emit `noindex, nofollow` |
| `keywords` | site default | meta keywords |
| `cosmos` | – | force a specific `CosmicBackground` variant |

**Key files to know:** `tailwind.config.mjs` (palette/type/spacing),
`src/styles/global.css` (tokens + components), `astro.config.mjs` (site URL,
output mode).

---

## 17. Maintenance & dashboard actions

Some hardening lives in the **Cloudflare dashboard / account**, not in this repo:

- **Always Use HTTPS** (redirect any plain-HTTP requests).
- **Bot Fight Mode** and the managed **Block AI bots** / **AI Labyrinth** rules
  (defence beyond `robots.txt`).
- **Turnstile** (only if forms are ever added — the site currently has none).
- **MFA** on the Cloudflare account; submit the domain to the **HSTS preload
  list** (hstspreload.org).

A high 4xx rate in analytics is largely automated bots probing non-existent
paths; returning `404` is the correct behaviour and not a vulnerability.

To **add content**, see §5 and `CONTENT-GUIDE.md`. To change the look, edit the
tokens in `global.css` / `tailwind.config.mjs` — components follow the palette.

---

## 18. Related documents

- [`README.md`](./README.md) — short orientation.
- [`CONTENT-GUIDE.md`](./CONTENT-GUIDE.md) — how to write the `.txt` content files.
- [`UPGRADE-NOTES.md`](./UPGRADE-NOTES.md) — history and rationale of the redesign.

---

_Soul Seeking is a free, independent, non-commercial resource. Built to help an
earnest person look inward._
