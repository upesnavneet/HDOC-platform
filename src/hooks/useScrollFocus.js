import { useEffect, useRef } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Highlights the dashboard section nearest the viewport - opacity only, no blur (a11y).
 */
export function useVerticalSectionFocus() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    if (prefersReducedMotion()) {
      return undefined;
    }

    const sections = () => Array.from(root.querySelectorAll('[data-dashboard-focus]'));

    const applyFocus = (nodes, bestIdx) => {
      nodes.forEach((el, i) => {
        const offset = Math.abs(i - bestIdx);
        const opacity = offset === 0 ? 1 : offset === 1 ? 0.88 : 0.78;
        el.style.opacity = String(opacity);
        el.style.filter = 'none';
        el.classList.toggle('dashboard-focus-active', offset === 0);
      });
    };

    const update = () => {
      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const nodes = sections();
      if (!nodes.length) return;

      const atBottom = scrollY + vh >= docHeight - 48;
      const atTop = scrollY <= 48;

      const lastRect = nodes[nodes.length - 1].getBoundingClientRect();
      const lastVisibleHeight = Math.max(
        0,
        Math.min(vh, lastRect.bottom) - Math.max(0, lastRect.top)
      );
      const lastSectionDominant = lastVisibleHeight / vh >= 0.35 && lastRect.top < vh * 0.6;
      const lastSectionAnchored = lastRect.bottom <= vh + 64;

      if (atBottom || lastSectionDominant || lastSectionAnchored) {
        applyFocus(nodes, nodes.length - 1);
        return;
      }

      if (atTop) {
        applyFocus(nodes, 0);
        return;
      }

      const focusLine = vh * 0.42;
      let bestIdx = 0;
      let bestScore = -Infinity;

      nodes.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(vh, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibilityRatio = visibleHeight / Math.min(Math.max(rect.height, 1), vh);

        const center = rect.top + rect.height / 2;
        const centerDistance = Math.abs(focusLine - center);
        const centerScore = 1 - clamp(centerDistance / (vh * 0.55), 0, 1);

        const score = visibilityRatio * 0.65 + centerScore * 0.35;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      });

      applyFocus(nodes, bestIdx);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      sections().forEach((el) => {
        el.style.opacity = '';
        el.style.filter = '';
        el.classList.remove('dashboard-focus-active');
      });
    };
  }, []);

  return ref;
}
