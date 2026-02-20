import type { WeatherSnapshot } from '../../types/domain';
import { LoadingState } from '../ui/LoadingState';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import styles from './WeatherPanel.module.css';

interface WeatherPanelProps {
  snapshot: WeatherSnapshot | null;
  isLoading: boolean;
}

export function WeatherPanel({ snapshot, isLoading }: WeatherPanelProps) {
  if (isLoading) {
    return (
      <article className={styles.card}>
        <h2>Previsão climática</h2>
        <LoadingState label="Carregando previsão..." size="sm" />
      </article>
    );
  }

  if (!snapshot && !isLoading) {
    return (
      <article className={styles.card}>
        <h2>Previsão climática</h2>
        <p>Nenhum dado de previsão disponível para este talhão.</p>
      </article>
    );
  }

  return (
    <article className={styles.card}>
      <header>
        <h2>Previsão climática</h2>
        <p>Fonte: {snapshot?.source ?? 'Open-Meteo'}</p>
      </header>

      <div className={styles.list}>
        {(snapshot?.days ?? []).map((day) => (
          <div key={day.date} className={styles.dayItem}>
            <strong>{new Date(day.date).toLocaleDateString('pt-BR')}</strong>
            <span>
              {formatNumber(day.temperatureMin, 0)}°C / {formatNumber(day.temperatureMax, 0)}°C
            </span>
            <span>{formatNumber(day.precipitationSum, 1)} mm</span>
          </div>
        ))}
      </div>

      {snapshot?.fetchedAt && <small>Atualizado em {formatDateTime(snapshot.fetchedAt)}</small>}
    </article>
  );
}
