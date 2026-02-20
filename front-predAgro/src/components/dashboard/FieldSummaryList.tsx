import { Link } from 'react-router-dom';
import type { DashboardFieldSummary } from '../../types/domain';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import styles from './FieldSummaryList.module.css';

interface FieldSummaryListProps {
  fields: DashboardFieldSummary[];
  isLoading: boolean;
}

export function FieldSummaryList({ fields, isLoading }: FieldSummaryListProps) {
  return (
    <article className={styles.card}>
      <header>
        <h2>Talhões em acompanhamento</h2>
        <p>Resumo dos últimos dados disponíveis por talhão.</p>
      </header>

      <div className={styles.list}>
        {fields.map((field) => (
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
        ))}
      </div>

      {!isLoading && fields.length === 0 && (
        <p className={styles.emptyState}>Nenhum talhão cadastrado até o momento.</p>
      )}
    </article>
  );
}
