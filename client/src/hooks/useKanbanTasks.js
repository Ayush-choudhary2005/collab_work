import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useSocket } from './useSocket';
import { useTenant } from './useTenant';
import { STATUS_COLUMNS } from '../components/kanban/constants';

export function useKanbanTasks(projectId) {
  const { socket, joinedTenantId } = useSocket();
  const { currentWorkspace } = useTenant();
  const [tasks, setTasks] = useState(null); // null = loading
  const [error, setError] = useState('');

  // ---- Load tasks whenever the project changes ----
  useEffect(() => {
    let cancelled = false;
    setTasks(null);
    setError('');
    api
      .get(`/projects/${projectId}/tasks`)
      .then(({ data }) => !cancelled && setTasks(data.data.tasks))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ---- Live updates from other clients in this workspace ----
  // joinedTenantId confirms the socket is ACTUALLY in this workspace's room
  // (not just that it's the one selected) before trusting its events.
  useEffect(() => {
    if (!socket || joinedTenantId !== currentWorkspace?.id) return undefined;

    const belongsHere = (task) => task.projectId === projectId;

    const onCreated = ({ task }) => {
      if (!belongsHere(task)) return;
      // Idempotent: the creator's own optimistic insert (see createTask
      // below) may have already added this task before the echo arrives.
      setTasks((prev) => (prev?.some((t) => t.id === task.id) ? prev : [task, ...(prev || [])]));
    };

    const onStatusChanged = ({ task }) => {
      if (!belongsHere(task)) return;
      setTasks((prev) => (prev ? prev.map((t) => (t.id === task.id ? task : t)) : prev));
    };

    socket.on('task:created', onCreated);
    socket.on('task:statusChanged', onStatusChanged);
    return () => {
      socket.off('task:created', onCreated);
      socket.off('task:statusChanged', onStatusChanged);
    };
  }, [socket, joinedTenantId, currentWorkspace?.id, projectId]);

  const tasksByStatus = useMemo(() => {
    const grouped = Object.fromEntries(STATUS_COLUMNS.map((c) => [c.id, []]));
    (tasks || []).forEach((t) => grouped[t.status]?.push(t));
    return grouped;
  }, [tasks]);

  const createTask = useCallback(
    async (title) => {
      const { data } = await api.post('/tasks', { title, projectId });
      const task = data.data.task;
      setTasks((prev) => (prev?.some((t) => t.id === task.id) ? prev : [task, ...(prev || [])]));
      return task;
    },
    [projectId]
  );

  const moveTask = useCallback(
    async (taskId, newStatus) => {
      let previousStatus;
      let found = false;
      setTasks((prev) => {
        const task = prev?.find((t) => t.id === taskId);
        if (!task || task.status === newStatus) return prev;
        found = true;
        previousStatus = task.status;
        // Optimistic: move the card immediately, revert below on failure.
        return prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
      });
      if (!found) return;

      try {
        await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t)));
        setError(err.message);
      }
    },
    []
  );

  return { tasks, tasksByStatus, error, createTask, moveTask };
}
