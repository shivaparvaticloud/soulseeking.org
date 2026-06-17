# Upgrade Notes

A self-coded, privacy-sealed upgrade to soulseeking.org. Everything here is
authored in code — SVG, CSS, Canvas 2D and WebGL — with **zero third-party
runtime requests** and **no raster/stock media**. The guiding test for every
addition was: _does this help an earnest person look inward, or does it just
show off?_

---

## Design language — dark, cinematic, premium

The site is **dark-first**, in the register of Lusion / Oryzo / Porsche Dream
Machine / Palantir / Anduril: a near-black canvas, big tight modern-grotesk
display type, one restrained warm-gold accent, hairline rules, generous space,
and slow high-craft ambient motion. The contemplative Soul Seeking content sits
on this cosmos rather than on cream paper.

### Type
- **Display & chrome:** Space Grotesk (self-hosted variable,
  `@fontsource-variable/space-grotesk`) — big, tight, non-uppercase headings
  plus small tracked “kicker” micro-labels (`01 — Label`).
- **Reading & contemplation:** EB Garamond (self-hosted) for long-form prose and
  the italic pull-quotes — the soul of the page.

### Tokens
All colour and motion values are CSS custom properties in
`src/styles/global.css` (`:root`), mirrored in `tailwind.config.mjs`.

| Token | Value | Meaning |
|---|---|---|
| `--void` / `--abyss` | `#08080a` / `#0b0c10` | page base + recessed band |
| `--surface` / `--surface-2` | `#121319` / `#191b22` | raised panel + card |
| `--text` (`mist`) | `#eceae3` | warm off-white reading colour |
| `--text-dim` / `--text-faint` | `rgba(…,0.64)` / `0.40` | dimmed text scale |
| `--line` / `--line-strong` | `rgba(255,255,255,.09/.16)` | hairlines |
| `--gold` | `#e7c68b` | the one accent (used sparingly) |
| `--ochre` / `--ember` / `--oxblood` | `#cc914e` / `#cc5b3a` / `#692828` | warm secondary tones |
| `--beat` / `--breath` | `0.5s` / `7s` | UI transition vs ambient loop tempo |
| `--ease-soul` | `cubic-bezier(0.16,1,0.3,1)` | the one easing curve |

Tailwind exposes `void / abyss / surface / surface-2 / mist` alongside the warm
brand colours; `cosmos`/`cosmos-soft` remain as aliases.

### New building blocks (`global.css`)
`.kicker` (tracked micro-label), `.display-xl` / `.display-lg` (fluid display
headings), `.pull` (serif-italic pull-quote), `.card-soul` (hairline panel that
lifts on hover), `.glass`, `.aurora` (warm bloom), `.bg-grid` / `.bg-weave-dark`
(ambient texture), `.edge-fade`, plus a fixed film-grain over the canvas.

---

## Control system (buttons & links)

One vocabulary, defined in `global.css` under `@layer components`, used
everywhere:

- **`.btn-soul`** — PRIMARY. Filled amber; one per view (e.g. _Begin the Search_).
- **`.btn-soul-dark`** — SECONDARY. Outlined; supporting actions (e.g. _Explore_).
- **`.btn-link`** — TERTIARY. In-flow text link, underline on hover/focus.

Every control has a ≥44px tap target and distinct **hover / focus-visible /
active / disabled** states, with a visible candle-gold focus ring. Buttons read
as buttons; links read as links.

---

## Motion: on / off

A persistent control lives in the footer (`#motionToggle`, Layout). On first
load a tiny inline script honours a saved choice, else the OS
`prefers-reduced-motion` setting, and sets `data-motion="off"` on `<html>`
before paint (no flash). The global gate in `global.css`
(`html[data-motion='off'] *`) freezes all CSS animation and transition at once;
the 3D scene reads the same flag in JS and pauses. The choice is stored in
`localStorage` under `ss-motion` — a single UI preference, not tracking.

---

## Coded living illustrations

Reusable Astro components; pure SVG/CSS, no JS, no images, themeable, and each
disables itself under `prefers-reduced-motion`. Drop them anywhere.

| Component | Meaning | Used on |
|---|---|---|
| `ThreeModes.astro` | three luminous strands weaving — sattva/rajas/tamas | the Three Modes article |
| `TurningPages.astro` | an open book softly turning pages — _courses are small books_ | Courses index |
| `Starfield.astro` | drifting canvas star-field | home hero ambient |
| `Phyllotaxis.astro` | golden-spiral seed-head | home Gītā section |

**Removed in the dark redesign:** the sun-emblem graphics
(`SunburstRays.astro`, `SoaringBird.astro`) and the stick-figure
`MeditationFigures.astro` were deleted, along with their site-wide usages —
their job is now done by type, space, the ambient star-field and the flagship
3D scene. `LampKeeper.astro` remains in the repo but is no longer placed on a
page; drop in `<LampKeeper figure="light" />` anywhere if a focal motif is
wanted.

**Replace / re-theme:** each takes a `tone` and/or `size`/`width`/`height`
prop and a `class`. Colours come from the token palette; change a token and the
figures follow. To remove one, delete its `<Component />` usage — no other
wiring.

---

## Flagship 3D — “The Cosmos & the Sheaths”

`src/components/KosaScene.astro` renders the five concentric veils of the Self
(_pañca-maya-kośa_) as luminous wireframe shells in a candle-lit particle field,
with the Ātman glowing at the centre.

- **Three.js is bundled locally** (`three@0.160.0`, a dev-only `@types/three`),
  code-split into its own `/_astro/three.module.*.js` chunk that is **loaded
  only when the scene scrolls into view** (dynamic `import('three')` behind an
  `IntersectionObserver`). The home page ships ~5KB of island script; the heavy
  chunk never loads until reached, and never on the reduced-motion path.
- **Pauses** the render loop when off-screen, when the tab is hidden, or when
  Motion is off.
- **Pixel ratio capped** (≤2 desktop, ≤1.5 mobile); particle count is lighter on
  mobile. Pointer parallax is gentle — no disorienting camera moves.
- **Graceful fallbacks** — a still SVG composition of the same scene shows when
  WebGL is unavailable, `prefers-reduced-motion`, or `prefers-reduced-data` is
  set. The five sheaths are also **selectable by keyboard** (the chips under the
  stage), so the teaching is fully reachable with no WebGL at all; selecting one
  updates an `aria-live` caption and highlights its veil in 3D.

To edit the teaching text/colours/radii, see the `sheaths` array at the top of
the component (single source for both the 3D shells and the chips).

---

## Where assets live

- **Fonts** — self-hosted via `@fontsource-variable/space-grotesk` (display)
  and `@fontsource/eb-garamond` (reading), bundled into `/_astro`, long-cached.
  No Google Fonts, no external requests.
- **Three.js** — `node_modules/three`, bundled to `/_astro/three.module.*.js`
  at build (same-origin, content-hashed, `immutable` cached).
- **All textures** (particle/glow sprites) are generated at runtime on a
  `<canvas>` — no image files.
- **Backgrounds/textures** (stucco, sacred-geometry) are inline SVG data-URIs in
  `global.css`.

There are no `/public` images beyond `favicon.svg`.

---

## Security & privacy

- **Zero cross-origin requests at runtime** — verified against the build: no
  external `href`/`src` in any page. Self-host everything.
- **Headers** (`public/_headers`): HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, COOP/CORP
  `same-origin`, a locked-down `Permissions-Policy` (camera/mic/geo/usb/payment/
  sensors + `interest-cohort` all `()`), and a strict CSP.
- **CSP**: `default-src 'self'`; `img-src 'self' data:`; `font-src 'self'`;
  `connect-src 'self'`; `object-src 'none'`; `frame-ancestors 'none'`;
  `base-uri 'self'`; `form-action 'self'`; `upgrade-insecure-requests`. Removed
  the previously-needed `wasm-unsafe-eval`.
  - **Known residual:** `script-src` and `style-src` still allow
    `'unsafe-inline'`. On a fully-static host (Cloudflare Pages) nonces aren’t
    possible, and the site relies on a pre-paint inline script plus Astro’s
    scoped inline styles and `define:vars` islands (whose ids vary per build, so
    hashes are unstable). Removing `'unsafe-inline'` would require refactoring
    every inline script to a bundled module with `data-*` inputs — a follow-up.
    All scripts are first-party and `connect-src 'self'` blocks exfiltration
    regardless.
- **No cookies, no trackers, no analytics, no service worker.** The only client
  storage is the `ss-motion` UI preference in `localStorage`.

---

## Performance & accessibility

- Near-zero JS site-wide; only the 3D island ships meaningful JS, and only when
  visited. Hashed bundles are `immutable`-cached.
- All animation honours `prefers-reduced-motion`; heavy visuals honour
  `prefers-reduced-data`; both honour the manual Motion toggle.
- Decorative coded art is `aria-hidden`; the 3D teaching is keyboard-operable
  with an `aria-live` caption. Focus order is logical and focus rings are
  visible.

> Not yet automated here: a CI Lighthouse run. The build is structured to hit
> the 95+ budget (static HTML, deferred 3D, self-hosted fonts), but the score
> should be confirmed on the live deploy.
