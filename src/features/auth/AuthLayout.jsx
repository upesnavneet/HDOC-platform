import { useState, useEffect } from 'react';
import GradientBlinds from '../../components/GradientBlinds';
import BorderGlow from '../../components/BorderGlow';
import LetterGlitch from '../../components/LetterGlitch';

export default function AuthLayout({ children, alerts, mode }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="auth-view-container"
      style={{ position: 'relative', overflow: 'hidden', fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Glass overlay that appears when scrolling */}
      <div
        className={`glass-scroll-overlay ${isScrolled ? 'visible' : ''}`}
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {mode === 'login' ? (
          <LetterGlitch
            glitchSpeed={50}
            centerVignette={true}
            outerVignette={false}
            smooth
            speed={10}
            glitchColors={['#2185D5', '#3a4750', '#f3f3f3']}
            colors={['#2185D5', '#3a4750', '#f3f3f3']}
            showCenterVignette
            showOuterVignette={false}
          />
        ) : (
          <LetterGlitch
            glitchSpeed={50}
            centerVignette={true}
            outerVignette={false}
            smooth={true}
          />
        )}
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
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'transparent',
          backdropFilter: 'blur(24px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          border: 'none',
          boxShadow: 'none',
        }}
        disableHover={true}
      >
        <div className="auth-header-logo">
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'inherit', fontWeight: 700 }}>
            100 Days of Code
          </h1>
        </div>
        {alerts}
        {children}
      </BorderGlow>
    </div>
  );
}
