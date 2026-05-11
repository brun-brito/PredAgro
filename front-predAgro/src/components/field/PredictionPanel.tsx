import type { PlanRiskAssessment } from '../../types/domain';
import { FaCircleInfo } from 'react-icons/fa6';
import { LoadingState } from '../ui/LoadingState';
import { formatDate, formatNumber } from '../../utils/formatters';
import styles from './PredictionPanel.module.css';

interface PredictionPanelProps {
  assessment: PlanRiskAssessment | null;
  isLoading: boolean;
  farmName?: string;
  fieldName?: string;
}

const riskLabel = {
  LOW: 'Baixo',
  MEDIUM: 'Médio',
  HIGH: 'Alto',
};

function buildCategoryRangeInfo(category: PlanRiskAssessment['categories'][number]) {
  const parts = [
    category.acceptableRange ? `Faixa aceitável:\n${category.acceptableRange}` : null,
    category.observedRange ? `Valor obtido:\n${category.observedRange}` : null,
    category.rangeInterpretation ?? null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join('\n\n') : 'A análise não trouxe detalhes adicionais de faixa para esta categoria.';
}

export function PredictionPanel({ assessment, isLoading, farmName, fieldName }: PredictionPanelProps) {
  const notes = assessment?.notes ?? [];
  const categories = assessment?.categories ?? [];
  const yieldForecast = assessment?.yieldForecast;
  const cycleEstimate = assessment?.cycleEstimate;
  const dominantCategories = [...categories]
    .filter((category) => category.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((category) => `${category.label.toLowerCase()} (${category.score.toFixed(0)})`);
  const dominantFactors = (yieldForecast?.factors ?? [])
    .filter((factor) => factor.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 2)
    .map((factor) => `${factor.label.toLowerCase()} (${formatNumber(factor.impact, 1)}%)`);
  const cycleInfo = cycleEstimate
    ? `Data final estimada por soma térmica simplificada. Base térmica de ${cycleEstimate.baseTempC.toFixed(
        0
      )} °C, referência de ${cycleEstimate.referenceTempC.toFixed(
        1
      )} °C, alvo de ${cycleEstimate.targetDegreeDays.toFixed(0)} graus-dia e climatologia histórica do local.`
    : 'A data final foi estimada a partir da soma térmica simplificada e da climatologia histórica do período.';
  const assessmentMethodInfo =
    dominantCategories.length > 0
      ? `A análise usa climatologia histórica do local para todo o período do plano. Os fatores que mais pesaram no resultado foram ${dominantCategories.join(' e ')}.`
      : 'A análise usa climatologia histórica do local para todo o período do plano.';
  const yieldConfidenceInfo = (() => {
    const factorsNote =
      dominantFactors.length > 0
        ? `Os impactos dominantes na produtividade foram ${dominantFactors.join(' e ')}.`
        : 'Não houve fator de impacto dominante relevante na produtividade estimada.';

    return yieldForecast
      ? [
          'A estimativa de produtividade usa o modelo agroclimático parametrizado com base histórica do local.',
          factorsNote,
        ].join(' ')
      : '';
  })();

  return (
    <article className={styles.card}>
      <header>
        <h2>Risco climático e produtividade</h2>
        <p>Resultado do modelo agroclimático com base no plano e nos dados climáticos disponíveis.</p>
      </header>

      {isLoading && <LoadingState label="Carregando análise..." size="sm" />}

      {!isLoading && !assessment && (
        <p>Crie um plano para gerar a análise de risco.</p>
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
              {farmName && <span>Fazenda: {farmName}</span>}
              {fieldName && <span>Talhão: {fieldName}</span>}
              <span>Cultura: {assessment.cropName}</span>
              <span className={styles.periodLine}>
                <span>Período: {formatDate(assessment.startDate)} até {formatDate(assessment.endDate)}</span>
                <button
                  type="button"
                  className={styles.infoButton}
                  data-tooltip={cycleInfo}
                  aria-label="Informações sobre o cálculo da data final"
                >
                  <FaCircleInfo />
                </button>
              </span>
              {cycleEstimate && <span>Ciclo projetado: {cycleEstimate.estimatedCycleDays} dias</span>}
              <span>Score geral: {assessment.score.toFixed(0)}</span>
              <span className={styles.periodLine}>
                <span>Base da análise: climatologia histórica do local</span>
                <button
                  type="button"
                  className={styles.infoButton}
                  data-tooltip={assessmentMethodInfo}
                  aria-label="Informações sobre a base metodológica da análise"
                >
                  <FaCircleInfo />
                </button>
              </span>
            </div>
          </div>

          {yieldForecast && (
            <div className={styles.section}>
              <h3>Previsão de produtividade</h3>
              <div className={styles.yieldGrid}>
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
                <span className={styles.periodLine}>
                  <span>Base da produtividade: modelo agroclimático histórico</span>
                  <button
                    type="button"
                    className={styles.infoButton}
                    data-tooltip={yieldConfidenceInfo}
                    aria-label="Informações sobre a metodologia da produtividade estimada"
                  >
                    <FaCircleInfo />
                  </button>
                </span>
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
                    <span className={styles.periodLine}>
                      <strong>{category.label}</strong>
                      <button
                        type="button"
                        className={styles.infoButton}
                        data-tooltip={buildCategoryRangeInfo(category)}
                        aria-label={`Informações sobre a faixa analisada em ${category.label}`}
                      >
                        <FaCircleInfo />
                      </button>
                    </span>
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
