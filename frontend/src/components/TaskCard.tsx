import type { Task, User } from "../api/types";
import { AssigneePicker } from "./AssigneePicker";
import { DueDate } from "./DueDate";
import { PriorityBadge } from "./PriorityBadge";

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  onAssign: (task: Task, member: User | null) => void;
  team: User[];
  isDragging: boolean;
}

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onAssign,
  team,
  isDragging,
}: Props) {
  return (
    <li
      // Dragging is a shortcut, never the only route: the checkbox below does
      // the same thing for keyboard and screen-reader users.
      draggable={task.can_edit}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(task.id));
        onDragStart(task);
      }}
      onDragEnd={onDragEnd}
      className={`group rounded-xl border border-line bg-surface p-3 transition ${
        task.can_edit ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-40" : "hover:border-accent/40 hover:shadow-sm"}`}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={task.is_complete}
          disabled={!task.can_edit}
          onChange={() => onToggle(task)}
          aria-label={`Mark "${task.title}" as ${task.is_complete ? "incomplete" : "complete"}`}
          className="mt-0.5 size-4 shrink-0 accent-accent disabled:opacity-40"
        />

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium break-words ${
              task.is_complete ? "text-ink-faint line-through" : "text-ink"
            }`}
          >
            {task.title}
          </p>

          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{task.description}</p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <PriorityBadge priority={task.priority} />
            <DueDate date={task.due_date} isComplete={task.is_complete} />
          </div>
        </div>

        <AssigneePicker
          task={task}
          team={team}
          onAssign={(member) => onAssign(task, member)}
        />
      </div>

      {/* Collapsed to zero height until hover, so a resting card has no dead space. */}
      {(task.can_edit || task.can_delete) && (
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-150 group-focus-within:grid-rows-[1fr] group-hover:grid-rows-[1fr]">
          <div className="flex justify-end gap-1 overflow-hidden">
            {task.can_edit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="mt-2 rounded-md px-2 py-1 text-xs font-medium text-ink-soft hover:bg-surface-muted hover:text-ink"
              >
                Edit
              </button>
            )}
            {task.can_delete && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                aria-label={`Delete "${task.title}"`}
                className="mt-2 rounded-md px-2 py-1 text-xs font-medium text-ink-faint hover:bg-danger-soft hover:text-danger"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
