import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Auth from './views/Auth';
import Dashboard from './views/Dashboard';
import Questions from './views/Questions';
import Debugging from './views/Debugging';
import Leaderboards from './views/Leaderboards';
import Profile from './views/Profile';
import AdminPanel from './views/AdminPanel';
import DistortionBackground from "./components/DistortionBackground";

function PrivateRoute({ children, adminOnly = false }) {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function MainAppContent() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamically derive activeView from location.pathname for Navbar highlight
  const path = location.pathname;
  let activeView = 'auth';
  if (path === '/dashboard') activeView = 'dashboard';
  else if (path === '/questions') activeView = 'questions';
  else if (path === '/debugging') activeView = 'debugging';
  else if (path === '/leaderboards') activeView = 'leaderboards';
  else if (path === '/profile') activeView = 'profile';
  else if (path === '/admin') activeView = 'admin';

  const setActiveView = (view) => {
    if (view === 'auth') navigate('/login');
    else if (view === 'dashboard') navigate('/dashboard');
    else if (view === 'questions') navigate('/questions');
    else if (view === 'debugging') navigate('/debugging');
    else if (view === 'leaderboards') navigate('/leaderboards');
    else if (view === 'profile') navigate('/profile');
    else if (view === 'admin') navigate('/admin');
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
        <Routes>
          <Route path="/login" element={
            currentUser ? (
              <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace />
            ) : (
              <Auth setActiveView={setActiveView} />
            )
          } />
          <Route path="/register" element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Auth setActiveView={setActiveView} />
            )
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard setActiveView={setActiveView} />
            </PrivateRoute>
          } />
          <Route path="/questions" element={
            <PrivateRoute>
              <Questions />
            </PrivateRoute>
          } />
          <Route path="/debugging" element={
            <PrivateRoute>
              <Debugging />
            </PrivateRoute>
          } />
          <Route path="/leaderboards" element={
            <Leaderboards />
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute adminOnly>
              <AdminPanel />
            </PrivateRoute>
          } />
          <Route path="/" element={
            <Navigate to={currentUser ? (currentUser.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />
          } />
          <Route path="*" element={
            <Navigate to={currentUser ? (currentUser.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />
          } />
        </Routes>
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
    <AuthProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AuthProvider>
  );
}
