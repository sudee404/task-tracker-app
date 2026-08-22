import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AssigneePicker } from "./AssigneePicker";
import { amara, ben, makeTask } from "../test/fixtures";

const team = [amara, ben];

function setup(task = makeTask()) {
  const onAssign = vi.fn();
  render(<AssigneePicker task={task} team={team} onAssign={onAssign} />);
  return { onAssign };
}

const trigger = () => screen.getByRole("button", { name: /Reassign|Assign someone/ });

describe("AssigneePicker", () => {
  it("describes who holds the task, for screen readers too", () => {
    setup(makeTask({ assignee: 2, assignee_detail: ben }));
    expect(screen.getByRole("button", { name: "Assigned to Ben Whitfield. Reassign" })).toBeInTheDocument();
  });

  it("says so when nobody holds it", () => {
    setup();
    expect(screen.getByRole("button", { name: "Unassigned. Assign someone" })).toBeInTheDocument();
  });

  it("lists the team and an unassign option", async () => {
    setup();
    await userEvent.click(trigger());

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Amara Okafor/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Ben Whitfield/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Unassigned/ })).toBeInTheDocument();
  });

  it("reports the chosen member", async () => {
    const { onAssign } = setup();
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole("menuitem", { name: /Ben Whitfield/ }));

    expect(onAssign).toHaveBeenCalledWith(ben);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("reports null when unassigning", async () => {
    const { onAssign } = setup(makeTask({ assignee: 2, assignee_detail: ben }));
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole("menuitem", { name: /Unassigned/ }));

    expect(onAssign).toHaveBeenCalledWith(null);
  });

  it("does not fire when picking the person already assigned", async () => {
    const { onAssign } = setup(makeTask({ assignee: 2, assignee_detail: ben }));
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole("menuitem", { name: /Ben Whitfield/ }));

    expect(onAssign).not.toHaveBeenCalled();
  });

  it("closes on Escape without assigning", async () => {
    const { onAssign } = setup();
    await userEvent.click(trigger());
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(onAssign).not.toHaveBeenCalled();
  });

  it("closes when clicking away", async () => {
    setup();
    await userEvent.click(trigger());
    await userEvent.click(document.body);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("is a plain label, not a control, without edit rights", () => {
    setup(makeTask({ can_edit: false, assignee: 2, assignee_detail: ben }));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
