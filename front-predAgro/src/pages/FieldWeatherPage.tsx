import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaArrowRotateRight } from 'react-icons/fa6';
import { WeatherPanel } from '../components/field/WeatherPanel';
import { LoadingState } from '../components/ui/LoadingState';
import { fieldService } from '../services/fieldService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { Field, WeatherSnapshot } from '../types/domain';
import { resolveErrorMessage } from '../utils/errors';
import styles from './FieldWeatherPage.module.css';

export function FieldWeatherPage() {
  const { farmId, fieldId } = useParams();
  const { token } = useAuth();
  const { showError } = useToast();

  const [field, setField] = useState<Field | null>(null);
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const farmIdValue = useMemo(() => farmId ?? '', [farmId]);
  const fieldIdValue = useMemo(() => fieldId ?? '', [fieldId]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!token || !farmIdValue || !fieldIdValue) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const cachedField = fieldService.getCachedById(token, farmIdValue, fieldIdValue);
      if (cachedField && isMounted) {
        setField(cachedField.field);
      }

        if (cachedField && !cachedField.field.geometry) {
          if (isMounted) {
            setSnapshot(null);
            setFeedback('Delimite o talhão para liberar a previsão climática usada no planejamento.');
            setIsLoading(false);
          }
          return;
      }

      const cachedForecast = fieldService.getCachedForecast(token, farmIdValue, fieldIdValue);
      if (cachedField && cachedForecast && isMounted) {
        setSnapshot(cachedForecast.snapshot);
        setFeedback(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setFeedback(null);
      setSnapshot(null);
      if (!cachedField) {
        setField(null);
      }

      if (!cachedField) {
        try {
          const fieldResponse = await fieldService.getById(token, farmIdValue, fieldIdValue);
          if (isMounted) {
            setField(fieldResponse.field);
          }
          if (!fieldResponse.field.geometry) {
            if (isMounted) {
              setSnapshot(null);
              setFeedback('Delimite o talhão para liberar a previsão climática usada no planejamento.');
              setIsLoading(false);
            }
            return;
          }
        } catch (error) {
          if (isMounted) {
            setFeedback(null);
            showError(resolveErrorMessage(error, 'Não foi possível carregar o talhão.'));
            setIsLoading(false);
          }
          return;
        }
      }

      try {
        const forecastResponse = await fieldService.getForecast(token, farmIdValue, fieldIdValue);
        if (isMounted) {
          setSnapshot(forecastResponse.snapshot);
        }
      } catch (error) {
        if (isMounted) {
          setSnapshot(null);
          showError(resolveErrorMessage(error, 'Não foi possível carregar a previsão.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [token, farmIdValue, fieldIdValue, showError]);

  async function handleRefresh() {
    if (!token || !farmIdValue || !fieldIdValue) {
      return;
    }

    setIsRefreshing(true);
    setFeedback(null);

    try {
      const response = await fieldService.refreshForecast(token, farmIdValue, fieldIdValue);
      setSnapshot(response.snapshot);
    } catch (error) {
      showError(resolveErrorMessage(error, 'Não foi possível atualizar a previsão.'));
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Previsão climática</p>
            <h1>{field?.name ?? 'Talhão selecionado'}</h1>
            <p className={styles.subtitle}>Acompanhe a previsão diária usada no planejamento do talhão.</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={handleRefresh}
              className={styles.outlineButton}
              disabled={isRefreshing || isLoading}
            >
              <FaArrowRotateRight />
              Atualizar previsão
            </button>
            <Link to={`/fazendas/${farmIdValue}/talhoes/${fieldIdValue}`} className={styles.outlineButton}>
              <FaArrowLeft />
              Voltar
            </Link>
          </div>
        </header>

        {feedback && <p className={styles.feedback}>{feedback}</p>}

        {isLoading ? (
          <div className={styles.loadingBlock}>
            <LoadingState label="Carregando previsão..." />
          </div>
        ) : (
          <div className={styles.grid}>
            <WeatherPanel snapshot={snapshot} isLoading={isLoading || isRefreshing} />
            {!snapshot && (
              <div className={styles.card}>
                <h2>Próximos passos</h2>
                <p>Delimite o talhão para liberar a previsão diária e a análise operacional.</p>
                <Link
                  to={`/fazendas/${farmIdValue}/talhoes/${fieldIdValue}/delimitacao`}
                  className={styles.primaryButton}
                >
                  Delimitar talhão
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
