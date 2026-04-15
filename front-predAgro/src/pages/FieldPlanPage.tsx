import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { PredictionPanel } from '../components/field/PredictionPanel';
import { LoadingState } from '../components/ui/LoadingState';
import { cropService } from '../services/cropService';
import { fieldService } from '../services/fieldService';
import { farmService } from '../services/farmService';
import { planService, type PlanPayload } from '../services/planService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type {
  CropProfile,
  Farm,
  Field,
  PlanRiskAssessment,
  PlantingPlan,
} from '../types/domain';
import { resolveErrorMessage } from '../utils/errors';
import { formatDate } from '../utils/formatters';
import styles from './FieldPlanPage.module.css';

const PRIMARY_CROP_ID = 'milho';
const PRIMARY_CROP_NAME = 'Milho 1ª safra';

export function FieldPlanPage() {
  const { farmId, fieldId } = useParams();
  const { token } = useAuth();
  const isMountedRef = useRef(true);
  const { showError, showSuccess } = useToast();

  const [field, setField] = useState<Field | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [crops, setCrops] = useState<CropProfile[]>([]);
  const [plans, setPlans] = useState<PlantingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<PlanRiskAssessment | null>(null);
  const [forecastEndDate, setForecastEndDate] = useState<string | null>(null);
  const [planValues, setPlanValues] = useState<PlanPayload>({
    cropId: PRIMARY_CROP_ID,
    startDate: '',
  });
  const [planFeedback, setPlanFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const farmIdValue = useMemo(() => farmId ?? '', [farmId]);
  const fieldIdValue = useMemo(() => fieldId ?? '', [fieldId]);
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const cropMap = useMemo(() => new Map(crops.map((crop) => [crop.id, crop.name])), [crops]);
  const maxStartLeadDays = 365;
  const visiblePlans = useMemo(() => plans.filter((plan) => plan.cropId === PRIMARY_CROP_ID), [plans]);
  const selectedCrop = useMemo(
    () => crops.find((crop) => crop.id === PRIMARY_CROP_ID) ?? null,
    [crops]
  );

  const planDateLimits = useMemo(() => {
    const today = new Date(`${todayDate}T00:00:00Z`);
    const maxDate = new Date(today.getTime() + (maxStartLeadDays - 1) * 24 * 60 * 60 * 1000);
    return {
      min: todayDate,
      max: maxDate.toISOString().slice(0, 10),
    };
  }, [todayDate, maxStartLeadDays]);

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
      const cachedFarm = farmService.getCachedById(token, farmIdValue);
      const cachedCrops = cropService.getCachedList(token);
      const cachedPlans = planService.getCachedListByField(token, farmIdValue, fieldIdValue);
      const cachedForecast = fieldService.getCachedForecast(token, farmIdValue, fieldIdValue);

      if (cachedField && isMounted) {
        setField(cachedField.field);
      }

      if (cachedFarm && isMounted) {
        setFarm(cachedFarm.farm);
      }

      if (cachedCrops && isMounted) {
        setCrops(cachedCrops.crops);
        if (cachedCrops.crops.some((crop) => crop.id === PRIMARY_CROP_ID)) {
          setPlanValues((current) =>
            current.cropId === PRIMARY_CROP_ID
              ? current
              : {
                  ...current,
                  cropId: PRIMARY_CROP_ID,
                }
          );
        }
      }

      if (cachedPlans && isMounted) {
        setPlans(cachedPlans.plans);
        const firstVisiblePlan = cachedPlans.plans.find((plan) => plan.cropId === PRIMARY_CROP_ID);
        if (firstVisiblePlan) {
          setSelectedPlanId(firstVisiblePlan.id);
          const cachedRisk = planService.getCachedRisk(token, farmIdValue, fieldIdValue, firstVisiblePlan.id);
          if (cachedRisk) {
            setAssessment(cachedRisk.assessment);
          }
        }
      }

      if (cachedForecast && isMounted) {
        const days = cachedForecast.snapshot.days;
        setForecastEndDate(days.length ? days[days.length - 1].date : null);
      }

      if (cachedField && cachedFarm && cachedCrops && cachedPlans) {
        if (isMounted) {
          setPlanFeedback(null);
          setIsLoading(false);
          setIsPlanLoading(false);
        }
        const firstVisiblePlan = cachedPlans.plans.find((plan) => plan.cropId === PRIMARY_CROP_ID);
        if (
          firstVisiblePlan &&
          cachedField.field.geometry &&
          !planService.getCachedRisk(token, farmIdValue, fieldIdValue, firstVisiblePlan.id)
        ) {
          void loadRisk(firstVisiblePlan.id, token, farmIdValue, fieldIdValue, true);
        }
        return;
      }

      setIsLoading(true);
      setIsPlanLoading(true);
      setAssessment(null);
      setSelectedPlanId(null);
      if (!cachedField) {
        setField(null);
      }
      if (!cachedFarm) {
        setFarm(null);
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
        setPlanValues({ cropId: PRIMARY_CROP_ID, startDate: '' });
      }

      try {
        const [fieldResponse, farmResponse, cropResponse, plansResponse] = await Promise.all([
          fieldService.getById(token, farmIdValue, fieldIdValue),
          farmService.getById(token, farmIdValue),
          cropService.list(token),
          planService.listByField(token, farmIdValue, fieldIdValue),
        ]);

        if (isMounted) {
          setField(fieldResponse.field);
          setFarm(farmResponse.farm);
          setCrops(cropResponse.crops);
          setPlans(plansResponse.plans);

          if (cropResponse.crops.some((crop) => crop.id === PRIMARY_CROP_ID)) {
            setPlanValues((current) =>
              current.cropId === PRIMARY_CROP_ID
                ? current
                : {
                    ...current,
                    cropId: PRIMARY_CROP_ID,
                  }
            );
          }

          const firstVisiblePlan = plansResponse.plans.find((plan) => plan.cropId === PRIMARY_CROP_ID);
          if (firstVisiblePlan) {
            setSelectedPlanId(firstVisiblePlan.id);
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

        if (isMounted && fieldResponse.field.geometry) {
          const latestPlanId = plansResponse.plans.find((plan) => plan.cropId === PRIMARY_CROP_ID)?.id;
          if (!latestPlanId) {
            return;
          }
          await loadRisk(latestPlanId, token, farmIdValue, fieldIdValue, true);
        }
      } catch (error) {
        if (isMounted) {
          showError(resolveErrorMessage(error, 'Não foi possível carregar o planejamento.'));
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
  }, [token, farmIdValue, fieldIdValue, showError]);

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
        showError(resolveErrorMessage(error, 'Não foi possível gerar a análise do plano.'));
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
    if (!payload.startDate) {
      return 'Preencha a data inicial.';
    }

    if (payload.cropId !== PRIMARY_CROP_ID) {
      return 'O planejamento está disponível apenas para milho 1ª safra.';
    }

    const today = new Date().toISOString().slice(0, 10);
    if (payload.startDate < today) {
      return 'A data inicial deve ser hoje ou uma data futura.';
    }

    if (payload.startDate > planDateLimits.max) {
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
      setAssessment(response.assessment);
      setPlanValues((current) => ({
        ...current,
        startDate: '',
      }));
      showSuccess('Análise criada com sucesso.');
    } catch (error) {
      showError(resolveErrorMessage(error, 'Não foi possível salvar o plano.'));
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

  async function handleDeletePlan(plan: PlantingPlan) {
    if (!token || !farmIdValue || !fieldIdValue) {
      return;
    }

    const cropName = cropMap.get(plan.cropId) ?? plan.cropId;
    const shouldDelete = window.confirm(
      `Deseja apagar a análise de ${cropName} criada para o período de ${formatDate(plan.startDate)} até ${formatDate(plan.endDate)}?`
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingPlanId(plan.id);
    setPlanFeedback(null);

    try {
      await planService.remove(token, farmIdValue, fieldIdValue, plan.id);

      const remainingPlans = plans.filter((item) => item.id !== plan.id);
      setPlans(remainingPlans);

      if (selectedPlanId === plan.id) {
        const nextPlan = remainingPlans.find((item) => item.cropId === PRIMARY_CROP_ID) ?? null;
        setSelectedPlanId(nextPlan?.id ?? null);
        setAssessment(null);

        if (nextPlan) {
          await loadRisk(nextPlan.id, token, farmIdValue, fieldIdValue, Boolean(field?.geometry));
        }
      }
      showSuccess('Análise apagada com sucesso.');
    } catch (error) {
      showError(resolveErrorMessage(error, 'Não foi possível apagar a análise.'));
    } finally {
      setDeletingPlanId(null);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Planejamento</p>
            <h1>{field?.name ?? 'Talhão selecionado'}</h1>
            <p className={styles.subtitle}>
              {farm?.name ? `Fazenda ${farm.name}. ` : ''}
              Informe a data de início da semeadura para estimar o fim do ciclo e acompanhar risco climático e produtividade.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link to={`/fazendas/${farmIdValue}/talhoes/${fieldIdValue}`} className={styles.outlineButton}>
              <FaArrowLeft />
              Voltar
            </Link>
          </div>
        </header>
        {isLoading ? (
          <div className={styles.loadingBlock}>
            <LoadingState label="Carregando planejamentos..." />
          </div>
        ) : (
          <section className={styles.grid}>
            <div className={styles.card}>
              <h2>Novo plano de plantio</h2>
              {!field?.geometry && (
                <p className={styles.warning}>Delimite o talhão para gerar análise e previsões confiáveis.</p>
              )}
              <div className={styles.planForm}>
                <div className={styles.fixedCropField}>
                  <span>Cultura analisada</span>
                  <strong>{selectedCrop?.name ?? PRIMARY_CROP_NAME}</strong>
                  <small>
                    {selectedCrop?.description ??
                      'Planejamento baseado nas regras agroclimáticas do milho 1ª safra.'}
                  </small>
                </div>
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
              </div>
              <p className={styles.helperText}>
                A data inicial pode ser informada para os próximos {maxStartLeadDays} dias.{' '}
                {field?.geometry
                  ? `Previsão diária disponível até ${
                      forecastEndDate ? formatDate(forecastEndDate) : '16 dias'
                    }; após isso o sistema complementa a análise com climatologia histórica.`
                  : 'Delimite o talhão para liberar previsões diárias, estimativa do ciclo e a análise completa.'}
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
                ) : visiblePlans.length === 0 ? (
                  <p>Nenhum plano cadastrado para este talhão.</p>
                ) : (
                  <ul>
                    {visiblePlans.map((plan) => (
                      <li key={plan.id} className={plan.id === selectedPlanId ? styles.activePlan : ''}>
                        <div>
                          <strong>{cropMap.get(plan.cropId) ?? PRIMARY_CROP_NAME}</strong>
                          <span>
                            Semeadura em {formatDate(plan.startDate)} · colheita estimada em {formatDate(plan.endDate)}
                          </span>
                        </div>
                        <div className={styles.planItemActions}>
                          <button type="button" onClick={() => handleSelectPlan(plan.id)}>
                            Ver análise
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(plan)}
                            className={styles.deleteButton}
                            disabled={deletingPlanId === plan.id}
                          >
                            {deletingPlanId === plan.id ? 'Apagando...' : 'Apagar'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <PredictionPanel
              assessment={assessment}
              isLoading={isLoading || isRiskLoading}
              farmName={farm?.name}
              fieldName={field?.name}
            />
          </section>
        )}
      </section>
    </main>
  );
}
