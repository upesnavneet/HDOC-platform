import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function IntroSplash({ onComplete }) {
  const [stage, setStage] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const finish = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const playTaDum = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const filter1 = ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 1.2);

      filter1.type = 'lowpass';
      filter1.frequency.setValueAtTime(150, ctx.currentTime);

      osc1.connect(gain1);
      gain1.connect(filter1);
      filter1.connect(ctx.destination);

      gain1.gain.setValueAtTime(0.001, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.15);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      osc1.start();
      osc1.stop(ctx.currentTime + 1.6);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const osc3 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        const filter2 = ctx.createBiquadFilter();

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(110, ctx.currentTime);
        osc3.type = 'sawtooth';
        osc3.frequency.setValueAtTime(165, ctx.currentTime);

        filter2.type = 'lowpass';
        filter2.frequency.setValueAtTime(600, ctx.currentTime);

        osc2.connect(gain2);
        osc3.connect(gain2);
        gain2.connect(filter2);
        filter2.connect(ctx.destination);

        gain2.gain.setValueAtTime(0.001, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

        osc2.start();
        osc3.start();
        osc2.stop(ctx.currentTime + 1.5);
        osc3.stop(ctx.currentTime + 1.5);
      }, 250);
    } catch (error) {
      console.warn('AudioContext failed to start:', error);
    }
  };

  useEffect(() => {
    if (prefersReducedMotion()) {
      finish();
      return undefined;
    }

    const t1 = setTimeout(() => setStage(2), 200);
    const t2 = setTimeout(() => setStage(3), 4200);
    const t3 = setTimeout(finish, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [finish]);

  const handleEnableSound = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      playTaDum();
    }
  };

  return (
    <div className="intro-splash-overlay" role="region" aria-label="Introduction">
      <div className="intro-bg-glow" aria-hidden="true" />

      <button type="button" className="intro-skip-btn" onClick={finish}>
        Skip Intro
      </button>

      <AnimatePresence>
        {stage >= 2 && (
          <motion.div
            className="intro-logo-wrapper"
            initial={{ scale: 0.3, opacity: 0, filter: 'blur(20px)' }}
            animate={
              stage === 3
                ? { scale: 1.28, opacity: [1, 0.8, 0], filter: 'blur(0px)' }
                : { scale: [0.3, 1.03, 1], opacity: 1, filter: 'blur(0px)' }
            }
            transition={
              stage === 3
                ? { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
                : { duration: 1.5, ease: 'easeOut' }
            }
          >
            <div className="intro-logo-glow-layer-1" aria-hidden="true" />
            <div className="intro-logo-glow-layer-2" aria-hidden="true" />

            <div className="intro-logos-row">
              <img src="/logo.png" alt="ACM Logo" className="intro-logo-image" width="120" height="120" />
              <div className="intro-logos-divider" aria-hidden="true" />
              <img src="/favicon2.png" alt="ACM-W Logo" className="intro-logo-image" width="100" height="100" />
            </div>

            <motion.div
              className="intro-subtitle"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              UPES ACM &amp; ACM-W STUDENT CHAPTERS
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasInteracted && stage < 3 && (
        <button type="button" className="intro-tap-hint intro-sound-btn" onClick={handleEnableSound}>
          Enable Sound
        </button>
      )}
    </div>
  );
}
