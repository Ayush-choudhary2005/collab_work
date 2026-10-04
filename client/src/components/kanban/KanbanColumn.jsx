import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

export default function KanbanColumn({ id, label, tasks, dragDisabled }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      data-testid={`column-${id}`}
      className={`flex w-64 shrink-0 flex-col rounded-xl p-2 transition-colors ${
        isOver ? 'bg-indigo-50' : 'bg-slate-100'
      }`}
    >
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <span className="text-xs text-slate-400">{tasks.length}</span>
      </div>
      <div className="flex min-h-[2rem] flex-col gap-2 p-1">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} disabled={dragDisabled} />
        ))}
      </div>
    </div>
  );
}
