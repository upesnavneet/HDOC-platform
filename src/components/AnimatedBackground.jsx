import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: -1,
        background: '#121358',
      }}
    >
      <motion.div
        animate={{
          x: [0, 150, -80, 0],
          y: [0, -120, 100, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: '#36ADA3',
          filter: 'blur(180px)',
          opacity: 0.08,
          top: -150,
          left: -100,
        }}
      />

      <motion.div
        animate={{
          x: [0, -200, 100, 0],
          y: [0, 120, -80, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: '#2F578A',
          filter: 'blur(170px)',
          opacity: 0.1,
          bottom: -120,
          right: -80,
        }}
      />

      <motion.div
        animate={{
          x: [0, 80, -120, 0],
          y: [0, -80, 120, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: '#232F72',
          filter: 'blur(150px)',
          opacity: 0.15,
          top: '35%',
          left: '35%',
        }}
      />
    </div>
  );
}
