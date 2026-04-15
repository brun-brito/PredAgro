import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DashboardFieldSummary } from '../../types/domain';
import { Modal } from '../ui/Modal';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import styles from './FieldSummaryList.module.css';

interface FieldSummaryListProps {
  fields: DashboardFieldSummary[];
  isLoading: boolean;
}

const MAX_VISIBLE_FIELDS = 2;

function renderFieldLink(field: DashboardFieldSummary) {
  return (
    <Link
      key={field.fieldId}
      to={field.farmId ? `/fazendas/${field.farmId}/talhoes/${field.fieldId}` : '/fazendas'}
      className={styles.item}
    >
      <div>
        <strong>{field.fieldName}</strong>
        <span>{field.farmName ?? 'Fazenda não informada'}</span>
      </div>
      <div className={styles.meta}>
        <span>{formatNumber(field.areaHa, 1)} ha</span>
        <span>{field.lastSnapshotAt ? formatDateTime(field.lastSnapshotAt) : 'Sem atualização'}</span>
      </div>
    </Link>
  );
}

export function FieldSummaryList({ fields, isLoading }: FieldSummaryListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const sortedFields = useMemo(
    () => [...fields].sort((left, right) => right.areaHa - left.areaHa),
    [fields]
  );
  const visibleFields = useMemo(
    () => sortedFields.slice(0, MAX_VISIBLE_FIELDS),
    [sortedFields]
  );
  const filteredFields = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return sortedFields;
    }

    return sortedFields.filter((field) => {
      const fieldName = field.fieldName.toLowerCase();
      const farmName = (field.farmName ?? '').toLowerCase();

      return fieldName.includes(normalizedQuery) || farmName.includes(normalizedQuery);
    });
  }, [searchQuery, sortedFields]);
  const hiddenCount = Math.max(sortedFields.length - visibleFields.length, 0);

  function handleCloseModal() {
    setIsModalOpen(false);
    setSearchQuery('');
  }

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div>
          <h2>Talhões em acompanhamento</h2>
          <p>Resumo dos últimos dados climáticos disponíveis por talhão.</p>
        </div>
        {hiddenCount > 0 && (
          <button
            type="button"
            className={styles.viewMoreButton}
            onClick={() => setIsModalOpen(true)}
          >
            Ver mais
          </button>
        )}
      </header>

      <div className={styles.list}>
        {visibleFields.map((field) => renderFieldLink(field))}
      </div>

      {!isLoading && fields.length === 0 && (
        <p className={styles.emptyState}>Nenhum talhão cadastrado até o momento.</p>
      )}

      {!isLoading && hiddenCount > 0 && (
        <p className={styles.moreHint}>
          Mostrando os {visibleFields.length} maiores talhões. Existem mais {hiddenCount} áreas em acompanhamento.
        </p>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Todos os talhões em acompanhamento"
        size="lg"
      >
        <div className={styles.modalContent}>
          <p className={styles.modalDescription}>
            Lista completa dos talhões ordenados pela maior área cadastrada.
          </p>
          <label className={styles.searchField}>
            Buscar talhão ou fazenda
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Digite um nome"
            />
          </label>
          <p className={styles.searchSummary}>
            {filteredFields.length === sortedFields.length
              ? `${sortedFields.length} talhões carregados`
              : `${filteredFields.length} de ${sortedFields.length} talhões encontrados`}
          </p>
          <div className={styles.modalList}>
            <div className={styles.list}>
              {filteredFields.map((field) => renderFieldLink(field))}
            </div>
            {filteredFields.length === 0 && (
              <p className={styles.emptyState}>Nenhum talhão corresponde à busca informada.</p>
            )}
          </div>
        </div>
      </Modal>
    </article>
  );
}
