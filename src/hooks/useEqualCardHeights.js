import { useEffect, useRef } from 'react';

const CARD_SELECTOR = '.challenge-card-shell';
const MIN_HEIGHT = 520;
const MAX_HEIGHT = 680;

export function useEqualCardHeights(deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const stack = ref.current;
    if (!stack) return undefined;

    const syncHeights = () => {
      const shells = stack.querySelectorAll(CARD_SELECTOR);
      if (shells.length < 2) return;

      shells.forEach((shell) => {
        shell.style.height = '';
        shell.style.minHeight = '';
        shell.style.maxHeight = '';
      });

      const viewportCap = Math.min(MAX_HEIGHT, Math.round(window.innerHeight * 0.72));
      const target = Math.max(MIN_HEIGHT, viewportCap);

      shells.forEach((shell) => {
        shell.style.height = `${target}px`;
        shell.style.minHeight = `${target}px`;
        shell.style.maxHeight = `${target}px`;
      });
    };

    syncHeights();
    window.addEventListener('resize', syncHeights);

    const observer = new ResizeObserver(syncHeights);
    observer.observe(stack);
    stack.querySelectorAll(CARD_SELECTOR).forEach((shell) => observer.observe(shell));

    return () => {
      window.removeEventListener('resize', syncHeights);
      observer.disconnect();
    };
  }, deps);

  return ref;
}
