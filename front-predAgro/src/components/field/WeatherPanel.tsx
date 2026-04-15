import { useEffect, useMemo, useState } from 'react';
import type { WeatherSnapshot } from '../../types/domain';
import { LoadingState } from '../ui/LoadingState';
import { formatDate, formatDateTime, formatNumber } from '../../utils/formatters';
import styles from './WeatherPanel.module.css';

interface WeatherPanelProps {
  snapshot: WeatherSnapshot | null;
  isLoading: boolean;
}

const PANEL_TITLE = 'Base climática do talhão';

export function WeatherPanel({ snapshot, isLoading }: WeatherPanelProps) {
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  const availableDates = useMemo(() => {
    if (!snapshot?.days?.length) {
      return { min: '', max: '' };
    }
    return {
      min: snapshot.days[0].date,
      max: snapshot.days[snapshot.days.length - 1].date,
    };
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot?.days?.length) {
      setRangeStart('');
      setRangeEnd('');
      return;
    }

    const { min, max } = availableDates;

    setRangeStart((current) => {
      if (!current || current < min || current > max) {
        return min;
      }
      return current;
    });

    setRangeEnd((current) => {
      if (!current || current < min || current > max) {
        return max;
      }
      return current;
    });
  }, [snapshot, availableDates]);

  const filteredDays = useMemo(() => {
    if (!snapshot?.days?.length) {
      return [];
    }
    if (rangeStart && rangeEnd && rangeEnd < rangeStart) {
      return [];
    }
    return snapshot.days.filter(
      (day) =>
        (!rangeStart || day.date >= rangeStart) &&
        (!rangeEnd || day.date <= rangeEnd)
    );
  }, [snapshot, rangeStart, rangeEnd]);

  const isInvalidRange = Boolean(rangeStart && rangeEnd && rangeEnd < rangeStart);

  if (isLoading) {
    return (
      <article className={styles.card}>
        <h2>{PANEL_TITLE}</h2>
        <LoadingState label="Carregando previsão..." size="sm" />
      </article>
    );
  }

  if (!snapshot && !isLoading) {
    return (
      <article className={styles.card}>
        <h2>{PANEL_TITLE}</h2>
        <p>Nenhum dado de previsão disponível para este talhão.</p>
      </article>
    );
  }

  return (
    <article className={styles.card}>
      <header>
        <h2>{PANEL_TITLE}</h2>
        <p>Fonte: {snapshot?.source ?? 'Open-Meteo'} · previsão diária dentro do período disponível</p>
      </header>

      <div className={styles.rangeControls}>
        <label>
          De
          <input
            type="date"
            value={rangeStart}
            min={availableDates.min}
            max={availableDates.max}
            onChange={(event) => setRangeStart(event.target.value)}
          />
        </label>
        <label>
          Até
          <input
            type="date"
            value={rangeEnd}
            min={rangeStart || availableDates.min}
            max={availableDates.max}
            onChange={(event) => setRangeEnd(event.target.value)}
          />
        </label>
      </div>
      {availableDates.min && availableDates.max && (
        <p className={styles.rangeHint}>
          Intervalo disponível: {formatDate(availableDates.min)} até {formatDate(availableDates.max)}
        </p>
      )}
      {isInvalidRange && <p className={styles.invalidRange}>A data final deve ser igual ou posterior à inicial.</p>}

      <div className={styles.list}>
        {filteredDays.map((day) => (
          <div key={day.date} className={styles.dayItem}>
            <strong>{formatDate(day.date)}</strong>
            <span>
              {formatNumber(day.temperatureMin, 0)}°C / {formatNumber(day.temperatureMax, 0)}°C
            </span>
            <span>{formatNumber(day.precipitationSum, 1)} mm</span>
          </div>
        ))}
      </div>

      {filteredDays.length === 0 && !isInvalidRange && (
        <p className={styles.emptyState}>Nenhum dado no intervalo selecionado.</p>
      )}

      {snapshot?.fetchedAt && <small>Atualizado em {formatDateTime(snapshot.fetchedAt)}</small>}
    </article>
  );
}
