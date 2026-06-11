import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const isAdmin = (user) => user?.isAdmin === true;

export function ProtectedRoute({ children }) {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (isAdmin(currentUser)) {
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

  if (!isAdmin(currentUser)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { currentUser } = useApp();

  if (currentUser) {
    const dest = isAdmin(currentUser) ? '/coordinator' : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  return children;
}

export function HomeRedirect() {
  const { currentUser } = useApp();

  if (!currentUser) return <Navigate to="/auth/login" replace />;
  if (isAdmin(currentUser)) return <Navigate to="/coordinator" replace />;
  return <Navigate to="/dashboard" replace />;
}
