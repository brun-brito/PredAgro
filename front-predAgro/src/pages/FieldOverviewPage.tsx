import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { LoadingState } from '../components/ui/LoadingState';
import { FieldFormModal } from '../components/forms/FieldFormModal';
import { farmService } from '../services/farmService';
import { fieldService } from '../services/fieldService';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/httpClient';
import { formatNumber } from '../utils/formatters';
import type { Farm, Field } from '../types/domain';
import styles from './FieldOverviewPage.module.css';

const soilLabel: Record<string, string> = {
  arenoso: 'Arenoso',
  medio: 'Médio',
  argiloso: 'Argiloso',
};

const drainageLabel: Record<string, string> = {
  bom: 'Boa',
  medio: 'Média',
  ruim: 'Ruim',
};

export function FieldOverviewPage() {
  const { farmId, fieldId } = useParams();
  const { token } = useAuth();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [field, setField] = useState<Field | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

      const cachedFarm = farmService.getCachedById(token, farmIdValue);
      const cachedField = fieldService.getCachedById(token, farmIdValue, fieldIdValue);

      if (cachedFarm && isMounted) {
        setFarm(cachedFarm.farm);
      }

      if (cachedField && isMounted) {
        setField(cachedField.field);
      }

      if (cachedFarm && cachedField) {
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
      }

      try {
        const [farmResponse, fieldResponse] = await Promise.all([
          farmService.getById(token, farmIdValue),
          fieldService.getById(token, farmIdValue, fieldIdValue),
        ]);

        if (isMounted) {
          setFarm(farmResponse.farm);
          setField(fieldResponse.field);
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

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [token, farmIdValue, fieldIdValue]);

  const hasGeometry = Boolean(field?.geometry);

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Talhão</p>
            <h1>{field?.name ?? 'Talhão selecionado'}</h1>
            <p className={styles.subtitle}>Resumo e atalhos para previsão, delimitação e planejamento.</p>
          </div>
          <div className={styles.headerActions}>
            <Link to={`/fazendas/${farmIdValue}`} className={styles.outlineButton}>
              <FaArrowLeft />
              Voltar para talhões
            </Link>
          </div>
        </header>

        {feedback && <p className={styles.feedback}>{feedback}</p>}

        {isLoading ? (
          <div className={styles.loadingBlock}>
            <LoadingState label="Carregando talhão..." />
          </div>
        ) : (
          <section className={styles.grid}>
            <div className={styles.card}>
              <h2>Resumo do talhão</h2>
              <div className={styles.metaGrid}>
                <div>
                  <span>Fazenda</span>
                  <strong>{farm?.name ?? 'Não informado'}</strong>
                </div>
                <div>
                  <span>Área</span>
                  <strong>
                    {field?.areaHa !== null && field?.areaHa !== undefined
                      ? `${formatNumber(field.areaHa, 2)} ha`
                      : 'Sem delimitação'}
                  </strong>
                </div>
                <div>
                  <span>Textura do solo</span>
                  <strong>{field?.soilTexture ? soilLabel[field.soilTexture] ?? field.soilTexture : 'Não informado'}</strong>
                </div>
                <div>
                  <span>Drenagem</span>
                  <strong>{field?.drainage ? drainageLabel[field.drainage] ?? field.drainage : 'Não informado'}</strong>
                </div>
                <div>
                  <span>Irrigação</span>
                  <strong>
                    {field?.irrigation === undefined ? 'Não informado' : field.irrigation ? 'Sim' : 'Não'}
                  </strong>
                </div>
                <div>
                  <span>Delimitação</span>
                  <strong>{hasGeometry ? 'Cadastrada' : 'Pendente'}</strong>
                </div>
              </div>
              {!hasGeometry && (
                <p className={styles.warning}>Delimite o talhão para liberar previsão e análise de risco.</p>
              )}
            </div>

            <div className={styles.card}>
              <h2>Ações do talhão</h2>
              <div className={styles.actionList}>
                <Link
                  to={`/fazendas/${farmIdValue}/talhoes/${fieldIdValue}/planejamento`}
                  className={styles.primaryButton}
                >
                  Planejar safra
                </Link>
                <Link
                  to={`/fazendas/${farmIdValue}/talhoes/${fieldIdValue}/previsao`}
                  className={styles.outlineButton}
                >
                  Ver previsão climática
                </Link>
                <Link
                  to={`/fazendas/${farmIdValue}/talhoes/${fieldIdValue}/delimitacao`}
                  className={styles.outlineButton}
                >
                  {hasGeometry ? 'Editar delimitação' : 'Delimitar talhão'}
                </Link>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className={styles.outlineButton}
                  disabled={!field}
                >
                  Editar cadastro
                </button>
              </div>
            </div>
          </section>
        )}
      </section>
      <FieldFormModal
        isOpen={isEditModalOpen}
        farmId={farmIdValue}
        field={field}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={(nextField) => setField(nextField)}
      />
    </main>
  );
}
