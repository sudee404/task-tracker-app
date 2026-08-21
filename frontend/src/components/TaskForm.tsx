import { useState, type FormEvent } from "react";

import { ApiError } from "../api/client";
import type { Priority, Task, TaskInput, User } from "../api/types";

interface Props {
  team: User[];
  /** Present when editing; absent when adding. */
  task?: Task;
  onSubmit: (input: TaskInput) => Promise<unknown>;
  onCancel: () => void;
}

const FIELD =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition placeholder:text-ink-faint hover:border-accent/40";

export function TaskForm({ team, task, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [assignee, setAssignee] = useState(task?.assignee ? String(task.assignee) : "");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await onSubmit({
        title,
        description,
        priority,
        due_date: dueDate || null,
        assignee: assignee ? Number(assignee) : null,
      });
      onCancel();
    } catch (error) {
      // Surface DRF's field errors next to the fields they belong to.
      setErrors(error instanceof ApiError ? error.fieldErrors : { detail: ["Could not save."] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="title" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={FIELD}
          autoFocus
        />
        {errors.title && <p className="mt-1.5 text-xs text-danger">{errors.title[0]}</p>}
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={FIELD}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="assignee" className="mb-1.5 block text-xs font-medium text-ink-soft">
            Assignee
          </label>
          <select
            id="assignee"
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            className={FIELD}
          >
            <option value="">Unassigned</option>
            {team.map((member) => (
              <option key={member.id} value={String(member.id)}>
                {member.display_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="mb-1.5 block text-xs font-medium text-ink-soft">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            className={FIELD}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="due_date" className="mb-1.5 block text-xs font-medium text-ink-soft">
            Due date
          </label>
          <input
            id="due_date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className={FIELD}
          />
        </div>
      </div>

      {errors.detail && <p className="text-xs text-danger">{errors.detail[0]}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-muted hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Saving…" : task ? "Save changes" : "Add task"}
        </button>
      </div>
    </form>
  );
}
