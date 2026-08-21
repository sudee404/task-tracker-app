import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tasksApi, usersApi } from "./tasks";
import type { TaskFilters, TaskInput } from "./types";

const TASKS_KEY = "tasks";

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: [TASKS_KEY, filters],
    queryFn: () => tasksApi.list(filters),
  });
}

export function useTeam() {
  return useQuery({ queryKey: ["users"], queryFn: usersApi.list, staleTime: Infinity });
}

/** Every mutation invalidates the list, so the view refetches itself. */
function useTaskMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}

export const useCreateTask = () => useTaskMutation((input: TaskInput) => tasksApi.create(input));

export const useUpdateTask = () =>
  useTaskMutation(({ id, input }: { id: number; input: Partial<TaskInput> }) =>
    tasksApi.update(id, input),
  );

export const useToggleComplete = () =>
  useTaskMutation(({ id, isComplete }: { id: number; isComplete: boolean }) =>
    tasksApi.setComplete(id, isComplete),
  );

export const useDeleteTask = () => useTaskMutation((id: number) => tasksApi.remove(id));
