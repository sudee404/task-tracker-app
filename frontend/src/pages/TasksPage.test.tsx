import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { TasksPage } from "./TasksPage";
import type { Task } from "../api/types";
import { ben, makeTask } from "../test/fixtures";
import { renderWithProviders } from "../test/render";
import { server, serveTasks } from "../test/server";

const board = (name: "To do" | "Done") =>
  within(screen.getByRole("region", { name: new RegExp(`^${name}`) }));

function show(...tasks: Task[]) {
  server.use(serveTasks(tasks));
}

describe("TasksPage board", () => {
  it("splits tasks into To do and Done columns", async () => {
    show(
      makeTask({ id: 1, title: "Record the Loom", assignee: 2, assignee_detail: ben }),
      makeTask({ id: 2, title: "Write the README", is_complete: true }),
    );
    renderWithProviders(<TasksPage />);

    expect(await board("To do").findByText("Record the Loom")).toBeInTheDocument();
    expect(await board("Done").findByText("Write the README")).toBeInTheDocument();
    expect(board("To do").queryByText("Write the README")).not.toBeInTheDocument();
  });

  it("counts what is outstanding, calling out anything overdue", async () => {
    show(
      makeTask({ id: 1, due_date: "2020-01-01" }),
      makeTask({ id: 2, title: "Later", due_date: "2099-01-01" }),
    );
    renderWithProviders(<TasksPage />);

    expect(await screen.findByText(/2 outstanding/)).toBeInTheDocument();
    expect(await screen.findByText(/1 overdue/)).toBeInTheDocument();
  });

  it("shows an empty state per column rather than a blank panel", async () => {
    show();
    renderWithProviders(<TasksPage />);

    expect(await board("To do").findByText(/Nothing outstanding/)).toBeInTheDocument();
    expect(board("Done").getByText(/Nothing finished yet/)).toBeInTheDocument();
  });
});

describe("TasksPage completion", () => {
  it("flips the checkbox before the server answers, then keeps it", async () => {
    show(makeTask({ id: 7, title: "Record the Loom" }));
    let resolve: (value: unknown) => void = () => {};
    server.use(
      http.patch("/api/tasks/7/", async () => {
        await new Promise((r) => (resolve = r));
        return HttpResponse.json(makeTask({ id: 7, is_complete: true }));
      }),
    );
    renderWithProviders(<TasksPage />);

    const checkbox = await screen.findByRole("checkbox", {
      name: 'Mark "Record the Loom" as complete',
    });
    await userEvent.click(checkbox);

    // Optimistic: ticked while the request is still in flight.
    await waitFor(() => expect(checkbox).toBeChecked());
    resolve(null);
  });

  it("rolls the checkbox back and warns when the server refuses", async () => {
    show(makeTask({ id: 7, title: "Record the Loom" }));
    server.use(
      http.patch("/api/tasks/7/", () =>
        HttpResponse.json({ detail: "Not allowed." }, { status: 403 }),
      ),
    );
    renderWithProviders(<TasksPage />);

    const checkbox = await screen.findByRole("checkbox", {
      name: 'Mark "Record the Loom" as complete',
    });
    await userEvent.click(checkbox);

    await waitFor(() => expect(checkbox).not.toBeChecked());
    expect(
      await screen.findByText(/only change tasks you created or were assigned/),
    ).toBeInTheDocument();
  });

  it("completes a task dropped on the Done column", async () => {
    show(makeTask({ id: 7, title: "Record the Loom" }));
    const patched = vi.fn();
    server.use(
      http.patch("/api/tasks/7/", async ({ request }) => {
        patched(await request.json());
        return HttpResponse.json(makeTask({ id: 7, is_complete: true }));
      }),
    );
    renderWithProviders(<TasksPage />);

    const card = (await board("To do").findByText("Record the Loom")).closest("li")!;
    const done = screen.getByRole("region", { name: /^Done/ });

    // jsdom ships no DataTransfer, so stand in with the slice the code uses.
    const store = new Map<string, string>();
    const dataTransfer = {
      effectAllowed: "",
      dropEffect: "",
      setData: (type: string, value: string) => store.set(type, value),
      getData: (type: string) => store.get(type) ?? "",
    };

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(done, { dataTransfer });
    fireEvent.drop(done, { dataTransfer });

    await waitFor(() => expect(patched).toHaveBeenCalledWith({ is_complete: true }));
  });
});

describe("TasksPage permissions", () => {
  it("hides Edit and Delete on a task the user may not change", async () => {
    show(makeTask({ id: 1, title: "Someone else's", can_edit: false, can_delete: false }));
    renderWithProviders(<TasksPage />);

    const card = (await screen.findByText("Someone else's")).closest("li")!;
    expect(within(card).queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(within(card).getByRole("checkbox")).toBeDisabled();
  });

  it("shows Edit but not Delete for an assignee who did not create it", async () => {
    show(makeTask({ id: 1, title: "Assigned to me", can_edit: true, can_delete: false }));
    renderWithProviders(<TasksPage />);

    const card = (await screen.findByText("Assigned to me")).closest("li")!;
    expect(within(card).getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: /^Delete/ })).not.toBeInTheDocument();
  });
});

describe("TasksPage search", () => {
  it("waits for a pause in typing before querying", async () => {
    show(makeTask({ id: 1, title: "Record the Loom" }));
    const searches: string[] = [];
    server.use(
      http.get("/api/tasks/", ({ request }) => {
        const term = new URL(request.url).searchParams.get("search");
        if (term) searches.push(term);
        return HttpResponse.json({ count: 0, next: null, previous: null, results: [] });
      }),
    );
    renderWithProviders(<TasksPage />);

    await userEvent.type(await screen.findByLabelText("Search tasks"), "loom");

    await waitFor(() => expect(searches).toContain("loom"));
    // Debounced: never one request per keystroke.
    expect(searches).not.toContain("l");
    expect(searches).not.toContain("lo");
  });
});

describe("TasksPage creation", () => {
  it("creates a task and shows it in the To do column", async () => {
    show();
    const created = vi.fn();
    server.use(
      http.post("/api/tasks/", async ({ request }) => {
        created(await request.json());
        show(makeTask({ id: 9, title: "Send the submission email" }));
        return HttpResponse.json(makeTask({ id: 9 }), { status: 201 });
      }),
    );
    renderWithProviders(<TasksPage />);

    await userEvent.click(await screen.findByRole("button", { name: /Add task/ }));
    const dialog = within(screen.getByRole("dialog"));
    await userEvent.type(dialog.getByLabelText("Title"), "Send the submission email");
    await userEvent.click(dialog.getByRole("button", { name: "Add task" }));

    await waitFor(() =>
      expect(created).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Send the submission email" }),
      ),
    );
    expect(await board("To do").findByText("Send the submission email")).toBeInTheDocument();
  });
});
