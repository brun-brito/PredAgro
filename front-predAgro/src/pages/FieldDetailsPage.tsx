import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaArrowRotateRight } from 'react-icons/fa6';
import { FieldMapEditor } from '../components/maps/FieldMapEditor';
import { PredictionPanel } from '../components/field/PredictionPanel';
import { WeatherPanel } from '../components/field/WeatherPanel';
import { LoadingState } from '../components/ui/LoadingState';
import { ApiError } from '../services/httpClient';
import { fieldService } from '../services/fieldService';
import { predictionService } from '../services/predictionService';
import { useAuth } from '../hooks/useAuth';
import type { Field, FieldGeometry, PredictionSummary, WeatherSnapshot } from '../types/domain';
import styles from './FieldDetailsPage.module.css';

export function FieldDetailsPage() {
  const { fieldId, farmId } = useParams();
  const { token } = useAuth();

  const [field, setField] = useState<Field | null>(null);
  const [geometryDraft, setGeometryDraft] = useState<FieldGeometry | null>(null);
  const [areaDraft, setAreaDraft] = useState<number | null>(null);
  const [forecast, setForecast] = useState<WeatherSnapshot | null>(null);
  const [prediction, setPrediction] = useState<PredictionSummary | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const farmIdValue = useMemo(() => farmId ?? '', [farmId]);
  const fieldIdValue = useMemo(() => fieldId ?? '', [fieldId]);

  useEffect(() => {
    let isMounted = true;

    async function loadField() {
      if (!token || !farmIdValue || !fieldIdValue) {
        return;
      }

      setIsLoading(true);
      setFeedback(null);

      try {
        const fieldResponse = await fieldService.getById(token, farmIdValue, fieldIdValue);
        const forecastResponse = await fieldService.getForecast(token, farmIdValue, fieldIdValue);
        const predictionResponse = await predictionService.getSummary(token, farmIdValue, fieldIdValue);

        if (isMounted) {
          setField(fieldResponse.field);
          setGeometryDraft(fieldResponse.field.geometry);
          setForecast(forecastResponse.snapshot);
          setPrediction(predictionResponse.summary);
        }
      } catch (error) {
        if (isMounted) {
          setFeedback(error instanceof ApiError ? error.message : 'Não foi possível carregar o talhão.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadField();

    return () => {
      isMounted = false;
    };
  }, [token, farmIdValue, fieldIdValue]);

  async function handleRefresh() {
    if (!token || !farmIdValue || !fieldIdValue) {
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const forecastResponse = await fieldService.refreshForecast(token, farmIdValue, fieldIdValue);
      const predictionResponse = await predictionService.getSummary(token, farmIdValue, fieldIdValue);

      setForecast(forecastResponse.snapshot);
      setPrediction(predictionResponse.summary);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : 'Não foi possível atualizar a previsão.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveGeometry() {
    if (!token || !farmIdValue || !fieldIdValue || !geometryDraft) {
      setFeedback('Desenhe ou atualize o polígono do talhão antes de salvar.');
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fieldService.update(token, farmIdValue, fieldIdValue, {
        geometry: geometryDraft,
      });

      setField(response.field);
      setGeometryDraft(response.field.geometry);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : 'Não foi possível salvar o talhão.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Talhão</p>
            <h1>{field?.name ?? 'Talhão selecionado'}</h1>
            <p className={styles.subtitle}>Acompanhe clima, área e riscos do talhão.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" onClick={handleRefresh} className={styles.outlineButton}>
              <FaArrowRotateRight />
              Atualizar previsão
            </button>
            <Link to="/fazendas" className={styles.outlineButton}>
              <FaArrowLeft />
              Voltar para fazendas
            </Link>
          </div>
        </header>

        {feedback && <p className={styles.feedback}>{feedback}</p>}

        {isLoading && (
          <div className={styles.loadingBlock}>
            <LoadingState label="Carregando dados do talhão..." />
          </div>
        )}

        <section className={styles.grid}>
          <div className={styles.card}>
            <h2>Delimitação do talhão</h2>
            <FieldMapEditor
              geometry={geometryDraft}
              onGeometryChange={(geometry, areaHa) => {
                setGeometryDraft(geometry);
                setAreaDraft(areaHa);
              }}
            />
            <div className={styles.cardFooter}>
              <span>
                Área estimada: {areaDraft ? `${areaDraft.toFixed(2)} ha` : field ? `${field.areaHa.toFixed(2)} ha` : '-'}
              </span>
              <button type="button" onClick={handleSaveGeometry} disabled={isSaving || !geometryDraft}>
                {isSaving ? 'Salvando...' : 'Salvar geometria'}
              </button>
            </div>
          </div>

          <WeatherPanel snapshot={forecast} isLoading={isLoading} />
          <PredictionPanel summary={prediction} isLoading={isLoading} />
        </section>
      </section>
    </main>
  );
}
