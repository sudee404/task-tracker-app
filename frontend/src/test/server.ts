import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import type { Task } from "../api/types";
import { amara, ben, makeTask } from "./fixtures";

/**
 * The board issues one request per column, so the mock has to honour `status`
 * (and the filters) rather than returning a fixed list.
 */
export function serveTasks(tasks: Task[]) {
  return http.get("/api/tasks/", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const search = params.get("search")?.toLowerCase();
    const priority = params.get("priority");
    const assignee = params.get("assignee");

    let matched = tasks;
    if (status) matched = matched.filter((t) => t.is_complete === (status === "complete"));
    if (priority) matched = matched.filter((t) => t.priority === priority);
    if (assignee) matched = matched.filter((t) => String(t.assignee) === assignee);
    if (search) {
      matched = matched.filter(
        (t) =>
          t.title.toLowerCase().includes(search) || t.description.toLowerCase().includes(search),
      );
    }

    return HttpResponse.json({
      count: matched.length,
      next: null,
      previous: null,
      results: matched,
    });
  });
}

export const handlers = [
  http.get("/api/auth/me/", () => HttpResponse.json(amara)),
  http.get("/api/users/", () => HttpResponse.json([amara, ben])),
  serveTasks([makeTask()]),
];

export const server = setupServer(...handlers);
