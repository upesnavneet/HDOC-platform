import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Auth from './views/Auth';
import Dashboard from './views/Dashboard';
import Questions from './views/Questions';
import Debugging from './views/Debugging';
import Leaderboards from './views/Leaderboards';
import Profile from './views/Profile';
import AdminPanel from './views/AdminPanel';
import DistortionBackground from "./components/DistortionBackground";

function MainAppContent() {
  const { currentUser, logout } = useApp();
  const [activeView, setActiveView] = useState('auth');

  // Enforce session routes or defaults
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setActiveView('admin');
      } else {
        // If participant, default to dashboard
        if (activeView === 'auth') {
          setActiveView('dashboard');
        }
      }
    } else {
      // If logged out and trying to access private tabs, redirect to auth
      const privateViews = ['dashboard', 'questions', 'debugging', 'profile', 'admin'];
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
      case 'admin':
        return currentUser?.role === 'admin' ? <AdminPanel /> : <Auth setActiveView={setActiveView} />;
      default:
        return <Auth setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="app-wrapper">
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

      <footer className="footer-container">
        <p>© 2026 Association for Computing Machinery (ACM) Student Chapter. All Rights Reserved.</p>
        <p>Developed for the 100 Days of Code Chapter Challenge Season.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
