/** Renders a due date, flagging anything overdue that is not yet finished. */
export function DueDate({ date, isComplete }: { date: string | null; isComplete: boolean }) {
  if (!date) return null;

  const due = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = !isComplete && due < today;

  const label = due.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: due.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });

  return (
    <span className={overdue ? "text-rose-600 font-medium" : "text-slate-500"}>
      {overdue ? `Overdue — ${label}` : `Due ${label}`}
    </span>
  );
}
