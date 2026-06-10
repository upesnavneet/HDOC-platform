import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import IntroSplash from './components/IntroSplash';
import AppFooter from './components/AppFooter';
import AppRoutes from './routes/AppRoutes';
import { motion } from 'framer-motion';

function MainAppContent() {
  return (
    <motion.div
      className="app-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="main-content-area" tabIndex={-1}>
        <AppRoutes />
      </main>
      <AppFooter />
    </motion.div>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <AuthProvider>
      <AppProvider>
        {showIntro ? (
          <IntroSplash onComplete={() => setShowIntro(false)} />
        ) : (
          <MainAppContent />
        )}
      </AppProvider>
    </AuthProvider>
  );
}
