import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterBar } from "./FilterBar";
import { amara, ben } from "../test/fixtures";

const team = [amara, ben];

function setup(props: Partial<Parameters<typeof FilterBar>[0]> = {}) {
  const onChange = vi.fn();
  const onSearchChange = vi.fn();
  const utils = render(
    <FilterBar
      filters={{}}
      searchText=""
      team={team}
      onChange={onChange}
      onSearchChange={onSearchChange}
      {...props}
    />,
  );
  return { onChange, onSearchChange, ...utils };
}

describe("FilterBar", () => {
  it("reports a priority selection without dropping existing filters", async () => {
    const { onChange } = setup({ filters: { assignee: "2" } });

    await userEvent.selectOptions(screen.getByLabelText("Filter by priority"), "HIGH");

    expect(onChange).toHaveBeenCalledWith({ assignee: "2", priority: "HIGH" });
  });

  it("reports typing through the search callback", async () => {
    const { onSearchChange } = setup();

    await userEvent.type(screen.getByLabelText("Search tasks"), "a");

    expect(onSearchChange).toHaveBeenCalledWith("a");
  });

  it("lists the team as assignee options", () => {
    setup();

    expect(screen.getByRole("option", { name: "Amara Okafor" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ben Whitfield" })).toBeInTheDocument();
  });

  it("offers to clear only once something is filtered", async () => {
    const { onChange, onSearchChange, rerender } = setup();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();

    rerender(
      <FilterBar
        filters={{ priority: "HIGH" }}
        searchText=""
        team={team}
        onChange={onChange}
        onSearchChange={onSearchChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onChange).toHaveBeenCalledWith({});
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("treats a search term alone as filtered", () => {
    setup({ searchText: "outage" });

    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });
});
