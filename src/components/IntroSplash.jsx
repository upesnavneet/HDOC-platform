import { useEffect, useCallback } from 'react';
import { warn } from '../utils/logger';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function IntroSplash({ onComplete }) {
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
      warn('AudioContext failed to start:', error);
    }
  };

  useEffect(() => {
    if (prefersReducedMotion()) {
      finish();
      return undefined;
    }

    playTaDum();

    const t = setTimeout(finish, 5000);

    return () => {
      clearTimeout(t);
    };
  }, [finish]);

  return (
    <div className="intro-splash-overlay" role="region" aria-label="Introduction">
      <div className="intro-bg-glow" aria-hidden="true" />

      <div className="intro-logo-wrapper">
        <div className="intro-logo-zoom-container">
          <div className="intro-logo-glow-layer-1" aria-hidden="true" />
          <div className="intro-logo-glow-layer-2" aria-hidden="true" />

          <div
            className="intro-logos-row"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}
          >
            <img
              src="/acm-acmw-white.png"
              alt="ACM & ACM-W Logo"
              className="intro-logo-image responsive-logo"
              style={{ maxHeight: '100px', width: 'auto', objectFit: 'contain' }}
            />
            <img
              src="/logo-1.png"
              alt="HDOC Logo"
              className="intro-logo-image responsive-logo"
              style={{ maxHeight: '100px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
        </div>

        <div className="intro-subtitle">UPES ACM &amp; ACM-W STUDENT CHAPTERS</div>
      </div>
    </div>
  );
}
