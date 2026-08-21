import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { useDeleteTask } from "./hooks";
import { server } from "../test/server";
import { ToastProvider } from "../toast/ToastProvider";

function DeleteButton() {
  const remove = useDeleteTask();
  return (
    <button type="button" onClick={() => remove.mutate(1)}>
      Delete it
    </button>
  );
}

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <DeleteButton />
      </QueryClientProvider>
    </ToastProvider>,
  );
}

/** DRF's own wording describes its internals; users get ours instead. */
describe("failure messages", () => {
  it("explains a 403 in terms of the permission rule", async () => {
    server.use(http.delete("/api/tasks/1/", () => new HttpResponse(null, { status: 403 })));
    setup();

    await userEvent.click(screen.getByRole("button"));

    expect(
      await screen.findByText(/only change tasks you created or were assigned/),
    ).toBeInTheDocument();
  });

  it("does not leak DRF's 404 body to the user", async () => {
    server.use(
      http.delete("/api/tasks/1/", () =>
        HttpResponse.json({ detail: "No Task matches the given query." }, { status: 404 }),
      ),
    );
    setup();

    await userEvent.click(screen.getByRole("button"));

    expect(await screen.findByText(/no longer exists/)).toBeInTheDocument();
    expect(screen.queryByText(/matches the given query/)).not.toBeInTheDocument();
  });

  it("stays quiet on a 400, which the form reports inline instead", async () => {
    server.use(
      http.delete("/api/tasks/1/", () =>
        HttpResponse.json({ title: ["Title cannot be blank."] }, { status: 400 }),
      ),
    );
    setup();

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.queryByText(/Request failed/)).not.toBeInTheDocument());
    expect(screen.queryByText(/Could not delete/)).not.toBeInTheDocument();
  });

  it("falls back to plain wording on a server error", async () => {
    server.use(http.delete("/api/tasks/1/", () => new HttpResponse(null, { status: 500 })));
    setup();

    await userEvent.click(screen.getByRole("button"));

    expect(await screen.findByText("Could not delete the task.")).toBeInTheDocument();
  });

  it("can be dismissed", async () => {
    server.use(http.delete("/api/tasks/1/", () => new HttpResponse(null, { status: 500 })));
    setup();

    await userEvent.click(screen.getByRole("button"));
    await screen.findByText("Could not delete the task.");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    await waitFor(() =>
      expect(screen.queryByText("Could not delete the task.")).not.toBeInTheDocument(),
    );
  });
});
