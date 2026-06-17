// Orchestrates the FX layer: background + cursor + smooth-scroll choreography.
// Boots once (survives View-Transition navigations), rebinds per page, and
// fully stands down under prefers-reduced-motion or the footer Motion toggle.
import type { Background } from './background';
import type { Cursor } from './cursor';
import type { ScrollSystem } from './scroll';
import {
  isTouch,
  motionEnabled,
  onMotionChange,
  prefersReducedMotion,
} from './env';

let bg: Background | null = null;
let cursor: Cursor | null = null;
let scroll: ScrollSystem | null = null;
let booting = false;
let booted = false;

function pageName(): string {
  return document.body?.dataset.fxPage || 'default';
}

async function startHeavy() {
  if (booting || prefersReducedMotion() || !motionEnabled()) return;
  booting = true;

  const canvas = document.getElementById('fx-canvas') as HTMLCanvasElement | null;
  if (canvas && !bg) {
    const { createBackground } = await import('./background');
    bg = await createBackground(canvas);
    if (bg) {
      bg.setPage(pageName());
      window.addEventListener('resize', () => bg && bg.resize(), { passive: true });
      window.addEventListener(
        'pointermove',
        (e) => {
          if (!bg) return;
          bg.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
        },
        { passive: true }
      );
      document.addEventListener('visibilitychange', () => {
        if (!bg) return;
        document.hidden || !motionEnabled() ? bg.pause() : bg.play();
      });
      bg.play();
    }
  }

  if (!scroll) {
    const { createScroll } = await import('./scroll');
    // On Home the background is a fixed divine field — text scrolls, it does not.
    // Elsewhere, scroll "descends inward".
    scroll = await createScroll({
      onProgress: (p) => bg && bg.setScroll(pageName() === 'home' ? 0.4 : p),
    });
    scroll.bindPage();
  }
  booting = false;
}

function enableCursor() {
  // The custom cursor is a pointer, not décor — keep it on for every page and
  // every motion state (it snaps instead of trailing under reduced motion).
  // Touch devices keep their native interaction.
  if (isTouch()) return;
  const dot = document.getElementById('fx-cursor-dot');
  const ring = document.getElementById('fx-cursor-ring');
  if (!dot || !ring) return;
  if (!cursor) {
    import('./cursor').then(({ createCursor }) => {
      cursor = createCursor(dot, ring);
      cursor.enable();
    });
  } else {
    cursor.enable();
  }
}

function standDown() {
  // Calm the heavy motion but leave the cursor visible.
  bg?.pause();
}

function perPage() {
  const name = pageName();
  if (bg) {
    bg.setPage(name);
    if (name === 'home') bg.setScroll(0.4); // hold the home field steady
  }
  if (scroll) {
    scroll.bindPage();
    scroll.refresh();
  }
}

export function boot() {
  if (booted) return;
  booted = true;

  enableCursor();
  startHeavy();

  // Re-evaluate when the visitor flips the Motion toggle.
  onMotionChange(() => {
    if (motionEnabled() && !prefersReducedMotion()) {
      enableCursor();
      startHeavy().then(perPage);
      bg?.play();
    } else {
      standDown();
    }
  });

  // Per-navigation (Astro View Transitions) — body is swapped, so re-read the
  // page tint and rebind scroll triggers to the new DOM.
  document.addEventListener('astro:page-load', () => {
    enableCursor();
    if (motionEnabled() && !prefersReducedMotion()) {
      startHeavy().then(perPage);
    }
  });

  // Pause heavy work while a transition is mid-swap.
  document.addEventListener('astro:before-swap', () => bg?.pause());
  document.addEventListener('astro:after-swap', () => {
    if (motionEnabled() && !prefersReducedMotion()) bg?.play();
  });
}
