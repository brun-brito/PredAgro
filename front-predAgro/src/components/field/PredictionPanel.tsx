import type { PlanRiskAssessment } from '../../types/domain';
import { LoadingState } from '../ui/LoadingState';
import { formatNumber } from '../../utils/formatters';
import styles from './PredictionPanel.module.css';

interface PredictionPanelProps {
  assessment: PlanRiskAssessment | null;
  isLoading: boolean;
}

const riskLabel = {
  LOW: 'Baixo',
  MEDIUM: 'Médio',
  HIGH: 'Alto',
};

const modeLabel = {
  forecast: 'Previsão curta',
  mixed: 'Previsão + tendência',
  historical: 'Tendência histórica',
};

const confidenceLabel = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export function PredictionPanel({ assessment, isLoading }: PredictionPanelProps) {
  const notes = assessment?.notes ?? [];
  const categories = assessment?.categories ?? [];
  const mode = assessment?.mode ?? 'forecast';
  const confidence = assessment?.confidence ?? 'high';
  const yieldForecast = assessment?.yieldForecast;

  return (
    <article className={styles.card}>
      <header>
        <h2>Risco climático e produtividade</h2>
        <p>Resultado baseado no plano de safra e nos dados climáticos disponíveis.</p>
      </header>

      {isLoading && <LoadingState label="Carregando análise..." size="sm" />}

      {!isLoading && !assessment && (
        <p>Crie um plano de safra para gerar a análise de risco.</p>
      )}

      {!isLoading && assessment && (
        <>
          <div className={styles.riskLevel}>
            <span>Nível de risco</span>
            <strong className={styles[assessment.riskLevel.toLowerCase()]}>
              {riskLabel[assessment.riskLevel]}
            </strong>
          </div>

          <div className={styles.section}>
            <h3>Resumo do plano</h3>
            <div className={styles.planSummary}>
              <span>Cultura: {assessment.cropName}</span>
              <span>
                Período: {assessment.startDate} até {assessment.endDate}
              </span>
              <span>Score geral: {assessment.score.toFixed(0)}</span>
              <span>Tipo de análise: {modeLabel[mode]}</span>
              <span>Confiabilidade: {confidenceLabel[confidence]}</span>
            </div>
          </div>

          {yieldForecast && (
            <div className={styles.section}>
              <h3>Previsão de produtividade</h3>
              <div className={styles.yieldGrid}>
                <span>Modelo: {yieldForecast.model}</span>
                <span>Base: {formatNumber(yieldForecast.baselineYield, 2)} {yieldForecast.unit}</span>
                <span>
                  Estimada: {formatNumber(yieldForecast.estimatedYield, 2)} {yieldForecast.unit}
                </span>
                <span>
                  Faixa: {formatNumber(yieldForecast.minYield, 2)}–{formatNumber(yieldForecast.maxYield, 2)}{' '}
                  {yieldForecast.unit}
                </span>
                {yieldForecast.totalProduction !== null && (
                  <span>
                    Produção total: {formatNumber(yieldForecast.totalProduction, 2)} t
                  </span>
                )}
                <span>Confiança: {confidenceLabel[yieldForecast.confidence]}</span>
              </div>
              {yieldForecast.factors.length > 0 && (
                <div className={styles.yieldFactors}>
                  <h4>Fatores de impacto</h4>
                  <ul>
                    {yieldForecast.factors.map((factor) => (
                      <li key={factor.id}>
                        {factor.label}: {formatNumber(factor.impact, 1)}%
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {yieldForecast.notes.length > 0 && (
                <div className={styles.yieldNotes}>
                  {yieldForecast.notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {notes.length > 0 && (
            <div className={styles.section}>
              <h3>Observações</h3>
              <ul>
                {notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.section}>
            <h3>Riscos por categoria</h3>
            <div className={styles.categoryList}>
              {[...categories].sort((a, b) => b.score - a.score).map((category) => (
                <div key={category.id} className={styles.categoryItem}>
                  <div className={styles.categoryHeader}>
                    <strong>{category.label}</strong>
                    <span className={`${styles.badge} ${styles[category.level.toLowerCase()]}`}>
                      {riskLabel[category.level]}
                    </span>
                    <span className={styles.score}>{category.score.toFixed(0)}</span>
                  </div>
                  {category.reasons.length > 0 && (
                    <ul>
                      {category.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}
                  {category.recommendations.length > 0 && (
                    <ul className={styles.recommendations}>
                      {category.recommendations.map((recommendation) => (
                        <li key={recommendation}>{recommendation}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </article>
  );
}
