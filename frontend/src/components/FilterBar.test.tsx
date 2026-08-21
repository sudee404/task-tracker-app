import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterBar } from "./FilterBar";
import { amara, ben } from "../test/fixtures";

const team = [amara, ben];

describe("FilterBar", () => {
  it("reports a status selection without dropping existing filters", async () => {
    const onChange = vi.fn();
    render(<FilterBar filters={{ search: "api" }} team={team} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Filter by status"), "complete");

    expect(onChange).toHaveBeenCalledWith({ search: "api", status: "complete" });
  });

  it("lists the team as assignee options", () => {
    render(<FilterBar filters={{}} team={team} onChange={vi.fn()} />);

    expect(
      screen.getByRole("option", { name: "Amara Okafor" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ben Whitfield" })).toBeInTheDocument();
  });

  it("offers to clear filters only once something is filtered", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<FilterBar filters={{}} team={team} onChange={onChange} />);
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();

    rerender(<FilterBar filters={{ priority: "HIGH" }} team={team} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onChange).toHaveBeenCalledWith({});
  });
});
