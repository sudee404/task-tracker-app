import { useState } from "react";

import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useTeam,
  useToggleComplete,
  useUpdateTask,
} from "../api/hooks";
import type { Task, TaskFilters, TaskInput } from "../api/types";
import { useAuth } from "../auth/context";
import { Avatar } from "../components/Avatar";
import { BoardColumn } from "../components/BoardColumn";
import { FilterBar } from "../components/FilterBar";
import { Modal } from "../components/Modal";
import { TaskForm } from "../components/TaskForm";
import { ThemeToggle } from "../components/ThemeToggle";
import { useDebounced } from "../hooks/useDebounced";

/** Which task the form is editing, or "new" when adding. */
type Editing = Task | "new" | null;

const PAGE_SIZE = 25;

export function TasksPage() {
  const { user, logout } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<TaskFilters>({});
  const [editing, setEditing] = useState<Editing>(null);
  const [dragging, setDragging] = useState<Task | null>(null);
  const [todoPages, setTodoPages] = useState(1);
  const [donePages, setDonePages] = useState(1);

  // One request per pause in typing, not one per keystroke.
  const search = useDebounced(searchText, 300);
  const shared: TaskFilters = { ...filters, search };

  // Each column is its own query, so "load more" in one never disturbs the other.
  const todo = useTasks({ ...shared, status: "incomplete" }, todoPages);
  const done = useTasks({ ...shared, status: "complete" }, donePages);

  const { data: team = [] } = useTeam();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const toggleComplete = useToggleComplete();
  const deleteTask = useDeleteTask();

  const todoTasks = todo.data?.results ?? [];
  const doneTasks = done.data?.results ?? [];
  const overdue = todoTasks.filter(
    (task) => task.due_date && new Date(`${task.due_date}T00:00:00`) < new Date(),
  ).length;

  function handleSubmit(input: TaskInput) {
    return editing === "new"
      ? createTask.mutateAsync(input)
      : updateTask.mutateAsync({ id: (editing as Task).id, input });
  }

  const cardHandlers = {
    onToggle: (task: Task) =>
      toggleComplete.mutate({ id: task.id, isComplete: !task.is_complete }),
    onEdit: (task: Task) => setEditing(task),
    onDelete: (task: Task) => deleteTask.mutate(task.id),
    onDragStart: (task: Task) => setDragging(task),
    onDragEnd: () => setDragging(null),
  };

  /** Dropping a card in a column is just a completion change. */
  const moveTo = (isComplete: boolean) => (taskId: number) => {
    setDragging(null);
    const task = [...todoTasks, ...doneTasks].find((t) => t.id === taskId);
    if (!task || task.is_complete === isComplete) return;
    toggleComplete.mutate({ id: taskId, isComplete });
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-accent text-sm font-bold text-on-accent">
            ✓
          </span>
          <h1 className="text-base font-semibold text-ink">Task Tracker</h1>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden items-center gap-2 sm:flex">
              <Avatar user={user} />
              <span className="text-sm text-ink-soft">{user?.display_name}</span>
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-surface-muted hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">Team board</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {todo.isLoading ? (
                "Loading…"
              ) : (
                <>
                  {todo.data?.count ?? 0} outstanding
                  {overdue > 0 && <span className="text-danger"> · {overdue} overdue</span>}
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditing("new")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-on-accent transition hover:bg-accent-hover"
          >
            <span aria-hidden className="text-base leading-none">+</span>
            Add task
          </button>
        </div>

        <div className="mb-6">
          <FilterBar
            filters={filters}
            searchText={searchText}
            team={team}
            onSearchChange={setSearchText}
            onChange={setFilters}
          />
        </div>

        {todo.isError || done.isError ? (
          <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-10 text-center text-sm text-danger">
            Could not load tasks. Is the backend running?
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <BoardColumn
              title="To do"
              tone="todo"
              count={todo.data?.count ?? 0}
              tasks={todoTasks}
              isLoading={todo.isLoading}
              emptyMessage="Nothing outstanding. Add a task or drag one back from Done."
              hasMore={Boolean(todo.data?.next)}
              onLoadMore={() => setTodoPages((p) => p + 1)}
              draggingId={dragging?.id ?? null}
              onDropTask={moveTo(false)}
              {...cardHandlers}
            />

            <BoardColumn
              title="Done"
              tone="done"
              count={done.data?.count ?? 0}
              tasks={doneTasks}
              isLoading={done.isLoading}
              emptyMessage="Nothing finished yet. Tick a task off, or drag it here."
              hasMore={Boolean(done.data?.next)}
              onLoadMore={() => setDonePages((p) => p + 1)}
              draggingId={dragging?.id ?? null}
              onDropTask={moveTo(true)}
              {...cardHandlers}
            />
          </div>
        )}

        {(todo.data?.count ?? 0) + (done.data?.count ?? 0) > PAGE_SIZE && (
          <p className="mt-4 text-center text-xs text-ink-faint">
            Showing {todoTasks.length + doneTasks.length} of{" "}
            {(todo.data?.count ?? 0) + (done.data?.count ?? 0)} tasks
          </p>
        )}
      </main>

      {editing && (
        <Modal
          title={editing === "new" ? "Add task" : "Edit task"}
          onClose={() => setEditing(null)}
        >
          <TaskForm
            team={team}
            task={editing === "new" ? undefined : editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
