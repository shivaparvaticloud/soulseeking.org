// A quiet custom cursor: a soft gold dot with a trailing ring that widens over
// interactive elements. Pointer-fine devices only; never shown on touch or when
// motion is calmed. Falls back silently to the native cursor.
import { isTouch, lerp, prefersReducedMotion } from './env';

export interface Cursor {
  enable(): void;
  disable(): void;
  destroy(): void;
}

export function createCursor(dot: HTMLElement, ring: HTMLElement): Cursor {
  let raf = 0;
  let active = false;
  let smooth = 0.18;
  const m = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = { x: m.x, y: m.y };

  const onMove = (e: PointerEvent) => {
    m.x = e.clientX;
    m.y = e.clientY;
    dot.style.transform = `translate(${m.x}px, ${m.y}px)`;
  };

  const interactive = 'a, button, [role="tab"], [data-cursor], input, textarea, summary, label';
  const onOver = (e: Event) => {
    const t = e.target as Element | null;
    if (t && t.closest && t.closest(interactive)) ring.classList.add('is-hover');
  };
  const onOut = (e: Event) => {
    const t = e.target as Element | null;
    if (t && t.closest && t.closest(interactive)) ring.classList.remove('is-hover');
  };
  const onDown = () => ring.classList.add('is-down');
  const onUp = () => ring.classList.remove('is-down');

  function tick() {
    r.x = lerp(r.x, m.x, smooth);
    r.y = lerp(r.y, m.y, smooth);
    ring.style.transform = `translate(${r.x}px, ${r.y}px)`;
    if (active) raf = requestAnimationFrame(tick);
  }

  return {
    enable() {
      if (active || isTouch()) return;
      active = true;
      // Under reduced motion the ring snaps rather than trails — still visible.
      smooth = prefersReducedMotion() ? 1 : 0.18;
      document.documentElement.classList.add('has-custom-cursor');
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerover', onOver, { passive: true });
      window.addEventListener('pointerout', onOut, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('pointerup', onUp, { passive: true });
      raf = requestAnimationFrame(tick);
    },
    disable() {
      if (!active) return;
      active = false;
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerout', onOut);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      if (raf) cancelAnimationFrame(raf);
    },
    destroy() { this.disable(); },
  };
}
