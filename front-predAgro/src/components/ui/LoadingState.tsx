import styles from './LoadingState.module.css';

interface LoadingStateProps {
  label?: string;
  size?: 'sm' | 'md';
}

export function LoadingState({ label = 'Carregando...', size = 'md' }: LoadingStateProps) {
  return (
    <div className={`${styles.wrapper} ${styles[size]}`} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
