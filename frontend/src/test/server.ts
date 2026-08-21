import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { amara, ben, makeTask } from "./fixtures";

/** Default happy-path handlers; individual tests override what they care about. */
export const handlers = [
  http.get("/api/auth/me/", () => HttpResponse.json(amara)),
  http.get("/api/users/", () => HttpResponse.json([amara, ben])),
  http.get("/api/tasks/", () =>
    HttpResponse.json({ count: 1, next: null, previous: null, results: [makeTask()] }),
  ),
];

export const server = setupServer(...handlers);
