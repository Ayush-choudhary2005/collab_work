import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import CreateProjectForm from '../components/CreateProjectForm';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, selectWorkspace } = useTenant();
  const { connected, joinedTenantId } = useSocket();
  // "Live" means more than socket-connected: the server must have actually
  // accepted this specific workspace's room join, or task events for this
  // workspace won't be delivered yet.
  const live = connected && joinedTenantId === currentWorkspace.id;
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const canEdit = currentWorkspace.role !== 'guest';

  useEffect(() => {
    let cancelled = false;
    setProjects(null);
    setError('');
    setSelectedProjectId(null);
    api
      .get('/projects')
      .then(({ data }) => {
        if (cancelled) return;
        setProjects(data.data.projects);
        setSelectedProjectId(data.data.projects[0]?.id ?? null);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [currentWorkspace.id]);

  const createProject = async (name) => {
    const { data } = await api.post('/projects', { name });
    const project = data.data.project;
    setProjects((prev) => [...(prev || []), project]);
    setSelectedProjectId(project.id);
  };

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
          <span
            title={live ? 'Live updates connected' : 'Live updates offline'}
            className={`h-2 w-2 rounded-full ${live ? 'bg-green-500' : 'bg-slate-300'}`}
          />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/workspace/new" className="text-indigo-600 hover:underline">New workspace</Link>
          <span className="text-slate-500">{user.fullName}</span>
          <Button variant="secondary" onClick={logout}>Log out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        {!error && projects === null && <p className="text-sm text-slate-500">Loading projects…</p>}

        {projects && (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    p.id === selectedProjectId
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-700 shadow-sm hover:bg-slate-100'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {canEdit && (
              <div className="mb-6 max-w-sm">
                <CreateProjectForm onCreate={createProject} />
              </div>
            )}

            {projects.length === 0 && (
              <p className="text-sm text-slate-500">No projects in this workspace yet — create one above to get started.</p>
            )}

            {selectedProjectId && (
              <KanbanBoard key={selectedProjectId} projectId={selectedProjectId} canEdit={canEdit} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
