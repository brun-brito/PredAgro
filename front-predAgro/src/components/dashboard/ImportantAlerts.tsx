import type { AlertItem } from '../../types/domain';
import { formatDateTime } from '../../utils/formatters';
import styles from './ImportantAlerts.module.css';

interface ImportantAlertsProps {
  alerts: AlertItem[];
  isLoading: boolean;
}

export function ImportantAlerts({ alerts, isLoading }: ImportantAlertsProps) {
  return (
    <article className={styles.card}>
      <header>
        <h2>Alertas importantes</h2>
        <p>Eventos que merecem atenção no curto prazo.</p>
      </header>

      <ul className={styles.alertList}>
        {alerts.map((alert) => (
          <li key={alert.id} className={styles.alertItem}>
            <div className={styles.alertHeader}>
              <strong>{alert.title}</strong>
              <span className={`${styles.badge} ${styles[alert.severity]}`}>
                {alert.severity === 'high' && 'Alta'}
                {alert.severity === 'medium' && 'Média'}
                {alert.severity === 'low' && 'Baixa'}
              </span>
            </div>
            <p>{isLoading ? 'Carregando...' : alert.description}</p>
            <small>{formatDateTime(alert.createdAt)}</small>
          </li>
        ))}
      </ul>
    </article>
  );
}
