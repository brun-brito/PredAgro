import { useEffect, type ReactNode } from 'react';
import { FaXmark } from 'react-icons/fa6';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, title, size = 'md', onClose, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={`${styles.modal} ${styles[size]}`} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          {title && <h2>{title}</h2>}
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar modal">
            <FaXmark />
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
