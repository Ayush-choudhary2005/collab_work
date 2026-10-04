import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useKanbanTasks } from '../../hooks/useKanbanTasks';
import KanbanColumn from './KanbanColumn';
import CreateTaskForm from './CreateTaskForm';
import { STATUS_COLUMNS } from './constants';

export default function KanbanBoard({ projectId, canEdit }) {
  const { tasks, tasksByStatus, error, createTask, moveTask } = useKanbanTasks(projectId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = ({ active, over }) => {
    if (!over) return;
    moveTask(active.id, over.id);
  };

  if (error && tasks === null) {
    return <p role="alert" className="text-sm text-red-600">{error}</p>;
  }
  if (tasks === null) {
    return <p className="text-sm text-slate-500">Loading tasks…</p>;
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-4">
          <CreateTaskForm onCreate={createTask} />
        </div>
      )}
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STATUS_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={tasksByStatus[col.id]}
              dragDisabled={!canEdit}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
