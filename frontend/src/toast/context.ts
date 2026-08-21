import { createContext, useContext } from "react";

export interface Toast {
  id: number;
  message: string;
  tone: "error" | "success";
}

export interface ToastState {
  toasts: Toast[];
  notify: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastState>({
  toasts: [],
  notify: () => {},
  dismiss: () => {},
});

export const useToast = () => useContext(ToastContext);
