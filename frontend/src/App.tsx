import { useAuth } from "./auth/context";
import { LoginPage } from "./pages/LoginPage";
import { TasksPage } from "./pages/TasksPage";

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return user ? <TasksPage /> : <LoginPage />;
}
