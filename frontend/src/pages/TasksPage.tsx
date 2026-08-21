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
import { FilterBar } from "../components/FilterBar";
import { Modal } from "../components/Modal";
import { TaskForm } from "../components/TaskForm";
import { TaskRow } from "../components/TaskRow";

/** Which task the form is editing, or "new" when adding. */
type Editing = Task | "new" | null;

export function TasksPage() {
  const { user, logout } = useAuth();
  const [filters, setFilters] = useState<TaskFilters>({});
  const [editing, setEditing] = useState<Editing>(null);

  const { data, isLoading, isError } = useTasks(filters);
  const { data: team = [] } = useTeam();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const toggleComplete = useToggleComplete();
  const deleteTask = useDeleteTask();

  const tasks = data?.results ?? [];
  const remaining = tasks.filter((t) => !t.is_complete).length;

  function handleSubmit(input: TaskInput) {
    return editing === "new"
      ? createTask.mutateAsync(input)
      : updateTask.mutateAsync({ id: (editing as Task).id, input });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Task Tracker</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">{user?.display_name}</span>
            <button
              type="button"
              onClick={() => void logout()}
              className="font-medium text-slate-500 underline underline-offset-4 hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            {isLoading ? "Loading…" : `${remaining} of ${tasks.length} outstanding`}
          </p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Add task
          </button>
        </div>

        <div className="mb-6">
          <FilterBar filters={filters} team={team} onChange={setFilters} />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {isError ? (
            <p className="px-4 py-10 text-center text-sm text-rose-600">
              Could not load tasks. Is the backend running?
            </p>
          ) : isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Loading tasks…</p>
          ) : tasks.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No tasks match. Add one, or clear the filters.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={(t) =>
                    toggleComplete.mutate({ id: t.id, isComplete: !t.is_complete })
                  }
                  onEdit={setEditing}
                  onDelete={(t) => deleteTask.mutate(t.id)}
                />
              ))}
            </ul>
          )}
        </div>
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
