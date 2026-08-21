import { useState, type FormEvent } from "react";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/context";

const FIELD =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition hover:border-accent/40";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username, password);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.detail : "Could not reach the server.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-on-accent">
            ✓
          </span>
          <h1 className="text-lg font-semibold text-ink">Task Tracker</h1>
        </div>
        <p className="mb-6 text-sm text-ink-soft">Sign in to your team workspace.</p>

        <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className={`${FIELD} mb-4`}
          autoFocus
        />

        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={FIELD}
        />

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Demo accounts: amara, ben, priya, sofia — password <code className="rounded bg-surface-muted px-1 py-0.5 text-ink-soft">password123</code>
        </p>
      </form>
    </div>
  );
}
