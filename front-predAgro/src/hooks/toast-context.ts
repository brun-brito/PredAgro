import { createContext } from 'react';

export type ToastTone = 'error' | 'success' | 'info';

export interface ToastOptions {
  tone?: ToastTone;
  duration?: number;
}

export interface ToastContextData {
  showToast: (message: string, options?: ToastOptions) => number;
  showError: (message: string) => number;
  showSuccess: (message: string) => number;
  dismissToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextData | undefined>(undefined);
