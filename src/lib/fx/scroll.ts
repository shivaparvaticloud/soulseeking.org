// Smooth scroll (Lenis) + scroll choreography (GSAP/ScrollTrigger).
// Drives the "descend inward" feeling and the line-by-line reveal of headings
// and Sanskrit quotes. Loaded only when motion is enabled — content is fully
// visible without it, so nothing here is required to read the page.
import { clamp } from './env';

type GSAP = typeof import('gsap')['gsap'];

export interface ScrollSystem {
  bindPage(): void;
  refresh(): void;
  destroy(): void;
}

interface Opts {
  onProgress?: (p: number) => void;
}

export async function createScroll(opts: Opts = {}): Promise<ScrollSystem> {
  const [{ default: Lenis }, gsapMod, stMod] = await Promise.all([
    import('lenis'),
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ]);
  const gsap: GSAP = gsapMod.gsap;
  const ScrollTrigger = stMod.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    lerp: 0.09,
    wheelMultiplier: 0.95,
    smoothWheel: true,
  });

  lenis.on('scroll', () => {
    ScrollTrigger.update();
    if (opts.onProgress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      opts.onProgress(clamp(max > 0 ? window.scrollY / max : 0));
    }
  });

  gsap.ticker.add((time: number) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  let ctx: ReturnType<GSAP['context']> | null = null;

  // Split a text element into word-spans grouped into line-wrappers so each
  // visual line can rise independently.
  function splitLines(el: HTMLElement): HTMLElement[] {
    if (el.dataset.split === 'done') {
      return Array.from(el.querySelectorAll<HTMLElement>('.fx-line > span'));
    }
    const words = (el.textContent || '').replace(/\s+/g, ' ').trim().split(' ');
    el.textContent = '';
    // Inline word spans separated by real space text-nodes, so spacing survives.
    const wordEls = words.map((w) => {
      const s = document.createElement('span');
      s.textContent = w;
      el.appendChild(s);
      el.appendChild(document.createTextNode(' '));
      return s;
    });
    // group words by vertical offset into visual lines
    const lines: HTMLElement[][] = [];
    let top: number | null = null;
    for (const w of wordEls) {
      const t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
      lines[lines.length - 1].push(w);
    }
    el.textContent = '';
    const inners: HTMLElement[] = [];
    for (const group of lines) {
      const mask = document.createElement('span');
      mask.className = 'fx-line';
      const inner = document.createElement('span');
      inner.style.display = 'block';
      group.forEach((w, i) => {
        inner.appendChild(w);
        if (i < group.length - 1) inner.appendChild(document.createTextNode(' '));
      });
      mask.appendChild(inner);
      el.appendChild(mask);
      inners.push(inner);
    }
    el.dataset.split = 'done';
    return inners;
  }

  function bindPage() {
    ctx?.revert();
    ctx = gsap.context(() => {
      // Block reveals — rise + fade as they enter
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 28,
          autoAlpha: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });

      // Line-by-line reveals for headings / Sanskrit quotes
      gsap.utils.toArray<HTMLElement>('[data-reveal-lines]').forEach((el) => {
        const lines = splitLines(el);
        gsap.set(el, { autoAlpha: 1 });
        gsap.from(lines, {
          yPercent: 115,
          duration: 1.2,
          ease: 'power4.out',
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });

      // Sacred-geometry SVGs that draw themselves on scroll
      gsap.utils.toArray<SVGGeometryElement>('[data-draw] [data-draw-path]').forEach((path) => {
        let len = 0;
        try { len = path.getTotalLength(); } catch { len = 0; }
        if (!len) return;
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: (path.closest('[data-draw]') as Element) || path,
            start: 'top 85%',
            end: 'bottom 55%',
            scrub: true,
          },
        });
      });
    });
  }

  return {
    bindPage,
    refresh() { ScrollTrigger.refresh(); },
    destroy() {
      ctx?.revert();
      gsap.ticker.remove((t: number) => lenis.raf(t * 1000));
      lenis.destroy();
      ScrollTrigger.getAll().forEach((s) => s.kill());
    },
  };
}
