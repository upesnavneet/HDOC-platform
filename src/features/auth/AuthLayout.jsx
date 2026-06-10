import GradientBlinds from '../../components/GradientBlinds';
import BorderGlow from '../../components/BorderGlow';

export default function AuthLayout({ children, alerts }) {
  return (
    <div className="auth-view-container" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <GradientBlinds
          gradientColors={['#03346E', '#0a0b10', '#6EACDA']}
          angle={47}
          noise={0.13}
          blindCount={9}
          blindMinWidth={60}
          spotlightRadius={0.35}
          spotlightSoftness={1}
          spotlightOpacity={1}
          mouseDampening={0.21}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="lighten"
          color1="#03346E"
          color2="#0a0b10"
        />
      </div>

      <BorderGlow
        className="auth-card-wrapper press-card"
        edgeSensitivity={30}
        glowColor="205 60 64"
        backgroundColor="transparent"
        borderRadius={8}
        glowRadius={40}
        glowIntensity={1}
        coneSpread={25}
        animated={false}
        colors={['#6EACDA', '#03346E', '#E2E2B6']}
        fillOpacity={0.15}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="auth-header-logo">
          <h1>100 Days of Code</h1>
        </div>
        {alerts}
        {children}
      </BorderGlow>
    </div>
  );
}
