import GradientBlinds from '../../components/GradientBlinds';
import BorderGlow from '../../components/BorderGlow';
import Shuffle from '../../components/Shuffle';
import LetterGlitch from '../../components/LetterGlitch';

export default function AuthLayout({ children, alerts }) {
  return (
    <div className="auth-view-container" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
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
          <Shuffle
            text="100 Days of Code"
            shuffleDirection="right"
            duration={0.6}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover
            respectReducedMotion={true}
            loop
            loopDelay={1.1}
            tag="h1"
            style={{ fontSize: '1.75rem', fontFamily: 'inherit', fontWeight: 700 }}
          />
        </div>
        {alerts}
        {children}
      </BorderGlow>
    </div>
  );
}