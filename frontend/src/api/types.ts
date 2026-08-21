export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface User {
  id: number;
  username: string;
  display_name: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  is_complete: boolean;
  priority: Priority;
  due_date: string | null;
  assignee: number | null;
  assignee_detail: User | null;
  created_by_detail: User | null;
  /** Mirrors the server's permission rule; the API still enforces it. */
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

/** Fields the client may write. */
export type TaskInput = Pick<Task, "title" | "description" | "priority"> & {
  assignee: number | null;
  due_date: string | null;
};

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TaskFilters {
  search?: string;
  status?: "complete" | "incomplete" | "";
  assignee?: string;
  priority?: Priority | "";
  ordering?: string;
}
