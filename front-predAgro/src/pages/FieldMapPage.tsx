import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { FieldMapEditor } from '../components/maps/FieldMapEditor';
import { LoadingState } from '../components/ui/LoadingState';
import { farmService } from '../services/farmService';
import { fieldService } from '../services/fieldService';
import { geocodingService } from '../services/geocodingService';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/httpClient';
import { formatNumber } from '../utils/formatters';
import type { Farm, Field, FieldGeometry } from '../types/domain';
import styles from './FieldMapPage.module.css';

export function FieldMapPage() {
  const { farmId, fieldId } = useParams();
  const { token } = useAuth();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [field, setField] = useState<Field | null>(null);
  const [geometryDraft, setGeometryDraft] = useState<FieldGeometry | null>(null);
  const [areaDraft, setAreaDraft] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const farmIdValue = useMemo(() => farmId ?? '', [farmId]);
  const fieldIdValue = useMemo(() => fieldId ?? '', [fieldId]);

  useEffect(() => {
    let isMounted = true;

    async function loadField() {
      if (!token || !farmIdValue || !fieldIdValue) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const cachedField = fieldService.getCachedById(token, farmIdValue, fieldIdValue);
      const cachedFarm = farmService.getCachedById(token, farmIdValue);
      if (cachedField && isMounted) {
        setField(cachedField.field);
        setGeometryDraft(cachedField.field.geometry);
        setAreaDraft(cachedField.field.areaHa);
      }
      if (cachedFarm && isMounted) {
        setFarm(cachedFarm.farm);
      }

      if (cachedField && cachedFarm) {
        if (isMounted) {
          setFeedback(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setFeedback(null);
      if (!cachedFarm) {
        setFarm(null);
      }
      if (!cachedField) {
        setField(null);
        setGeometryDraft(null);
        setAreaDraft(null);
      }

      try {
        const [fieldResponse, farmResponse] = await Promise.all([
          cachedField ? Promise.resolve({ field: cachedField.field }) : fieldService.getById(token, farmIdValue, fieldIdValue),
          cachedFarm ? Promise.resolve({ farm: cachedFarm.farm }) : farmService.getById(token, farmIdValue),
        ]);
        if (isMounted) {
          setField(fieldResponse.field);
          setGeometryDraft(fieldResponse.field.geometry);
          setAreaDraft(fieldResponse.field.areaHa);
          setFarm(farmResponse.farm);
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

  useEffect(() => {
    let isActive = true;

    if (field?.geometry) {
      setMapCenter(null);
      setLocationFeedback(null);
      return () => {
        isActive = false;
      };
    }

    if (!farm?.city || !farm?.state) {
      setMapCenter(null);
      return () => {
        isActive = false;
      };
    }

    setLocationFeedback(null);

    geocodingService
      .lookupCityState(farm.city, farm.state)
      .then((center) => {
        if (isActive) {
          setMapCenter(center);
        }
      })
      .catch((error) => {
        if (isActive) {
          setMapCenter(null);
          setLocationFeedback(error instanceof Error ? error.message : 'Não foi possível localizar a cidade.');
        }
      });

    return () => {
      isActive = false;
    };
  }, [farm?.city, farm?.state, field?.geometry]);

  async function handleSave() {
    if (!token || !farmIdValue || !fieldIdValue) {
      return;
    }

    if (!geometryDraft) {
      setFeedback('Desenhe o polígono do talhão antes de salvar.');
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fieldService.update(token, farmIdValue, fieldIdValue, { geometry: geometryDraft });
      setField(response.field);
      setGeometryDraft(response.field.geometry);
      setAreaDraft(response.field.areaHa);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : 'Não foi possível salvar a delimitação.');
    } finally {
      setIsSaving(false);
    }
  }

  const areaLabel =
    areaDraft !== null && areaDraft !== undefined
      ? `${formatNumber(areaDraft, 2)} ha`
      : field?.areaHa !== null && field?.areaHa !== undefined
      ? `${formatNumber(field.areaHa, 2)} ha`
      : 'Não definida';

  const hasDraftGeometry = Boolean(geometryDraft);

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Delimitação</p>
            <h1>{field?.name ?? 'Talhão selecionado'}</h1>
            <p className={styles.subtitle}>Desenhe o polígono do talhão para liberar previsões e análise.</p>
          </div>
          <div className={styles.headerActions}>
            <Link to={`/fazendas/${farmIdValue}/talhoes/${fieldIdValue}`} className={styles.outlineButton}>
              <FaArrowLeft />
              Voltar
            </Link>
          </div>
        </header>

        {feedback && <p className={styles.feedback}>{feedback}</p>}
        {locationFeedback && !feedback && <p className={styles.helperText}>{locationFeedback}</p>}

        {isLoading ? (
          <div className={styles.loadingBlock}>
            <LoadingState label="Carregando delimitação..." />
          </div>
        ) : (
          <>
            <section className={styles.guideGrid}>
              <article className={styles.guideCard}>
                <h2>Passo a passo para delimitar</h2>
                <ol className={styles.stepList}>
                  <li>Aproxime o mapa até enxergar a área real do talhão.</li>
                  <li>Clique no ícone de polígono no canto superior direito do mapa.</li>
                  <li>Marque os pontos ao redor da área; no último ponto, clique novamente no primeiro para fechar.</li>
                  <li>Se precisar ajustar, use a ferramenta de edição para mover os vértices ou a lixeira para começar de novo.</li>
                  <li>Confira a área estimada abaixo do mapa e clique em salvar.</li>
                </ol>
              </article>

              <article className={styles.statusCard}>
                <h2>Status da delimitação</h2>
                <div className={styles.statusList}>
                  <div>
                    <span>Situação</span>
                    <strong>{hasDraftGeometry ? 'Polígono pronto para salvar' : 'Aguardando desenho'}</strong>
                  </div>
                  <div>
                    <span>Área estimada</span>
                    <strong>{areaLabel}</strong>
                  </div>
                  <div>
                    <span>Base do mapa</span>
                    <strong>{farm?.city && farm?.state ? `${farm.city} - ${farm.state}` : 'Brasil central'}</strong>
                  </div>
                </div>
                <p className={styles.helperText}>
                  Dica: quanto mais você aproximar antes de desenhar, mais fácil fica encaixar o contorno do talhão.
                </p>
              </article>
            </section>

            <section className={styles.card}>
              <FieldMapEditor
                geometry={geometryDraft}
                center={mapCenter}
                onGeometryChange={(geometry, areaHa) => {
                  setGeometryDraft(geometry);
                  setAreaDraft(areaHa);
                }}
                helperContent={
                  <div className={styles.mapHelper}>
                    <p>
                      {hasDraftGeometry
                        ? 'Polígono desenhado. Se necessário, ajuste os vértices no mapa e salve novamente.'
                        : 'O desenho ainda não foi iniciado. Use o botão de polígono no canto superior direito do mapa.'}
                    </p>
                  </div>
                }
              />
              <div className={styles.cardFooter}>
                <span>Área estimada: {areaLabel}</span>
                <button type="button" onClick={handleSave} disabled={isSaving} className={styles.primaryButton}>
                  {isSaving ? 'Salvando...' : 'Salvar delimitação'}
                </button>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
