import type { DashboardModules } from '../../types/domain';
import styles from './PreparedModules.module.css';

interface PreparedModulesProps {
  modules: DashboardModules;
}

export function PreparedModules({ modules }: PreparedModulesProps) {
  const items = [
    {
      title: 'Gráficos',
      description: modules.charts,
    },
    {
      title: 'Tabelas',
      description: modules.tables,
    },
    {
      title: 'Relatórios',
      description: modules.reports,
    },
  ];

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2>Componentes preparados para evolução</h2>
        <p>Estrutura de interface pronta para próximas etapas da plataforma.</p>
      </header>

      <div className={styles.grid}>
        {items.map((item) => (
          <article key={item.title} className={styles.card}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <span>Pronto para integração</span>
          </article>
        ))}
      </div>
    </section>
  );
}
