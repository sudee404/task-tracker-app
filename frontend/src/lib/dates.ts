/** Whole days from today to `date`; negative once the date has passed. */
export function daysUntil(date: string, now: Date = new Date()): number {
  const due = new Date(`${date}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Work due today is not late yet — you still have the day. Comparing a due
 * date against the current *time* would call it overdue from 00:01.
 */
export function isOverdue(
  date: string | null,
  isComplete: boolean,
  now: Date = new Date(),
): boolean {
  if (!date || isComplete) return false;
  return daysUntil(date, now) < 0;
}
