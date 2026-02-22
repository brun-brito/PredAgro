import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { farmService } from '../services/farmService';
import { fieldService } from '../services/fieldService';
import { LoadingState } from '../components/ui/LoadingState';
import { FarmFormModal } from '../components/forms/FarmFormModal';
import { FieldFormModal } from '../components/forms/FieldFormModal';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/httpClient';
import { formatNumber } from '../utils/formatters';
import type { Field, Farm } from '../types/domain';
import styles from './FarmDetailsPage.module.css';

export function FarmDetailsPage() {
  const { farmId } = useParams();
  const { token } = useAuth();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  const farmIdValue = useMemo(() => farmId ?? '', [farmId]);

  useEffect(() => {
    let isMounted = true;

    async function loadFarm() {
      if (!token || !farmIdValue) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const cachedFarm = farmService.getCachedById(token, farmIdValue);
      const cachedFields = fieldService.getCachedListByFarm(token, farmIdValue);

      if (cachedFarm && isMounted) {
        setFarm(cachedFarm.farm);
      }

      if (cachedFields && isMounted) {
        setFields(cachedFields.fields);
      }

      if (cachedFarm && cachedFields) {
        if (isMounted) {
          setFeedback(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      if (!cachedFarm) {
        setFarm(null);
      }
      if (!cachedFields) {
        setFields([]);
      }

      try {
        const [farmResponse, fieldsResponse] = await Promise.all([
          farmService.getById(token, farmIdValue),
          fieldService.listByFarm(token, farmIdValue),
        ]);

        if (isMounted) {
          setFarm(farmResponse.farm);
          setFields(fieldsResponse.fields);
          setFeedback(null);
        }
      } catch (error) {
        if (isMounted) {
          setFeedback(error instanceof ApiError ? error.message : 'Não foi possível carregar os dados da fazenda.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFarm();

    return () => {
      isMounted = false;
    };
  }, [token, farmIdValue]);

  function openFarmModal() {
    if (!farm) {
      return;
    }
    setIsFarmModalOpen(true);
  }

  function openFieldCreateModal() {
    setEditingField(null);
    setIsFieldModalOpen(true);
  }

  function openFieldEditModal(field: Field) {
    setEditingField(field);
    setIsFieldModalOpen(true);
  }

  function handleFarmModalClose() {
    setIsFarmModalOpen(false);
  }

  function handleFieldModalClose() {
    setIsFieldModalOpen(false);
    setEditingField(null);
  }

  function handleFarmSaved(nextFarm: Farm) {
    setFarm(nextFarm);
  }

  function handleFieldSaved(nextField: Field, mode: 'create' | 'update') {
    setFields((current) => {
      if (mode === 'create') {
        return [nextField, ...current];
      }
      return current.map((item) => (item.id === nextField.id ? nextField : item));
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Talhões</p>
            <h1>{farm?.name ?? 'Fazenda selecionada'}</h1>
            <p className={styles.subtitle}>Cadastre e acompanhe os talhões da propriedade.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" onClick={openFieldCreateModal} className={styles.primaryButton}>
              + Cadastrar talhão
            </button>
            <button type="button" onClick={openFarmModal} className={styles.outlineButton} disabled={!farm}>
              Editar fazenda
            </button>
            <Link to="/fazendas" className={styles.outlineButton}>
              <FaArrowLeft />
              Voltar para fazendas
            </Link>
          </div>
        </header>

        {feedback && <p className={styles.feedback}>{feedback}</p>}

        <section className={styles.card}>
          <h2>Talhões cadastrados</h2>
          {isLoading ? (
            <div className={styles.loadingBlock}>
              <LoadingState label="Carregando talhões..." />
            </div>
          ) : (
            <div className={styles.list}>
              {fields.map((field) => (
                <div key={field.id} className={styles.listItem}>
                  <div>
                    <strong>{field.name}</strong>
                    <span>
                      {field.areaHa !== null ? `${formatNumber(field.areaHa, 2)} ha` : 'Sem delimitação'}
                    </span>
                  </div>
                  <div className={styles.listActions}>
                    <Link to={`/fazendas/${farmIdValue}/talhoes/${field.id}`} className={styles.outlineButton}>
                      Abrir
                    </Link>
                    <button type="button" onClick={() => openFieldEditModal(field)} className={styles.outlineButton}>
                      Editar
                    </button>
                    <Link
                      to={`/fazendas/${farmIdValue}/talhoes/${field.id}/delimitacao`}
                      className={styles.outlineButton}
                    >
                      Delimitar
                    </Link>
                    <Link
                      to={`/fazendas/${farmIdValue}/talhoes/${field.id}/planejamento`}
                      className={styles.outlineButton}
                    >
                      Planejar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && fields.length === 0 && <p className={styles.emptyState}>Nenhum talhão cadastrado.</p>}
        </section>
      </section>
      <FarmFormModal
        isOpen={isFarmModalOpen}
        farm={farm}
        onClose={handleFarmModalClose}
        onSaved={handleFarmSaved}
      />
      <FieldFormModal
        isOpen={isFieldModalOpen}
        farmId={farmIdValue}
        field={editingField}
        onClose={handleFieldModalClose}
        onSaved={handleFieldSaved}
      />
    </main>
  );
}
