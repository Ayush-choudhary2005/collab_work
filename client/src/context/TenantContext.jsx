import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api, { clearTenantId, setTenantId, STORAGE_KEYS } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { token } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Which token the current workspace list was loaded for. "Loading" is
  // derived from it (rather than a separate boolean) so there is no render
  // right after login where a user WITH workspaces briefly looks like they
  // have none — which would bounce them to the create-workspace screen.
  const [loadedFor, setLoadedFor] = useState(null);

  useEffect(() => {
    if (!token) {
      setWorkspaces([]);
      setCurrentId(null);
      setError(null);
      setLoadedFor(null);
      return undefined;
    }

    let cancelled = false;
    api
      .get('/tenants/my-workspaces')
      .then(({ data }) => {
        if (cancelled) return;
        const list = data.data.workspaces;
        // Keep the previously selected workspace only if the user is STILL a
        // member of it; otherwise fall back to the first one. This stops a
        // stale x-tenant-id (removed member, other account) causing 403s.
        const stored = localStorage.getItem(STORAGE_KEYS.tenantId);
        const chosen = list.find((w) => w.id === stored) ?? list[0] ?? null;
        if (chosen) setTenantId(chosen.id);
        else clearTenantId();
        setWorkspaces(list);
        setCurrentId(chosen ? chosen.id : null);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadedFor(token);
      });

    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  // Writes localStorage synchronously (not in an effect) so the very next
  // API call already carries the new x-tenant-id header.
  const selectWorkspace = useCallback(
    (id) => {
      if (workspaces.some((w) => w.id === id)) {
        setTenantId(id);
        setCurrentId(id);
      }
    },
    [workspaces]
  );

  const createWorkspace = useCallback(async (name) => {
    const { data } = await api.post('/tenants', { name });
    const workspace = data.data.tenant; // { id, name, slug, role: 'owner' }
    setTenantId(workspace.id);
    setWorkspaces((prev) => [...prev, workspace]);
    setCurrentId(workspace.id);
    return workspace;
  }, []);

  const reload = useCallback(() => {
    setError(null);
    setLoadedFor(null);
    setReloadKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      workspaces,
      currentWorkspace: workspaces.find((w) => w.id === currentId) ?? null,
      loading: Boolean(token) && loadedFor !== token,
      error,
      selectWorkspace,
      createWorkspace,
      reload,
    }),
    [workspaces, currentId, token, loadedFor, error, selectWorkspace, createWorkspace, reload]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
