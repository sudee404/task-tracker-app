import type { User } from "../api/types";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ user, size = "sm" }: { user: User | null; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";

  if (!user) {
    return (
      <span
        aria-hidden
        className={`${dimension} inline-flex items-center justify-center rounded-full border border-dashed border-line text-ink-faint`}
      >
        ?
      </span>
    );
  }

  return (
    <span
      title={user.display_name}
      className={`${dimension} inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-ink`}
    >
      {initials(user.display_name)}
    </span>
  );
}
