import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, GuestRoute, HomeRedirect } from './guards';
import { RouteErrorBoundary } from '../components/ErrorBoundary';

// H10: Every route-level view is lazy-loaded. Only the code for the
// current route is downloaded, parsed, and executed.
const Auth = lazy(() => import('../views/Auth'));
const Dashboard = lazy(() => import('../views/Dashboard'));
const Questions = lazy(() => import('../views/Questions'));
const Debugging = lazy(() => import('../views/Debugging'));
const Leaderboards = lazy(() => import('../views/Leaderboards'));
const Profile = lazy(() => import('../views/Profile'));
const CoordinatorDashboard = lazy(() => import('../features/coordinator/CoordinatorDashboard'));
const LiquidChrome = lazy(() => import('../components/LiquidChrome'));

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
          <div className="liquid-chrome-background">
            <LiquidChrome
              baseColor={[0, 0, 0.05]}
              speed={0.15}
              amplitude={0.3}
              interactive={false}
            />
          </div>
        )}
      </Suspense>

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/:mode" element={<GuestRoute><RouteErrorBoundary><Auth /></RouteErrorBoundary></GuestRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><RouteErrorBoundary><Dashboard /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/questions" element={<ProtectedRoute><RouteErrorBoundary><Questions /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/debugging" element={<ProtectedRoute><RouteErrorBoundary><Debugging /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><RouteErrorBoundary><Profile /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/leaderboards" element={<RouteErrorBoundary><Leaderboards /></RouteErrorBoundary>} />
          <Route
            path="/coordinator"
            element={
              <AdminRoute>
                <RouteErrorBoundary>
                  <CoordinatorDashboard />
                </RouteErrorBoundary>
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
