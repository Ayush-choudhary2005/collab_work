import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { SocketProvider } from './context/SocketContext';
import { PublicOnly, RequireAuth, RequireWorkspace } from './components/ProtectedRoutes';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkspaceSetup from './pages/WorkspaceSetup';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <TenantProvider>
          <SocketProvider>
            <Routes>
              <Route element={<PublicOnly />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route path="/workspace/new" element={<WorkspaceSetup />} />
                <Route element={<RequireWorkspace />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/members" element={<Members />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
