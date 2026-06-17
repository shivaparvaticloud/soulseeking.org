# Soul Seeking

**Higher answers for deeper questions.** A static, privacy-first, fully
self-coded contemplative library on the soul, the mind and the meaning of life —
drawn from the Bhagavad-gītā, the Upaniṣads and the world's wisdom traditions.

Live site: **[soulseeking.org](https://soulseeking.org)**

---

## What it is

- **Astro static site** — every page pre-rendered to HTML; no server, no
  database, no accounts.
- **Privacy by construction** — no analytics, trackers, cookies or third-party
  requests. The only client storage is a single motion preference.
- **Fully coded visuals** — all artwork, textures and cosmic scenes are
  generated from SVG / CSS / Canvas / WebGL. No raster or stock media.
- **Content from plain text** — drop a `.txt` into `content/` and a new
  article or course appears, laid out consistently, on the next build.

## Quick start

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → ./dist
npm run preview
```

## Documentation

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** — full technical reference
  (architecture, design system, the WebGL/motion layer, security, SEO,
  deployment, configuration).
- **[CONTENT-GUIDE.md](./CONTENT-GUIDE.md)** — how to write the `.txt` content
  files.
- **[UPGRADE-NOTES.md](./UPGRADE-NOTES.md)** — history and rationale of the
  redesign.

## Tech stack

Astro · Tailwind CSS · three.js · GSAP + Lenis · self-hosted fonts ·
Cloudflare Pages. Everything bundled and served same-origin.

## Purpose

Soul Seeking is a free, independent, non-commercial resource built to help an
earnest person look inward.
