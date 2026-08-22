import { describe, expect, it } from "vitest";

import { daysUntil, isOverdue } from "./dates";

// Mid-afternoon, so a naive `dueDate < new Date()` would wrongly call today late.
const NOW = new Date("2026-08-22T15:30:00");

describe("daysUntil", () => {
  it("counts today as zero regardless of the time of day", () => {
    expect(daysUntil("2026-08-22", NOW)).toBe(0);
    expect(daysUntil("2026-08-22", new Date("2026-08-22T23:59:00"))).toBe(0);
  });

  it("counts forwards and backwards", () => {
    expect(daysUntil("2026-08-23", NOW)).toBe(1);
    expect(daysUntil("2026-08-21", NOW)).toBe(-1);
  });
});

describe("isOverdue", () => {
  it("does not call work due today late — you still have the day", () => {
    expect(isOverdue("2026-08-22", false, NOW)).toBe(false);
  });

  it("calls yesterday late", () => {
    expect(isOverdue("2026-08-21", false, NOW)).toBe(true);
  });

  it("never calls finished work late", () => {
    expect(isOverdue("2026-08-01", true, NOW)).toBe(false);
  });

  it("treats a missing due date as not late", () => {
    expect(isOverdue(null, false, NOW)).toBe(false);
  });
});
