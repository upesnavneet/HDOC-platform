import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroSplash({ onComplete }) {
  const [stage, setStage] = useState(0); // 0: initial, 1: laser/lines, 2: logo reveal, 3: zoom out/complete
  const [hasInteracted, setHasInteracted] = useState(false);

  // Play synthetic "Ta-Dum" audio using Web Audio API
  const playTaDum = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Stage 1: Deep Rumble (The "Ta")
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const filter1 = ctx.createBiquadFilter();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // Low A
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
      
      // Stage 2: Resonant Chord Impact (The "Dum")
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const osc3 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        const filter2 = ctx.createBiquadFilter();
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(110, ctx.currentTime); // A2
        osc2.frequency.linearRampToValueAtTime(115, ctx.currentTime + 1.0);
        
        osc3.type = 'sawtooth';
        osc3.frequency.setValueAtTime(165, ctx.currentTime); // E3 (Fifth)
        osc3.frequency.linearRampToValueAtTime(170, ctx.currentTime + 1.0);
        
        filter2.type = 'lowpass';
        filter2.frequency.setValueAtTime(600, ctx.currentTime);
        filter2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.2);
        
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
    const t1 = setTimeout(() => setStage(2), 200);
    const t2 = setTimeout(() => setStage(3), 4200);
    const t3 = setTimeout(() => onComplete(), 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  const handleStartSound = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      playTaDum();
    }
  };

  return (
    <div 
      className="intro-splash-overlay" 
      onClick={handleStartSound}
      onMouseEnter={handleStartSound}
    >
      {/* Background radial highlight */}
      <div className="intro-bg-glow" />

      {/* Stage 2 & 3: The Logo Zoom */}
      <AnimatePresence>
        {stage >= 2 && (
          <motion.div
            className="intro-logo-wrapper"
            initial={{ scale: 0.3, opacity: 0, filter: 'blur(20px)' }}
            animate={stage === 3 ? {
              scale: 1.28,
              opacity: [1, 0.8, 0],
              filter: 'blur(0px)',
            } : {
              scale: [0.3, 1.03, 1],
              opacity: 1,
              filter: 'blur(0px)',
            }}
            transition={stage === 3 ? {
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1]
            } : {
              duration: 1.5,
              ease: "easeOut"
            }}
          >
            {/* Multi-layered glow for absolute premium styling */}
            <div className="intro-logo-glow-layer-1" />
            <div className="intro-logo-glow-layer-2" />
            
            <div className="intro-logos-row">
              <img 
                src="/logo.png" 
                alt="ACM Logo" 
                className="intro-logo-image" 
              />
              <div className="intro-logos-divider" />
              <img 
                src="/favicon2.png" 
                alt="ACM-W Logo" 
                className="intro-logo-image" 
              />
            </div>

            {/* Pulsing light sweep text */}
            <motion.div 
              className="intro-subtitle"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              UPES ACM & ACM-W STUDENT CHAPTERS
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle interaction tip to unmute audio context on first user click */}
      {!hasInteracted && stage < 3 && (
        <div className="intro-tap-hint">
          <span>Click anywhere to enable sound</span>
        </div>
      )}
    </div>
  );
}
