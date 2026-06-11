import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const isAdmin = (user) => user?.isAdmin === true;

// M4: Shared loading component — shown while Firebase auth resolves.
function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-spinner" />
      <span>Loading…</span>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { loading } = useAuth();
  const { currentUser } = useApp();
  const location = useLocation();

  // M4: Wait for auth to resolve before making routing decisions.
  if (loading) return <PageLoader />;
  if (!currentUser) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }
  if (isAdmin(currentUser)) {
    return <Navigate to="/coordinator" replace />;
  }
  return children;
}

export function AdminRoute({ children }) {
  const { loading } = useAuth();
  const { currentUser } = useApp();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!currentUser) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }
  if (!isAdmin(currentUser)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function GuestRoute({ children }) {
  const { loading } = useAuth();
  const { currentUser } = useApp();

  if (loading) return <PageLoader />;
  if (currentUser) {
    const dest = isAdmin(currentUser) ? '/coordinator' : '/dashboard';
    return <Navigate to={dest} replace />;
  }
  return children;
}

export function HomeRedirect() {
  const { loading } = useAuth();
  const { currentUser } = useApp();

  if (loading) return <PageLoader />;
  if (!currentUser) return <Navigate to="/auth/login" replace />;
  if (isAdmin(currentUser)) return <Navigate to="/coordinator" replace />;
  return <Navigate to="/dashboard" replace />;
}
