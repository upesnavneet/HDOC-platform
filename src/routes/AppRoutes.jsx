import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.3, ease: 'easeIn' } },
};

function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      {children}
    </motion.div>
  );
}

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
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><HomeRedirect /></PageTransition>} />

            <Route path="/auth" element={<PageTransition><HomeRedirect /></PageTransition>} />
            <Route
              path="/auth/:mode"
              element={
                <GuestRoute>
                  <RouteErrorBoundary>
                    <PageTransition><Auth /></PageTransition>
                  </RouteErrorBoundary>
                </GuestRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RouteErrorBoundary>
                    <PageTransition><Dashboard /></PageTransition>
                  </RouteErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/questions"
              element={
                <ProtectedRoute>
                  <RouteErrorBoundary>
                    <PageTransition><Questions /></PageTransition>
                  </RouteErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/debugging"
              element={
                <ProtectedRoute>
                  <RouteErrorBoundary>
                    <PageTransition><Debugging /></PageTransition>
                  </RouteErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <RouteErrorBoundary>
                    <PageTransition><Profile /></PageTransition>
                  </RouteErrorBoundary>
                </ProtectedRoute>
              }
            />
            {/* M16: Leaderboard now requires authentication */}
            <Route
              path="/leaderboards"
              element={
                <ProtectedRoute>
                  <RouteErrorBoundary>
                    <PageTransition><Leaderboards /></PageTransition>
                  </RouteErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator"
              element={
                <AdminRoute>
                  <RouteErrorBoundary>
                    <PageTransition><CoordinatorDashboard /></PageTransition>
                  </RouteErrorBoundary>
                </AdminRoute>
              }
            />

            {/* M9: Styled 404 page instead of silent redirect */}
            <Route
              path="*"
              element={
                <RouteErrorBoundary>
                  <PageTransition><NotFound /></PageTransition>
                </RouteErrorBoundary>
              }
            />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}
