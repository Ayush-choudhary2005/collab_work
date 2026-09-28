import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import api from '../services/api';

// Phase 4 placeholder: proves login + workspace selection work end to end
// (the project list request carries the x-tenant-id header). The Kanban
// board replaces the body of this page in Phase 5.
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, selectWorkspace } = useTenant();
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setProjects(null);
    setError('');
    api
      .get('/projects')
      .then(({ data }) => !cancelled && setProjects(data.data.projects))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [currentWorkspace.id]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900">CollabFlow AI</span>
          {workspaces.length > 1 ? (
            <select
              aria-label="Switch workspace"
              value={currentWorkspace.id}
              onChange={(e) => selectWorkspace(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-slate-700">{currentWorkspace.name}</span>
          )}
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
            {currentWorkspace.role}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/workspace/new" className="text-indigo-600 hover:underline">New workspace</Link>
          <span className="text-slate-500">{user.fullName}</span>
          <Button variant="secondary" onClick={logout}>Log out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-6">
        <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        {!error && projects === null && <p className="mt-2 text-sm text-slate-500">Loading projects…</p>}
        {projects && projects.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">No projects in this workspace yet. The Kanban board arrives in Phase 5.</p>
        )}
        {projects && projects.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-200 rounded-xl bg-white shadow">
            {projects.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm text-slate-800">{p.name}</li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
