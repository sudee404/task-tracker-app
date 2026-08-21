import { useState, type ReactNode } from "react";

import type { Task } from "../api/types";
import { TaskCard } from "./TaskCard";

interface Props {
  title: string;
  count: number;
  tone: "todo" | "done";
  tasks: Task[];
  isLoading: boolean;
  emptyMessage: string;
  hasMore: boolean;
  onLoadMore: () => void;
  draggingId: number | null;
  onDropTask: (taskId: number) => void;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  action?: ReactNode;
}

export function BoardColumn({
  title,
  count,
  tone,
  tasks,
  isLoading,
  emptyMessage,
  hasMore,
  onLoadMore,
  draggingId,
  onDropTask,
  action,
  ...cardHandlers
}: Props) {
  const [isOver, setIsOver] = useState(false);
  const headingId = `column-${tone}`;

  // Only highlight when the dragged card would actually change column.
  const wouldMove = draggingId !== null && !tasks.some((task) => task.id === draggingId);

  return (
    <section
      // Named so each column is a real landmark, navigable on its own.
      aria-labelledby={headingId}
      onDragOver={(event) => {
        if (!wouldMove) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        const id = Number(event.dataTransfer.getData("text/plain"));
        if (id) onDropTask(id);
      }}
      className={`flex min-h-64 flex-col rounded-2xl border p-3 transition ${
        isOver && wouldMove
          ? "border-accent border-dashed bg-accent-soft/40"
          : "border-line bg-surface-muted/60"
      }`}
    >
      <header className="mb-3 flex items-center gap-2 px-1">
        <span
          aria-hidden
          className={`size-2 rounded-full ${tone === "todo" ? "bg-accent" : "bg-ink-faint"}`}
        />
        <h2 id={headingId} className="text-sm font-semibold text-ink">
          {title}
        </h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-ink-soft">
          {count}
        </span>
        <div className="ml-auto">{action}</div>
      </header>

      {isLoading ? (
        <ul className="flex flex-col gap-2" aria-hidden>
          {[0, 1].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-xl border border-line bg-surface" />
          ))}
        </ul>
      ) : tasks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line px-4 py-8 text-center text-xs text-ink-faint">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDragging={draggingId === task.id}
              {...cardHandlers}
            />
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="mt-2 rounded-lg border border-line bg-surface py-2 text-xs font-medium text-ink-soft hover:border-accent/40 hover:text-ink"
        >
          Load more
        </button>
      )}
    </section>
  );
}
