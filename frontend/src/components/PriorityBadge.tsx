import type { Priority } from "../api/types";

const DOT: Record<Priority, string> = {
  HIGH: "bg-high",
  MEDIUM: "bg-medium",
  LOW: "bg-low",
};

const LABELS: Record<Priority, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };

/** A dot plus a word — quieter than a filled pill, still scannable in a column. */
export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
      <span aria-hidden className={`size-1.5 rounded-full ${DOT[priority]}`} />
      {LABELS[priority]}
    </span>
  );
}
