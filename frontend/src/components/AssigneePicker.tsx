import { useEffect, useRef, useState } from "react";

import type { Task, User } from "../api/types";
import { Avatar } from "./Avatar";

interface Props {
  task: Task;
  team: User[];
  onAssign: (member: User | null) => void;
}

/**
 * Reassignment without opening the editor: the avatar already answers "who owns
 * this", so it doubles as the control for changing the answer.
 */
export function AssigneePicker({ task, team, onAssign }: Props) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Without edit rights the avatar stays what it was: a read-only label.
  if (!task.can_edit) return <Avatar user={task.assignee_detail} />;

  const current = task.assignee_detail;
  const choose = (member: User | null) => {
    setOpen(false);
    if ((member?.id ?? null) !== (current?.id ?? null)) onAssign(member);
  };

  return (
    <div ref={container} className="relative shrink-0">
      <button
        type="button"
        // The card is draggable; without this a click here starts a drag instead.
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          current ? `Assigned to ${current.display_name}. Reassign` : "Unassigned. Assign someone"
        }
        className="rounded-full ring-offset-2 ring-offset-surface transition hover:ring-2 hover:ring-accent/50"
      >
        <Avatar user={current} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Assign to"
          className="absolute top-8 right-0 z-10 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
        >
          {team.map((member) => (
            <button
              key={member.id}
              type="button"
              role="menuitem"
              onClick={() => choose(member)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink hover:bg-surface-muted"
            >
              <Avatar user={member} />
              <span className="flex-1 truncate">{member.display_name}</span>
              {member.id === current?.id && (
                <span aria-hidden className="text-accent">
                  ✓
                </span>
              )}
            </button>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={() => choose(null)}
            className="mt-1 flex w-full items-center gap-2 border-t border-line px-3 py-1.5 text-left text-xs text-ink-soft hover:bg-surface-muted"
          >
            <Avatar user={null} />
            <span className="flex-1">Unassigned</span>
            {!current && (
              <span aria-hidden className="text-accent">
                ✓
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
