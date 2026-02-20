import type { DashboardTotals } from '../../types/domain';
import { formatNumber } from '../../utils/formatters';
import styles from './TotalsOverview.module.css';

interface TotalsOverviewProps {
  totals: DashboardTotals;
  isLoading: boolean;
}

export function TotalsOverview({ totals, isLoading }: TotalsOverviewProps) {
  const items = [
    {
      label: 'Fazendas cadastradas',
      value: totals.farms,
    },
    {
      label: 'Talhões monitorados',
      value: totals.fields,
    },
    {
      label: 'Área total',
      value: `${formatNumber(totals.areaHa, 1)} ha`,
    },
  ];

  return (
    <article className={styles.card}>
      <header>
        <h2>Resumo geral</h2>
        <p>Visão rápida da área acompanhada.</p>
      </header>

      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.label} className={styles.item}>
            <span>{item.label}</span>
            <strong>{isLoading ? 'Carregando...' : item.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
