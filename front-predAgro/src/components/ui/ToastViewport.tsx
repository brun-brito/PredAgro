import { FaXmark } from 'react-icons/fa6';
import type { ToastTone } from '../../hooks/toast-context';
import styles from './ToastViewport.module.css';

export interface ToastViewItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastViewportProps {
  toasts: ToastViewItem[];
  onClose: (id: number) => void;
}

export function ToastViewport({ toasts, onClose }: ToastViewportProps) {
  return (
    <div className={styles.viewport} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${toast.tone === 'success' ? styles.success : ''} ${
            toast.tone === 'info' ? styles.info : ''
          }`}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
        >
          <p>{toast.message}</p>
          <button
            type="button"
            onClick={() => onClose(toast.id)}
            className={styles.closeButton}
            aria-label="Fechar notificação"
          >
            <FaXmark />
          </button>
        </div>
      ))}
    </div>
  );
}
