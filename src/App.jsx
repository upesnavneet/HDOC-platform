import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Auth from './views/Auth';
import Dashboard from './views/Dashboard';
import Questions from './views/Questions';
import Debugging from './views/Debugging';
import Leaderboards from './views/Leaderboards';
import Profile from './views/Profile';
import CoordinatorDashboard from './views/CoordinatorDashboard';
import DistortionBackground from "./components/DistortionBackground";
import IntroSplash from './components/IntroSplash';
import AppFooter from './components/AppFooter';
import { motion } from 'framer-motion';

function MainAppContent() {
  const { currentUser, logout } = useApp();
  const [activeView, setActiveView] = useState('auth');

  // Enforce session routes or defaults
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setActiveView('coordinator');
      } else {
        // If participant, default to dashboard
        if (activeView === 'auth') {
          setActiveView('dashboard');
        }
      }
    } else {
      // If logged out and trying to access private tabs, redirect to auth
      const privateViews = ['dashboard', 'questions', 'debugging', 'profile', 'coordinator', 'admin'];
      if (privateViews.includes(activeView)) {
        setActiveView('auth');
      }
    }
  }, [currentUser]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'auth':
        return <Auth setActiveView={setActiveView} />;
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} />;
      case 'questions':
        return <Questions />;
      case 'debugging':
        return <Debugging />;
      case 'leaderboards':
        return <Leaderboards />;
      case 'profile':
        return <Profile />;
      case 'coordinator':
        return currentUser?.role === 'admin' ? <CoordinatorDashboard /> : <Auth setActiveView={setActiveView} />;
      case 'admin':
        return currentUser?.role === 'admin' ? <CoordinatorDashboard /> : <Auth setActiveView={setActiveView} />;
      default:
        return <Auth setActiveView={setActiveView} />;
    }
  };

  return (
    <motion.div 
      className="app-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      {/* Global liquid distortion background — always visible */}
      <DistortionBackground />

      <Navbar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        currentUser={currentUser} 
        logout={logout}
      />
      
      <main className="main-content-area">
        {renderActiveView()}
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
