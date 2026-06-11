import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { currentUser } = useAuth();
  const homePath = currentUser ? '/dashboard' : '/auth/login';
  const homeLabel = currentUser ? 'Go to Dashboard' : 'Go to Login';

  return (
    <div className="not-found-container">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Page Not Found</h1>
      <p className="not-found-desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to={homePath} className="not-found-link">
        {homeLabel}
      </Link>
    </div>
  );
}
