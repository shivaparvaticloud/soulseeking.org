// Shared environment + motion helpers for the FX layer.
// Everything degrades to "off" when the visitor (or their OS) asks for calm.

export const isBrowser = typeof window !== 'undefined';

function mm(q: string): boolean {
  return isBrowser && typeof window.matchMedia === 'function'
    ? window.matchMedia(q).matches
    : false;
}

export function prefersReducedMotion(): boolean {
  return mm('(prefers-reduced-motion: reduce)');
}

export function prefersReducedData(): boolean {
  return mm('(prefers-reduced-data: reduce)');
}

/** The persistent footer toggle / pre-paint script flips data-motion on <html>. */
export function motionOff(): boolean {
  return (
    !isBrowser ||
    document.documentElement.getAttribute('data-motion') === 'off'
  );
}

export function motionEnabled(): boolean {
  return isBrowser && !motionOff();
}

export function isTouch(): boolean {
  return mm('(pointer: coarse)') || (isBrowser && 'ontouchstart' in window);
}

/** Lighter WebGL budget on phones / small or low-power devices. */
export function isSmallScreen(): boolean {
  return isBrowser && window.innerWidth < 768;
}

export function onMotionChange(fn: () => void): void {
  if (isBrowser) window.addEventListener('ss-motion-change', fn);
}

export function onPageLoad(fn: () => void): void {
  if (isBrowser) document.addEventListener('astro:page-load', fn);
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const clamp = (v: number, lo = 0, hi = 1): number =>
  Math.min(hi, Math.max(lo, v));
