import styles from './PreparedModules.module.css';

export function PreparedModules() {
  const items = [
    {
      title: 'Gráficos',
      description: 'Estrutura pronta para histórico de chuva e temperatura por período.',
    },
    {
      title: 'Tabelas',
      description: 'Tabela preparada para consolidar talhões e indicadores da safra.',
    },
    {
      title: 'Relatórios',
      description: 'Modelo pronto para gerar relatórios executivos e técnicos.',
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
