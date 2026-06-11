import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const isCoordinator = (user) => user?.role === 'admin' || user?.role === 'coordinator';

export function ProtectedRoute({ children }) {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (isCoordinator(currentUser)) {
    return <Navigate to="/coordinator" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (!isCoordinator(currentUser)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { currentUser } = useApp();

  if (currentUser) {
    const dest = isCoordinator(currentUser) ? '/coordinator' : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  return children;
}

export function HomeRedirect() {
  const { currentUser } = useApp();

  if (!currentUser) return <Navigate to="/auth/login" replace />;
  if (isCoordinator(currentUser)) return <Navigate to="/coordinator" replace />;
  return <Navigate to="/dashboard" replace />;
}
