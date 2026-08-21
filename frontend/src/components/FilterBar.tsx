import type { TaskFilters, User } from "../api/types";

interface Props {
  filters: TaskFilters;
  searchText: string;
  team: User[];
  onSearchChange: (value: string) => void;
  onChange: (filters: TaskFilters) => void;
}

const SELECT =
  "h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink-soft transition hover:border-accent/40";

export function FilterBar({ filters, searchText, team, onSearchChange, onChange }: Props) {
  const set = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch });
  const isFiltered = Boolean(searchText || filters.assignee || filters.priority);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 fill-none stroke-ink-faint"
        >
          <circle cx="7" cy="7" r="4.5" strokeWidth="1.4" />
          <path d="m10.5 10.5 3 3" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          aria-label="Search tasks"
          placeholder="Search tasks…"
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`${SELECT} w-full pl-9 text-ink placeholder:text-ink-faint`}
        />
      </div>

      <select
        aria-label="Filter by assignee"
        value={filters.assignee ?? ""}
        onChange={(event) => set({ assignee: event.target.value })}
        className={SELECT}
      >
        <option value="">Anyone</option>
        {team.map((member) => (
          <option key={member.id} value={String(member.id)}>
            {member.display_name}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by priority"
        value={filters.priority ?? ""}
        onChange={(event) => set({ priority: event.target.value as TaskFilters["priority"] })}
        className={SELECT}
      >
        <option value="">Any priority</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>

      {isFiltered && (
        <button
          type="button"
          onClick={() => {
            onSearchChange("");
            onChange({});
          }}
          className="h-9 rounded-lg px-3 text-sm font-medium text-accent-ink hover:bg-accent-soft"
        >
          Clear
        </button>
      )}
    </div>
  );
}
