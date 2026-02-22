import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { PredictionPanel } from '../components/field/PredictionPanel';
import { LoadingState } from '../components/ui/LoadingState';
import { cropService } from '../services/cropService';
import { fieldService } from '../services/fieldService';
import { planService, type PlanPayload } from '../services/planService';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/httpClient';
import type { CropProfile, Field, PlanRiskAssessment, PlantingPlan } from '../types/domain';
import styles from './FieldPlanPage.module.css';

export function FieldPlanPage() {
  const { farmId, fieldId } = useParams();
  const { token } = useAuth();
  const isMountedRef = useRef(true);

  const [field, setField] = useState<Field | null>(null);
  const [crops, setCrops] = useState<CropProfile[]>([]);
  const [plans, setPlans] = useState<PlantingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<PlanRiskAssessment | null>(null);
  const [forecastEndDate, setForecastEndDate] = useState<string | null>(null);
  const [planValues, setPlanValues] = useState<PlanPayload>({
    cropId: '',
    startDate: '',
    endDate: '',
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [planFeedback, setPlanFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const farmIdValue = useMemo(() => farmId ?? '', [farmId]);
  const fieldIdValue = useMemo(() => fieldId ?? '', [fieldId]);
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const cropMap = useMemo(() => new Map(crops.map((crop) => [crop.id, crop.name])), [crops]);
  const maxPlanDays = 180;

  const planDateLimits = useMemo(() => {
    const today = new Date(`${todayDate}T00:00:00Z`);
    const maxDate = new Date(today.getTime() + (maxPlanDays - 1) * 24 * 60 * 60 * 1000);
    return {
      min: todayDate,
      max: maxDate.toISOString().slice(0, 10),
    };
  }, [todayDate, maxPlanDays]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!token || !farmIdValue || !fieldIdValue) {
        if (isMounted) {
          setIsLoading(false);
          setIsPlanLoading(false);
        }
        return;
      }

      const cachedField = fieldService.getCachedById(token, farmIdValue, fieldIdValue);
      const cachedCrops = cropService.getCachedList(token);
      const cachedPlans = planService.getCachedListByField(token, farmIdValue, fieldIdValue);
      const cachedForecast = fieldService.getCachedForecast(token, farmIdValue, fieldIdValue);

      if (cachedField && isMounted) {
        setField(cachedField.field);
      }

      if (cachedCrops && isMounted) {
        setCrops(cachedCrops.crops);
        if (cachedCrops.crops.length > 0) {
          setPlanValues((current) =>
            current.cropId
              ? current
              : {
                  ...current,
                  cropId: cachedCrops.crops[0].id,
                }
          );
        }
      }

      if (cachedPlans && isMounted) {
        setPlans(cachedPlans.plans);
        if (cachedPlans.plans.length > 0) {
          setSelectedPlanId(cachedPlans.plans[0].id);
          const cachedRisk = planService.getCachedRisk(token, farmIdValue, fieldIdValue, cachedPlans.plans[0].id);
          if (cachedRisk) {
            setAssessment(cachedRisk.assessment);
          }
        }
      }

      if (cachedForecast && isMounted) {
        const days = cachedForecast.snapshot.days;
        setForecastEndDate(days.length ? days[days.length - 1].date : null);
      }

      if (cachedField && cachedCrops && cachedPlans) {
        if (isMounted) {
          setFeedback(null);
          setPlanFeedback(null);
          setIsLoading(false);
          setIsPlanLoading(false);
        }
        if (
          cachedPlans.plans.length > 0 &&
          cachedField.field.geometry &&
          !planService.getCachedRisk(token, farmIdValue, fieldIdValue, cachedPlans.plans[0].id)
        ) {
          void loadRisk(cachedPlans.plans[0].id, token, farmIdValue, fieldIdValue, true);
        }
        return;
      }

      setIsLoading(true);
      setIsPlanLoading(true);
      setFeedback(null);
      setAssessment(null);
      setSelectedPlanId(null);
      if (!cachedField) {
        setField(null);
      }
      if (!cachedPlans) {
        setPlans([]);
      }
      if (!cachedCrops) {
        setCrops([]);
      }
      if (!cachedForecast) {
        setForecastEndDate(null);
      }
      if (!cachedCrops) {
        setPlanValues({ cropId: '', startDate: '', endDate: '' });
      }

      try {
        const [fieldResponse, cropResponse, plansResponse] = await Promise.all([
          fieldService.getById(token, farmIdValue, fieldIdValue),
          cropService.list(token),
          planService.listByField(token, farmIdValue, fieldIdValue),
        ]);

        if (isMounted) {
          setField(fieldResponse.field);
          setCrops(cropResponse.crops);
          setPlans(plansResponse.plans);

          if (cropResponse.crops.length > 0) {
            setPlanValues((current) =>
              current.cropId
                ? current
                : {
                    ...current,
                    cropId: cropResponse.crops[0].id,
                  }
            );
          }

          if (plansResponse.plans.length > 0) {
            setSelectedPlanId(plansResponse.plans[0].id);
          }
        }

        if (fieldResponse.field.geometry) {
          if (!cachedForecast) {
            try {
              const forecastResponse = await fieldService.getForecast(token, farmIdValue, fieldIdValue);
              if (isMounted) {
                const days = forecastResponse.snapshot.days;
                setForecastEndDate(days.length ? days[days.length - 1].date : null);
              }
            } catch {
              if (isMounted) {
                setForecastEndDate(null);
              }
            }
          }
        } else if (isMounted) {
          setForecastEndDate(null);
        }

        if (isMounted && plansResponse.plans.length > 0 && fieldResponse.field.geometry) {
          const latestPlanId = plansResponse.plans[0].id;
          await loadRisk(latestPlanId, token, farmIdValue, fieldIdValue, true);
        }
      } catch (error) {
        if (isMounted) {
          setFeedback(error instanceof ApiError ? error.message : 'Não foi possível carregar o planejamento.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPlanLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [token, farmIdValue, fieldIdValue]);

  async function loadRisk(
    planId: string,
    authToken: string,
    farmParam: string,
    fieldParam: string,
    hasGeometry: boolean
  ) {
    if (!hasGeometry) {
      setPlanFeedback('Delimite o talhão para gerar a análise de risco.');
      return;
    }

    const cachedRisk = planService.getCachedRisk(authToken, farmParam, fieldParam, planId);
    if (cachedRisk) {
      if (isMountedRef.current) {
        setAssessment(cachedRisk.assessment);
        setPlanFeedback(null);
        setIsRiskLoading(false);
      }
      return;
    }

    setIsRiskLoading(true);
    setPlanFeedback(null);

    try {
      const response = await planService.getRisk(authToken, farmParam, fieldParam, planId);
      if (isMountedRef.current) {
        setAssessment(response.assessment);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setPlanFeedback(error instanceof ApiError ? error.message : 'Não foi possível gerar a análise do plano.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsRiskLoading(false);
      }
    }
  }

  function updatePlanField(fieldKey: keyof PlanPayload, value: string) {
    setPlanValues((current) => ({
      ...current,
      [fieldKey]: value,
    }));
    if (planFeedback) {
      setPlanFeedback(null);
    }
  }

  function validatePlan(payload: PlanPayload) {
    if (!payload.cropId || !payload.startDate || !payload.endDate) {
      return 'Preencha cultura, data inicial e data final.';
    }

    if (payload.endDate < payload.startDate) {
      return 'A data final precisa ser igual ou posterior à data inicial.';
    }

    const start = new Date(`${payload.startDate}T00:00:00Z`);
    const end = new Date(`${payload.endDate}T00:00:00Z`);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > maxPlanDays) {
      return `O intervalo máximo para planejamento é de ${maxPlanDays} dias.`;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (payload.startDate < today) {
      return 'A data inicial deve ser hoje ou uma data futura.';
    }

    if (payload.startDate > planDateLimits.max || payload.endDate > planDateLimits.max) {
      return 'A data informada está fora do período de planejamento disponível.';
    }

    if (!field?.geometry) {
      return 'Delimite o talhão para gerar a análise de risco.';
    }

    return null;
  }

  async function handleCreatePlan() {
    if (!token || !farmIdValue || !fieldIdValue) {
      return;
    }

    const validation = validatePlan(planValues);
    if (validation) {
      setPlanFeedback(validation);
      return;
    }

    setIsSubmitting(true);
    setPlanFeedback(null);

    try {
      const response = await planService.create(token, farmIdValue, fieldIdValue, planValues);
      setPlans((current) => [response.plan, ...current]);
      setSelectedPlanId(response.plan.id);
      setAssessment(null);
      setPlanValues((current) => ({
        ...current,
        startDate: '',
        endDate: '',
      }));
      await loadRisk(response.plan.id, token, farmIdValue, fieldIdValue, true);
    } catch (error) {
      setPlanFeedback(error instanceof ApiError ? error.message : 'Não foi possível salvar o plano.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectPlan(planId: string) {
    if (!token || !farmIdValue || !fieldIdValue) {
      return;
    }

    setSelectedPlanId(planId);
    setAssessment(null);
    void loadRisk(planId, token, farmIdValue, fieldIdValue, Boolean(field?.geometry));
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Planejamento</p>
            <h1>{field?.name ?? 'Talhão selecionado'}</h1>
            <p className={styles.subtitle}>Defina o período de safra e acompanhe o risco climático.</p>
          </div>
          <div className={styles.headerActions}>
            <Link to={`/fazendas/${farmIdValue}/talhoes/${fieldIdValue}`} className={styles.outlineButton}>
              <FaArrowLeft />
              Voltar
            </Link>
          </div>
        </header>

        {feedback && <p className={styles.feedback}>{feedback}</p>}

        {isLoading ? (
          <div className={styles.loadingBlock}>
            <LoadingState label="Carregando planejamento..." />
          </div>
        ) : (
          <section className={styles.grid}>
            <div className={styles.card}>
              <h2>Novo plano de safra</h2>
              {!field?.geometry && (
                <p className={styles.warning}>Delimite o talhão para gerar análise e previsões confiáveis.</p>
              )}
              <div className={styles.planForm}>
                <label>
                  Cultura
                  <select value={planValues.cropId} onChange={(event) => updatePlanField('cropId', event.target.value)}>
                    <option value="">Selecione</option>
                    {crops.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Data inicial
                  <input
                    type="date"
                    value={planValues.startDate}
                    onChange={(event) => updatePlanField('startDate', event.target.value)}
                    min={planDateLimits.min}
                    max={planDateLimits.max}
                  />
                </label>
                <label>
                  Data final
                  <input
                    type="date"
                    value={planValues.endDate}
                    onChange={(event) => updatePlanField('endDate', event.target.value)}
                    min={planValues.startDate || planDateLimits.min}
                    max={planDateLimits.max}
                  />
                </label>
              </div>
              <p className={styles.helperText}>
                O intervalo máximo para planejamento é de {maxPlanDays} dias.{' '}
                {field?.geometry
                  ? `Previsão diária disponível até ${
                      forecastEndDate ? new Date(forecastEndDate).toLocaleDateString('pt-BR') : '16 dias'
                    }; após isso usamos tendência histórica.`
                  : 'Delimite o talhão para liberar previsões diárias e análise completa.'}
              </p>
              {planFeedback && <p className={styles.feedback}>{planFeedback}</p>}
              <div className={styles.planActions}>
                <button
                  type="button"
                  onClick={handleCreatePlan}
                  disabled={isSubmitting || !field?.geometry}
                  className={styles.primaryButton}
                >
                  {isSubmitting ? 'Salvando...' : 'Gerar análise'}
                </button>
              </div>

              <div className={styles.planList}>
                <h3>Planos cadastrados</h3>
                {isPlanLoading ? (
                  <LoadingState label="Carregando planos..." size="sm" />
                ) : plans.length === 0 ? (
                  <p>Nenhum plano cadastrado para este talhão.</p>
                ) : (
                  <ul>
                    {plans.map((plan) => (
                      <li key={plan.id} className={plan.id === selectedPlanId ? styles.activePlan : ''}>
                        <div>
                          <strong>{cropMap.get(plan.cropId) ?? plan.cropId}</strong>
                          <span>
                            {plan.startDate} até {plan.endDate}
                          </span>
                        </div>
                        <button type="button" onClick={() => handleSelectPlan(plan.id)}>
                          Ver análise
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <PredictionPanel assessment={assessment} isLoading={isLoading || isRiskLoading} />
          </section>
        )}
      </section>
    </main>
  );
}
