import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../api/client";
import { TaskForm } from "./TaskForm";
import { amara, ben, makeTask } from "../test/fixtures";

const team = [amara, ben];

describe("TaskForm", () => {
  it("submits the entered title, description, assignee and priority", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm team={team} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Title"), "Ship the tracker");
    await userEvent.type(screen.getByLabelText("Description"), "End to end");
    await userEvent.selectOptions(screen.getByLabelText("Assignee"), "2");
    await userEvent.selectOptions(screen.getByLabelText("Priority"), "HIGH");
    await userEvent.click(screen.getByRole("button", { name: "Add task" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Ship the tracker",
      description: "End to end",
      priority: "HIGH",
      due_date: null,
      assignee: 2,
    });
  });

  it("pre-fills the fields when editing an existing task", () => {
    const task = makeTask({ title: "Existing", description: "Body", priority: "LOW", assignee: 2 });
    render(<TaskForm team={team} task={task} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText("Title")).toHaveValue("Existing");
    expect(screen.getByLabelText("Description")).toHaveValue("Body");
    expect(screen.getByLabelText("Priority")).toHaveValue("LOW");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("sends a null assignee when left unassigned", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm team={team} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Title"), "Nobody's job");
    await userEvent.click(screen.getByRole("button", { name: "Add task" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ assignee: null }));
  });

  it("shows the server's validation error beside the field", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(400, { title: ["Title cannot be blank."] }));
    render(<TaskForm team={team} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByText("Title cannot be blank.")).toBeInTheDocument();
  });

  it("closes without submitting when cancelled", async () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    render(<TaskForm team={team} onSubmit={onSubmit} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
