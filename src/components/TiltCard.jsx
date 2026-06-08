import { useTiltCard } from '../hooks/useTiltCard';

export default function TiltCard({ className, children, maxTilt = 8, shadowMul = 0.6 }) {
  const { ref, style, onMouseMove, onMouseLeave } = useTiltCard(maxTilt, shadowMul);

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}
