import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import IntroSplash from './components/IntroSplash';
import AppFooter from './components/AppFooter';
import AppRoutes from './routes/AppRoutes';
import { AppErrorBoundary } from './components/ErrorBoundary';

// H11: Removed framer-motion import from root bundle (~50KB).
// The fade-in is now a CSS animation — same visual, zero JS cost.

function MainAppContent() {
  return (
    <div className="app-wrapper app-fade-in">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="main-content-area" tabIndex={-1}>
        <AppRoutes />
      </main>
      <AppFooter />
    </div>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppProvider>
          {showIntro ? <IntroSplash onComplete={() => setShowIntro(false)} /> : <MainAppContent />}
        </AppProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
