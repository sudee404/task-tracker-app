import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "../components/ThemeToggle";

function setup() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("theme", () => {
  it("starts light when the system has no dark preference", () => {
    setup();
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("toggles the root class and remembers the choice", async () => {
    setup();

    await userEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("task-tracker-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("restores a stored preference over the system default", () => {
    localStorage.setItem("task-tracker-theme", "dark");
    setup();
    expect(document.documentElement).toHaveClass("dark");
  });
});
