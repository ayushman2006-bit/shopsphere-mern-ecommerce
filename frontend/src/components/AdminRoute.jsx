import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error('You need an administrator account to open that page.');
    }
  }, [loading, user, isAdmin]);

  if (loading) return <LoadingSpinner fullPage label="Verifying admin access…" />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return children || <Outlet />;
};

export default AdminRoute;
