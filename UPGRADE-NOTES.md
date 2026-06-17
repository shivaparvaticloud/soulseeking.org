# Upgrade Notes

A self-coded, privacy-sealed upgrade to soulseeking.org. Everything here is
authored in code — SVG, CSS, Canvas 2D and WebGL — with **zero third-party
runtime requests** and **no raster/stock media**. The guiding test for every
addition was: _does this help an earnest person look inward, or does it just
show off?_

---

## Design tokens

All colour and motion values live as CSS custom properties in
`src/styles/global.css` (`:root`). Five warm hues over a near-black base;
everything else is a shade.

| Token | Value | Meaning |
|---|---|---|
| `--ink` / `--ink-soft` | `#15110d` / `#241b14` | cosmos base + raised surface |
| `--candle` | `#e7c68b` | warm candle-gold accent |
| `--ember` | `#cc5b3a` | living flame |
| `--ochre` | `#cc914e` | amber — primary action tone |
| `--oxblood` | `#692828` | deep ember-red |
| `--earth` | `#604c44` | reading ink on light |
| `--cream` / `--parchment` | `#eeede3` / `#e3dac9` | light reading surfaces |
| `--beat` / `--breath` | `0.618s` / `6s` | UI transition vs ambient loop tempo |
| `--ease-soul` | `cubic-bezier(0.16,1,0.3,1)` | the one easing curve |

The Tailwind palette (`tailwind.config.mjs`) mirrors these so utility classes
stay in sync (`ember` added alongside the existing brand colours).

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
| `LampKeeper.astro` | seated figure cupping a breathing flame — _keep the lamp lit_ | home “Inward Guide” |
| `MeditationFigures.astro` | breathing yoga/meditation figures + divine aura | site-wide headers/footer |
| `ThreeModes.astro` | three luminous strands weaving — sattva/rajas/tamas | the Three Modes article |
| `TurningPages.astro` | an open book softly turning pages — _courses are small books_ | Courses index |

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

- **Fonts** — self-hosted via `@fontsource/eb-garamond` (bundled into
  `/_astro`, long-cached). No Google Fonts.
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
