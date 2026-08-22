import { daysUntil, isOverdue } from "../lib/dates";

/** Renders a due date, flagging anything overdue that is not yet finished. */
export function DueDate({ date, isComplete }: { date: string | null; isComplete: boolean }) {
  if (!date) return null;

  const days = daysUntil(date);
  const overdue = isOverdue(date, isComplete);
  const due = new Date(`${date}T00:00:00`);

  const label =
    days === 0
      ? "Today"
      : days === 1
        ? "Tomorrow"
        : due.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: due.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
          });

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        overdue ? "text-danger" : "text-ink-soft"
      }`}
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 shrink-0 fill-none stroke-current">
        <rect x="2.5" y="3.5" width="11" height="10" rx="2" strokeWidth="1.3" />
        <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {overdue ? `Overdue · ${label}` : label}
    </span>
  );
}
