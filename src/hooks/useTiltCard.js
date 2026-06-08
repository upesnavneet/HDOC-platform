import { useRef, useState, useCallback } from 'react';

/**
 * useTiltCard – mirrors the pressed-in effect on the auth/login card.
 *
 * @param {number} maxTilt   - Maximum tilt in degrees (default 8, login uses 15)
 * @param {number} shadowMul - Multiplier for inset shadow depth (default 0.6)
 */
export function useTiltCard(maxTilt = 8, shadowMul = 0.6) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const onMouseMove = useCallback((e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top)  / rect.height;
    const cx = nx - 0.5;
    const cy = ny - 0.5;

    const rotateX = -(cy * maxTilt).toFixed(2);
    const rotateY =  (cx * maxTilt).toFixed(2);

    const sx = (cx * 28 * shadowMul).toFixed(1);
    const sy = (cy * 18 * shadowMul).toFixed(1);
    const depth = Math.round(32 * shadowMul);

    setStyle({
      transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01,1.01,1.01)`,
      background: `
        radial-gradient(
          ellipse 60% 50% at ${(nx * 100).toFixed(1)}% ${(ny * 100).toFixed(1)}%,
          rgba(8, 6, 22, 0.45) 0%,
          rgba(26, 25, 83, 0.2) 55%,
          transparent     100%
        ),
        rgba(35, 47, 114, 0.58)
      `,
      boxShadow: [
        `0 0 0 1px rgba(54, 173, 163, 0.12)`,
        `0 12px 36px rgba(8, 6, 22, 0.55)`,
        `inset ${sx}px ${sy}px ${depth}px rgba(8, 6, 22, 0.42)`,
        `inset ${(-cx * 10).toFixed(1)}px ${(-cy * 7).toFixed(1)}px 10px rgba(54, 173, 163, 0.04)`,
      ].join(', '),
      zIndex: 2,
    });
  }, [maxTilt, shadowMul]);

  const onMouseLeave = useCallback(() => {
    setStyle({});
  }, []);

  return { ref, style, onMouseMove, onMouseLeave };
}
