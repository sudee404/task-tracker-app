import type { TaskFilters, User } from "../api/types";

interface Props {
  filters: TaskFilters;
  team: User[];
  onChange: (filters: TaskFilters) => void;
}

const SELECT =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none";

export function FilterBar({ filters, team, onChange }: Props) {
  const set = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch });
  const isFiltered = Boolean(
    filters.search || filters.status || filters.assignee || filters.priority,
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        aria-label="Search tasks"
        placeholder="Search tasks…"
        value={filters.search ?? ""}
        onChange={(event) => set({ search: event.target.value })}
        className={`${SELECT} min-w-56 flex-1`}
      />

      <select
        aria-label="Filter by status"
        value={filters.status ?? ""}
        onChange={(event) => set({ status: event.target.value as TaskFilters["status"] })}
        className={SELECT}
      >
        <option value="">All statuses</option>
        <option value="incomplete">Incomplete</option>
        <option value="complete">Complete</option>
      </select>

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
          onClick={() => onChange({})}
          className="text-sm font-medium text-slate-500 underline underline-offset-4 hover:text-slate-800"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
