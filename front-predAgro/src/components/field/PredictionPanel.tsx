import type { PredictionSummary } from '../../types/domain';
import { LoadingState } from '../ui/LoadingState';
import styles from './PredictionPanel.module.css';

interface PredictionPanelProps {
  summary: PredictionSummary | null;
  isLoading: boolean;
}

const riskLabel = {
  LOW: 'Baixo',
  MEDIUM: 'Médio',
  HIGH: 'Alto',
};

export function PredictionPanel({ summary, isLoading }: PredictionPanelProps) {
  return (
    <article className={styles.card}>
      <header>
        <h2>Risco climático</h2>
        <p>Resumo interpretável para decisão rápida.</p>
      </header>

      {isLoading && <LoadingState label="Carregando análise..." size="sm" />}

      {!isLoading && summary && (
        <>
          <div className={styles.riskLevel}>
            <span>Nível de risco</span>
            <strong className={styles[summary.riskLevel.toLowerCase()]}>{riskLabel[summary.riskLevel]}</strong>
          </div>

          <div className={styles.section}>
            <h3>Motivos</h3>
            <ul>
              {summary.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Recomendações</h3>
            <ul>
              {summary.recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </article>
  );
}
