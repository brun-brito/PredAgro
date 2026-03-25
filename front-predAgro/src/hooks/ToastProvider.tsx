import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { ToastViewport, type ToastViewItem } from '../components/ui/ToastViewport';
import { ToastContext, type ToastContextData, type ToastOptions } from './toast-context';

export function ToastProvider({ children }: PropsWithChildren) {
  const nextIdRef = useRef(1);
  const timeoutMapRef = useRef(new Map<number, number>());
  const [toasts, setToasts] = useState<ToastViewItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    const timeoutId = timeoutMapRef.current.get(id);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = nextIdRef.current++;
      const duration = options?.duration ?? 6000;
      const tone = options?.tone ?? 'info';

      setToasts((current) => [...current, { id, message, tone }]);

      const timeoutId = window.setTimeout(() => {
        dismissToast(id);
      }, duration);

      timeoutMapRef.current.set(id, timeoutId);
      return id;
    },
    [dismissToast]
  );

  const showError = useCallback(
    (message: string) => showToast(message, { tone: 'error' }),
    [showToast]
  );

  const showSuccess = useCallback(
    (message: string) => showToast(message, { tone: 'success' }),
    [showToast]
  );

  useEffect(() => {
    return () => {
      timeoutMapRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutMapRef.current.clear();
    };
  }, []);

  const contextValue = useMemo<ToastContextData>(
    () => ({
      showToast,
      showError,
      showSuccess,
      dismissToast,
    }),
    [showToast, showError, showSuccess, dismissToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport toasts={toasts} onClose={dismissToast} />
    </ToastContext.Provider>
  );
}
