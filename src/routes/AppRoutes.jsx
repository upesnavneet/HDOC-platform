import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, GuestRoute, HomeRedirect } from './guards';
import { RouteErrorBoundary } from '../components/ErrorBoundary';

// H10: Every route-level view is lazy-loaded.
const Auth = lazy(() => import('../views/Auth'));
const Dashboard = lazy(() => import('../views/Dashboard'));
const Questions = lazy(() => import('../views/Questions'));
const Debugging = lazy(() => import('../views/Debugging'));
const Leaderboards = lazy(() => import('../views/Leaderboards'));
const Profile = lazy(() => import('../views/Profile'));
const CoordinatorDashboard = lazy(() => import('../features/coordinator/CoordinatorDashboard'));
const LiquidChrome = lazy(() => import('../components/LiquidChrome'));
// M9: Lazy-loaded 404 page
const NotFound = lazy(() => import('../views/NotFound'));

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

          <Route path="/auth" element={<HomeRedirect />} />
          <Route path="/auth/:mode" element={<GuestRoute><RouteErrorBoundary><Auth /></RouteErrorBoundary></GuestRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><RouteErrorBoundary><Dashboard /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/questions" element={<ProtectedRoute><RouteErrorBoundary><Questions /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/debugging" element={<ProtectedRoute><RouteErrorBoundary><Debugging /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><RouteErrorBoundary><Profile /></RouteErrorBoundary></ProtectedRoute>} />
          {/* M16: Leaderboard now requires authentication */}
          <Route path="/leaderboards" element={<ProtectedRoute><RouteErrorBoundary><Leaderboards /></RouteErrorBoundary></ProtectedRoute>} />
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

          {/* M9: Styled 404 page instead of silent redirect */}
          <Route path="*" element={<RouteErrorBoundary><NotFound /></RouteErrorBoundary>} />
        </Routes>
      </Suspense>
    </>
  );
}
