import type { Task, User } from "../api/types";

export const amara: User = { id: 1, username: "amara", display_name: "Amara Okafor" };
export const ben: User = { id: 2, username: "ben", display_name: "Ben Whitfield" };

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: "Write the API",
    description: "DRF viewset",
    is_complete: false,
    priority: "MEDIUM",
    due_date: null,
    assignee: null,
    assignee_detail: null,
    created_by_detail: amara,
    can_edit: true,
    can_delete: true,
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
    ...overrides,
  };
}
