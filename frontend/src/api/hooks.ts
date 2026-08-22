import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";

import { ApiError } from "./client";
import { tasksApi, usersApi } from "./tasks";
import type { Paginated, Task, TaskFilters, TaskInput, User } from "./types";
import { useToast } from "../toast/context";

const TASKS_KEY = "tasks";

export const tasksKey = (filters: TaskFilters, page: number): QueryKey => [
  TASKS_KEY,
  filters,
  page,
];

export function useTasks(filters: TaskFilters, page = 1) {
  return useQuery({
    queryKey: tasksKey(filters, page),
    queryFn: () => tasksApi.list({ ...filters, page: String(page) }),
    placeholderData: (previous) => previous,
  });
}

export function useTeam() {
  return useQuery({ queryKey: ["users"], queryFn: usersApi.list, staleTime: Infinity });
}

/**
 * Turns a failure into something worth reading.
 *
 * DRF's 404 and 500 bodies describe its own internals ("No Task matches the
 * given query"), so users get our wording instead.
 */
function messageFor(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return "Could not reach the server.";

  switch (error.status) {
    case 403:
      return "You can only change tasks you created or were assigned.";
    case 404:
      return "That task no longer exists — someone may have deleted it.";
    default:
      return fallback;
  }
}

/**
 * A 400 carries field errors the form renders beside the offending input, so a
 * toast would only repeat it less usefully. Everything else is invisible
 * without one.
 */
function isFormError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 400;
}

/** Every mutation invalidates the list, so the view refetches itself. */
function useTaskMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>, failureMessage: string) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }),
    onError: (error) => {
      if (!isFormError(error)) notify(messageFor(error, failureMessage));
    },
  });
}

export const useCreateTask = () =>
  useTaskMutation((input: TaskInput) => tasksApi.create(input), "Could not add the task.");

export const useUpdateTask = () =>
  useTaskMutation(
    ({ id, input }: { id: number; input: Partial<TaskInput> }) => tasksApi.update(id, input),
    "Could not save the task.",
  );

export const useDeleteTask = () =>
  useTaskMutation((id: number) => tasksApi.remove(id), "Could not delete the task.");

/**
 * A mutation that shows its result before the server confirms it, and puts the
 * cache back if the server refuses.
 *
 * Every cached page is patched, because the same task can sit in more than one
 * cached query — the two board columns are separate queries.
 */
function useOptimisticTaskMutation<TArgs extends { id: number }>(
  fn: (args: TArgs) => Promise<unknown>,
  patch: (task: Task, args: TArgs) => Task,
  failureMessage: string,
) {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  return useMutation({
    mutationFn: fn,

    onMutate: async (args: TArgs) => {
      await queryClient.cancelQueries({ queryKey: [TASKS_KEY] });
      const snapshot = queryClient.getQueriesData<Paginated<Task>>({ queryKey: [TASKS_KEY] });

      for (const [key, page] of snapshot) {
        if (!page) continue;
        queryClient.setQueryData<Paginated<Task>>(key, {
          ...page,
          results: page.results.map((task) => (task.id === args.id ? patch(task, args) : task)),
        });
      }
      return { snapshot };
    },

    onError: (error, _args, context) => {
      for (const [key, page] of context?.snapshot ?? []) {
        queryClient.setQueryData(key, page);
      }
      notify(messageFor(error, failureMessage));
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}

export const useToggleComplete = () =>
  useOptimisticTaskMutation(
    ({ id, isComplete }: { id: number; isComplete: boolean }) =>
      tasksApi.setComplete(id, isComplete),
    (task, { isComplete }) => ({ ...task, is_complete: isComplete }),
    "Could not update the task.",
  );

/**
 * Reassigning from the card. `assigneeDetail` is threaded through so the
 * optimistic patch can show the new person's initials immediately rather than
 * blanking the avatar until the refetch lands.
 */
export const useReassignTask = () =>
  useOptimisticTaskMutation(
    ({ id, assignee }: { id: number; assignee: number | null; assigneeDetail: User | null }) =>
      tasksApi.update(id, { assignee }),
    (task, { assignee, assigneeDetail }) => ({
      ...task,
      assignee,
      assignee_detail: assigneeDetail,
    }),
    "Could not reassign the task.",
  );
