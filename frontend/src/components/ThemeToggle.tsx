import { useTheme } from "../theme/context";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="grid size-9 place-items-center rounded-lg text-ink-soft transition hover:bg-surface-muted hover:text-ink"
    >
      <svg viewBox="0 0 20 20" className="size-4.5 fill-none stroke-current" strokeWidth="1.5">
        {isDark ? (
          <>
            <circle cx="10" cy="10" r="3.5" />
            <path d="M10 2v1.5M10 16.5V18M18 10h-1.5M3.5 10H2M15.7 4.3l-1 1M5.3 14.7l-1 1M15.7 15.7l-1-1M5.3 5.3l-1-1" strokeLinecap="round" />
          </>
        ) : (
          <path d="M16 11.8A6.5 6.5 0 1 1 8.2 4a5.2 5.2 0 0 0 7.8 7.8Z" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
