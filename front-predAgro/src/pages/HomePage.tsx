import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCloudSunRain, FaDatabase, FaSeedling } from 'react-icons/fa6';
import { Modal } from '../components/ui/Modal';
import styles from './HomePage.module.css';

interface ShowcaseItem {
  label: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

const highlights = [
  {
    title: 'Monitoramento climático',
    description:
      'Reúna chuva, temperatura e vento em um painel objetivo para revisar a janela operacional de cada área monitorada.',
    icon: FaCloudSunRain,
  },
  {
    title: 'Base territorial e histórico climático',
    description:
      'Cadastre fazendas, delimite talhões e preserve o histórico climático necessário para comparar períodos de plantio.',
    icon: FaDatabase,
  },
  {
    title: 'Análise da safra atual',
    description:
      'A análise combina previsão, tendência histórica e produtividade estimada para apoiar o planejamento do milho.',
    icon: FaSeedling,
  },
];

const flowSteps = [
  'Cadastre propriedades e talhões;',
  'Delimite a área real de cada talhão e acompanhe clima, alertas e atualizações;',
  'Monte o plano do ciclo para revisar risco, período e produtividade estimada.',
];

const dashboardSignals = [
  'Resumo geral das áreas acompanhadas',
  'Atalhos para clima, talhões e planejamento do milho',
  'Alertas operacionais e próximos passos',
];

const panelHighlights = [
  {
    title: 'Resumo operacional imediato',
    description:
      'Logo na entrada, o produtor visualiza fazendas cadastradas, talhões monitorados e a área total já acompanhada.',
  },
  {
    title: 'Talhões em destaque',
    description:
      'Os maiores talhões em acompanhamento aparecem primeiro, com acesso rápido para abrir o restante quando necessário.',
  },
  {
    title: 'Fluxo contínuo de trabalho',
    description:
      'O painel conecta cadastro, delimitação, clima e planejamento sem exigir navegação complexa.',
  },
  {
    title: 'Leitura objetiva para agir',
    description:
      'A navegação foi pensada para mostrar o que precisa ser visto antes: status, alertas, área útil e ações principais.',
  },
];

const dashboardPreview: ShowcaseItem = {
  label: 'Painel',
  title: 'Visão geral do painel principal',
  description:
    'Entrada rápida para acompanhar fazendas, talhões monitorados, área total e atalhos para as ações mais usadas.',
  image: '/assets/images/1-home.png',
  alt: 'Visão geral do painel principal da plataforma PredAgro.',
};

const showcases: ShowcaseItem[] = [
  {
    label: 'Cadastro',
    title: 'Base de fazendas organizada desde o início',
    description:
      'A estrutura começa pelo cadastro das propriedades, deixando a operação preparada para centralizar localização, base do mapa e evolução do acompanhamento.',
    image: '/assets/images/2-fazendas.png',
    alt: 'Tela de fazendas cadastradas na plataforma PredAgro.',
  },
  {
    label: 'Mapa',
    title: 'Delimitação visual do talhão com revisão rápida',
    description:
      'A tela do talhão ajuda a conferir o contorno salvo, validar a área desenhada e entender rapidamente se a geometria cadastrada está correta.',
    image: '/assets/images/5-area-talhao.png',
    alt: 'Tela de delimitação do talhão com polígono desenhado sobre o mapa.',
  },
  {
    label: 'Análise',
    title: 'Planejamento com leitura direta de risco e produtividade',
    description:
      'As análises mostram nível de risco, fatores de impacto e estimativas de produtividade para cada plano cadastrado.',
    image: '/assets/images/6-previsao.png',
    alt: 'Tela de planejamento com risco climático e produtividade estimada.',
  },
];

export function HomePage() {
  const [selectedPreview, setSelectedPreview] = useState<ShowcaseItem | null>(null);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>PredAgro: monitoramento e planejamento do milho 1ª safra</h1>
            <p className={styles.description}>
              Sistema criado para organizar fazendas, delimitar talhões e analisar clima, janela de plantio
              e produtividade estimada do milho 1ª safra.
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

          <div className={styles.heroVisual}>
            <button
              type="button"
              className={`${styles.previewButton} ${styles.previewFrame}`}
              onClick={() => setSelectedPreview(dashboardPreview)}
              aria-label="Ampliar print do painel principal"
            >
              <div className={styles.previewHeader}>
                <span>Painel principal</span>
                <span>Clique para ampliar</span>
              </div>
              <img
                src={dashboardPreview.image}
                alt={dashboardPreview.alt}
                className={styles.previewImage}
              />
            </button>

            <aside className={styles.heroPanel}>
              <p className={styles.panelEyebrow}>Visão inicial do painel</p>
              <h2>O que aparece logo ao entrar na plataforma</h2>

              <div className={styles.panelSignals}>
                {dashboardSignals.map((signal) => (
                  <span key={signal} className={styles.panelSignal}>
                    {signal}
                  </span>
                ))}
              </div>

              <ul className={styles.panelList}>
                {panelHighlights.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Veja a plataforma em uso</h2>
            <p>Algumas telas centrais do fluxo já disponível para o produtor no uso diário.</p>
          </div>

          <div className={styles.showcaseGrid}>
            {showcases.map((showcase) => (
              <article key={showcase.title} className={styles.showcaseCard}>
                <div className={styles.showcaseCopy}>
                  <span className={styles.showcaseLabel}>{showcase.label}</span>
                  <h3>{showcase.title}</h3>
                  <p>{showcase.description}</p>
                </div>

                <button
                  type="button"
                  className={styles.showcaseFrame}
                  onClick={() => setSelectedPreview(showcase)}
                  aria-label={`Ampliar print: ${showcase.title}`}
                >
                  <img
                    src={showcase.image}
                    alt={showcase.alt}
                    className={styles.showcaseImage}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.showcaseHint}>Clique para ver em tela cheia</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="funcionalidades" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Funcionalidades</h2>
            <p>Fluxos organizados para cadastro, monitoramento climático e planejamento do milho.</p>
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
            <p>Sequência direta para estruturar o talhão e revisar a janela de plantio.</p>
          </div>

          <ol className={styles.flowList}>
            {flowSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </main>

      <Modal
        isOpen={selectedPreview !== null}
        onClose={() => setSelectedPreview(null)}
        title={selectedPreview?.title}
        size="xl"
      >
        {selectedPreview && (
          <figure className={styles.lightboxFigure}>
            <img
              src={selectedPreview.image}
              alt={selectedPreview.alt}
              className={styles.lightboxImage}
            />
            <figcaption className={styles.lightboxCaption}>
              <span className={styles.lightboxLabel}>{selectedPreview.label}</span>
              <p>{selectedPreview.description}</p>
            </figcaption>
          </figure>
        )}
      </Modal>
    </div>
  );
}
