import { request } from "./client";
import type { Paginated, Task, TaskFilters, TaskInput, User } from "./types";

function toQueryString(filters: TaskFilters & { page?: string }): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const tasksApi = {
  list: (filters: TaskFilters & { page?: string } = {}) =>
    request<Paginated<Task>>(`/tasks/${toQueryString(filters)}`),
  create: (input: TaskInput) => request<Task>("/tasks/", { method: "POST", body: input }),
  update: (id: number, input: Partial<TaskInput>) =>
    request<Task>(`/tasks/${id}/`, { method: "PATCH", body: input }),
  setComplete: (id: number, isComplete: boolean) =>
    request<Task>(`/tasks/${id}/`, { method: "PATCH", body: { is_complete: isComplete } }),
  remove: (id: number) => request<void>(`/tasks/${id}/`, { method: "DELETE" }),
};

export const usersApi = {
  list: () => request<User[]>("/users/"),
};

export const authApi = {
  me: () => request<User>("/auth/me/"),
  login: (username: string, password: string) =>
    request<User>("/auth/login/", { method: "POST", body: { username, password } }),
  logout: () => request<void>("/auth/logout/", { method: "POST" }),
};
