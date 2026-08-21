import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebounced } from "./useDebounced";

describe("useDebounced", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the initial value straight away", () => {
    const { result } = renderHook(() => useDebounced("start", 300));
    expect(result.current).toBe("start");
  });

  it("holds the old value until the delay has passed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounced(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    act(() => void vi.advanceTimersByTime(299));
    expect(result.current).toBe("a");

    act(() => void vi.advanceTimersByTime(1));
    expect(result.current).toBe("ab");
  });

  it("collapses a burst of changes into the last one", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounced(value, 300), {
      initialProps: { value: "l" },
    });

    for (const value of ["lo", "loo", "loom"]) {
      rerender({ value });
      act(() => void vi.advanceTimersByTime(100));
    }
    expect(result.current).toBe("l");

    act(() => void vi.advanceTimersByTime(300));
    expect(result.current).toBe("loom");
  });
});
