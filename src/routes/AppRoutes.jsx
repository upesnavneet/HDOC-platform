import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, GuestRoute, HomeRedirect } from './guards';
import Auth from '../views/Auth';
import Dashboard from '../views/Dashboard';
import Questions from '../views/Questions';
import Debugging from '../views/Debugging';
import Leaderboards from '../views/Leaderboards';
import Profile from '../views/Profile';

const CoordinatorDashboard = lazy(() => import('../features/coordinator/CoordinatorDashboard'));
const AuroraBackground = lazy(() => import('../components/Aurora'));

function PageLoader() {
  return (
    <div className="loading" role="status" aria-live="polite">
      Loading…
    </div>
  );
}

export default function AppRoutes() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');

  return (
    <>
      <Suspense fallback={null}>
        {!isAuthPage && (
          <AuroraBackground
            colorStops={['#0a0b10', '#03346E', '#6EACDA']}
            blend={0.5}
            amplitude={1.0}
            speed={0.6}
          />
        )}
      </Suspense>

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/:mode" element={<GuestRoute><Auth /></GuestRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/questions" element={<ProtectedRoute><Questions /></ProtectedRoute>} />
          <Route path="/debugging" element={<ProtectedRoute><Debugging /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route
            path="/coordinator"
            element={
              <AdminRoute>
                <CoordinatorDashboard />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
