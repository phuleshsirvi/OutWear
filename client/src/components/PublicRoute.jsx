import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Route wrapper for public-only pages like /login and /signup.
 * - Displays a loading spinner while auth state is resolving.
 * - Redirects to /wardrobe (or originally intended page) if already authenticated.
 * - Renders children or Outlet if unauthenticated.
 */
export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="mt-4 text-xs font-mono text-slate-400">Checking session...</span>
      </div>
    );
  }

  if (user) {
    const destination = location.state?.from?.pathname || '/wardrobe';
    return <Navigate to={destination} replace />;
  }

  return children ? children : <Outlet />;
}
