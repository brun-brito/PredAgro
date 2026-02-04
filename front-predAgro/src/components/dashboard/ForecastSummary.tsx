import type { PredictionSummary } from '../../types/domain';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import styles from './ForecastSummary.module.css';

interface ForecastSummaryProps {
  prediction: PredictionSummary;
  isLoading: boolean;
}

export function ForecastSummary({ prediction, isLoading }: ForecastSummaryProps) {
  return (
    <article className={styles.card}>
      <header>
        <h2>Resumo de previsão</h2>
        <p>Cultura monitorada: {prediction.crop}</p>
      </header>

      <div className={styles.row}>
        <span>Produtividade estimada</span>
        <strong>{isLoading ? 'Carregando...' : `${formatNumber(prediction.expectedYieldBagsPerHectare)} sc/ha`}</strong>
      </div>

      <div className={styles.row}>
        <span>Janela de colheita</span>
        <strong>{isLoading ? 'Carregando...' : prediction.nextHarvestWindow}</strong>
      </div>

      <div className={styles.confidenceBlock}>
        <div className={styles.row}>
          <span>Confiança do modelo</span>
          <strong>{isLoading ? 'Carregando...' : formatPercentage(prediction.confidence)}</strong>
        </div>
        <div className={styles.progressTrack}>
          <span
            className={styles.progressBar}
            style={{ width: `${Math.max(0, Math.min(prediction.confidence, 100))}%` }}
          />
        </div>
      </div>
    </article>
  );
}
