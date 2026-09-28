import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import Button from './Button';
import FullPageSpinner from './FullPageSpinner';

// Logged-out visitors go to /login (remembering where they were headed).
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

// Login/Register are only for logged-out visitors. Once the session exists,
// this guard is what moves the user on — the pages themselves don't navigate.
export function PublicOnly() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Outlet />;
  return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;
}

// Needs a selected workspace. No workspaces yet -> create one first.
// A failed workspace fetch shows an error (not the create screen), so a
// network blip can't trick someone into creating a duplicate workspace.
export function RequireWorkspace() {
  const { loading, error, currentWorkspace, reload } = useTenant();
  if (loading) return <FullPageSpinner />;
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <p className="text-sm text-red-600">Couldn't load your workspaces: {error}</p>
        <Button onClick={reload}>Try again</Button>
      </div>
    );
  }
  return currentWorkspace ? <Outlet /> : <Navigate to="/workspace/new" replace />;
}
