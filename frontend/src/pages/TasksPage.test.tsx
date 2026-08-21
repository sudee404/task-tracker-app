import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { TasksPage } from "./TasksPage";
import { makeTask, ben } from "../test/fixtures";
import { renderWithProviders } from "../test/render";
import { server } from "../test/server";

function listReturns(...tasks: ReturnType<typeof makeTask>[]) {
  server.use(
    http.get("/api/tasks/", () =>
      HttpResponse.json({ count: tasks.length, next: null, previous: null, results: tasks }),
    ),
  );
}

describe("TasksPage", () => {
  it("shows each task's title, status and assigned user", async () => {
    listReturns(
      makeTask({ id: 1, title: "Write the API", assignee: 2, assignee_detail: ben }),
      makeTask({ id: 2, title: "Deploy it", is_complete: true }),
    );
    renderWithProviders(<TasksPage />);

    // Scoped to the list: the filter bar also mentions team members.
    const list = within(await screen.findByRole("list"));
    expect(list.getByText("Write the API")).toBeInTheDocument();
    expect(list.getByText("Ben Whitfield")).toBeInTheDocument();
    expect(list.getByText("Unassigned")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: 'Mark "Deploy it" as incomplete' }),
    ).toBeChecked();
  });

  it("counts what is still outstanding", async () => {
    listReturns(makeTask({ id: 1 }), makeTask({ id: 2, is_complete: true }));
    renderWithProviders(<TasksPage />);

    expect(await screen.findByText("1 of 2 outstanding")).toBeInTheDocument();
  });

  it("patches is_complete when a task is ticked off", async () => {
    listReturns(makeTask({ id: 7, title: "Write the API" }));
    const patched = vi.fn();
    server.use(
      http.patch("/api/tasks/7/", async ({ request }) => {
        patched(await request.json());
        return HttpResponse.json(makeTask({ id: 7, is_complete: true }));
      }),
    );
    renderWithProviders(<TasksPage />);

    await userEvent.click(
      await screen.findByRole("checkbox", { name: 'Mark "Write the API" as complete' }),
    );

    await waitFor(() => expect(patched).toHaveBeenCalledWith({ is_complete: true }));
  });

  it("creates a task and refreshes the list", async () => {
    listReturns();
    const created = vi.fn();
    server.use(
      http.post("/api/tasks/", async ({ request }) => {
        created(await request.json());
        listReturns(makeTask({ id: 9, title: "Ship the tracker" }));
        return HttpResponse.json(makeTask({ id: 9, title: "Ship the tracker" }), { status: 201 });
      }),
    );
    renderWithProviders(<TasksPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Add task" }));

    const dialog = within(screen.getByRole("dialog"));
    await userEvent.type(dialog.getByLabelText("Title"), "Ship the tracker");
    await userEvent.click(dialog.getByRole("button", { name: "Add task" }));

    await waitFor(() =>
      expect(created).toHaveBeenCalledWith(expect.objectContaining({ title: "Ship the tracker" })),
    );
    expect(await screen.findByText("Ship the tracker")).toBeInTheDocument();
  });

  it("sends the search term to the API as a query parameter", async () => {
    listReturns(makeTask());
    const requested: string[] = [];
    server.use(
      http.get("/api/tasks/", ({ request }) => {
        requested.push(new URL(request.url).searchParams.get("search") ?? "");
        return HttpResponse.json({ count: 0, next: null, previous: null, results: [] });
      }),
    );
    renderWithProviders(<TasksPage />);

    await userEvent.type(await screen.findByLabelText("Search tasks"), "outage");

    await waitFor(() => expect(requested).toContain("outage"));
  });

  it("explains an empty list rather than showing nothing", async () => {
    listReturns();
    renderWithProviders(<TasksPage />);

    expect(await screen.findByText(/No tasks match/)).toBeInTheDocument();
  });
});
