import { Link } from 'react-router-dom';
import { FaCloudSunRain, FaDatabase, FaSeedling } from 'react-icons/fa6';
import { PublicHeader } from '../components/layout/PublicHeader';
import styles from './HomePage.module.css';

const highlights = [
  {
    title: 'Clima monitorado em tempo real',
    description:
      'Concentre dados de chuva, temperatura, umidade e vento em um painel único para orientar o manejo diário.',
    icon: FaCloudSunRain,
  },
  {
    title: 'Base de dados agrometeorológica',
    description:
      'Organize históricos climáticos e indicadores da propriedade para apoiar análises futuras de produtividade.',
    icon: FaDatabase,
  },
  {
    title: 'Predição de safras orientada a IA',
    description:
      'A estrutura da plataforma prepara seu negócio para previsões de rendimento mais consistentes a cada ciclo.',
    icon: FaSeedling,
  },
];

const flowSteps = [
  'Cadastre sua propriedade e culturas prioritárias.',
  'Acompanhe os indicadores climáticos e os alertas operacionais.',
  'Use as previsões para ajustar o planejamento da safra.',
];

export function HomePage() {
  return (
    <div className={styles.page}>
      <PublicHeader />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Planejamento agrícola com foco em decisão</p>
            <h1 className={styles.title}>PredAgro: dados climáticos e previsão para pequenas e médias propriedades</h1>
            <p className={styles.description}>
              Plataforma web para apoiar agricultores no planejamento de safra com informações objetivas,
              histórico de dados e evolução gradual para modelos de inteligência artificial.
            </p>
            <div className={styles.actions}>
              <Link to="/entrar" className={styles.primaryAction}>
                Acessar plataforma
              </Link>
              <a href="#funcionalidades" className={styles.secondaryAction}>
                Ver funcionalidades
              </a>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <h2>Visão inicial do painel</h2>
            <ul>
              <li>Resumo climático por região</li>
              <li>Previsões de rendimento por cultura</li>
              <li>Alertas operacionais para o dia a dia</li>
            </ul>
          </aside>
        </section>

        <section id="funcionalidades" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Funcionalidades iniciais</h2>
            <p>Primeira entrega focada em clareza de dados e base técnica para evolução.</p>
          </div>

          <div className={styles.cardGrid}>
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className={styles.card}>
                  <span className={styles.cardIcon}>
                    <Icon />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Fluxo de uso</h2>
            <p>Experiência simples para diferentes níveis de familiaridade digital.</p>
          </div>

          <ol className={styles.flowList}>
            {flowSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
