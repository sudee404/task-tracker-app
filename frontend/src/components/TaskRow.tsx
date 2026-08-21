import type { Task } from "../api/types";
import { DueDate } from "./DueDate";
import { PriorityBadge } from "./PriorityBadge";

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskRow({ task, onToggle, onEdit, onDelete }: Props) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={task.is_complete}
        onChange={() => onToggle(task)}
        aria-label={`Mark "${task.title}" as ${task.is_complete ? "incomplete" : "complete"}`}
        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`font-medium ${task.is_complete ? "text-slate-400 line-through" : "text-slate-900"}`}
          >
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>

        {task.description && (
          <p className="mt-0.5 truncate text-sm text-slate-500">{task.description}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
          <span className="text-slate-600">
            {task.assignee_detail ? task.assignee_detail.display_name : "Unassigned"}
          </span>
          <DueDate date={task.due_date} isComplete={task.is_complete} />
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`Delete "${task.title}"`}
          className="rounded px-2 py-1 text-sm font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
