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

  const onMouseMove = useCallback(
    (e) => {
      const card = ref.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const cx = nx - 0.5;
      const cy = ny - 0.5;

      const rotateX = -(cy * maxTilt).toFixed(2);
      const rotateY = (cx * maxTilt).toFixed(2);

      const sx = (cx * 28 * shadowMul).toFixed(1);
      const sy = (cy * 18 * shadowMul).toFixed(1);
      const depth = Math.round(32 * shadowMul);

      const classes = card.className || '';
      let baseBg = 'var(--bg-card)';
      if (classes.includes('hero-panel-deep')) {
        baseBg = 'var(--bg-card)';
      } else if (classes.includes('primary')) {
        baseBg = 'rgba(54, 173, 163, 0.08)';
      } else if (classes.includes('auth-card-wrapper')) {
        baseBg = 'rgba(75, 86, 148, 0.72)';
      } else if (classes.includes('rule-card')) {
        baseBg = 'var(--bg-panel)';
      }

      const isUfoDisabled =
        classes.includes('dashboard-hero-left') || classes.includes('challenge-card');

      const backgroundStyle = isUfoDisabled
        ? baseBg
        : `
        radial-gradient(
          ellipse 60% 50% at ${(nx * 100).toFixed(1)}% ${(ny * 100).toFixed(1)}%,
          rgba(9, 12, 40, 0.45) 0%,
          rgba(75, 86, 148, 0.20) 55%,
          transparent     100%
        ),
        ${baseBg}
      `;

      setStyle({
        transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01,1.01,1.01)`,
        background: backgroundStyle,
        boxShadow: [
          `0 8px 24px rgba(9, 12, 40, 0.4)`,
          `inset ${sx}px ${sy}px ${depth}px rgba(9, 12, 40, 0.38)`,
        ].join(', '),
        zIndex: 2,
      });
    },
    [maxTilt, shadowMul]
  );

  const onMouseLeave = useCallback(() => {
    setStyle({});
  }, []);

  return { ref, style, onMouseMove, onMouseLeave };
}
