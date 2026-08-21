import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

import { AuthProvider } from "../auth/AuthContext";
import { ThemeProvider } from "../theme/ThemeProvider";
import { ToastProvider } from "../toast/ToastProvider";

/** Renders a component inside the providers the real app supplies. */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return render(
    <ThemeProvider>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{ui}</AuthProvider>
        </QueryClientProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}
