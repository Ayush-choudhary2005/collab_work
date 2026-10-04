import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PRIORITY_STYLES } from './constants';

export default function TaskCard({ task, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${
        disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <p className="text-sm font-medium text-slate-800">{task.title}</p>
      {task.priority && (
        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
      )}
    </div>
  );
}
