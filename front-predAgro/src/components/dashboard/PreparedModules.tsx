import { FaArrowRight, FaCloudSunRain, FaMapLocationDot, FaSeedling } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import type { DashboardOverview, DashboardFieldSummary } from '../../types/domain';
import { formatDateTime } from '../../utils/formatters';
import styles from './PreparedModules.module.css';

interface PreparedModulesProps {
  overview: DashboardOverview | null;
  isLoading: boolean;
}

type ActionCard = {
  title: string;
  description: string;
  badge: string;
  ctaLabel: string;
  to: string;
  tone: 'default' | 'attention' | 'success';
  icon: typeof FaMapLocationDot;
};

const STALE_SNAPSHOT_HOURS = 24;

function isStaleSnapshot(lastSnapshotAt?: string) {
  if (!lastSnapshotAt) {
    return false;
  }

  const lastUpdate = new Date(lastSnapshotAt);

  if (Number.isNaN(lastUpdate.getTime())) {
    return false;
  }

  const ageInHours = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
  return ageInHours > STALE_SNAPSHOT_HOURS;
}

function buildClimateAction(fields: DashboardFieldSummary[]): ActionCard {
  const pendingField = fields.find((field) => !field.lastSnapshotAt);

  if (pendingField) {
    const pendingCount = fields.filter((field) => !field.lastSnapshotAt).length;

    return {
      title: 'Cobertura climática pendente',
      description:
        'Há talhões sem previsão disponível. Delimite primeiro os pendentes para liberar a leitura climática.',
      badge: `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`,
      ctaLabel: 'Delimitar primeiro talhão',
      to: `/fazendas/${pendingField.farmId}/talhoes/${pendingField.fieldId}/delimitacao`,
      tone: 'attention',
      icon: FaCloudSunRain,
    };
  }

  const staleField = fields.find((field) => isStaleSnapshot(field.lastSnapshotAt));

  if (staleField) {
    const staleCount = fields.filter((field) => isStaleSnapshot(field.lastSnapshotAt)).length;

    return {
      title: 'Previsões pedem revisão',
      description:
        'Os dados climáticos de parte da operação já estão envelhecendo. Revise os talhões com atualização mais antiga.',
      badge: `${staleCount} em revisão`,
      ctaLabel: 'Abrir previsão prioritária',
      to: `/fazendas/${staleField.farmId}/talhoes/${staleField.fieldId}/previsao`,
      tone: 'attention',
      icon: FaCloudSunRain,
    };
  }

  if (fields.length > 0) {
    const firstField = fields[0];

    return {
      title: 'Monitoramento em dia',
      description:
        'Os talhões já têm cobertura climática inicial. Use o painel para acompanhar a janela operacional da semana.',
      badge: 'Cobertura ativa',
      ctaLabel: 'Consultar previsão',
      to: `/fazendas/${firstField.farmId}/talhoes/${firstField.fieldId}/previsao`,
      tone: 'success',
      icon: FaCloudSunRain,
    };
  }

  return {
    title: 'Previsão ainda indisponível',
    description: 'Cadastre talhões para começar a acompanhar previsão, risco climático e atualização operacional.',
    badge: 'Sem talhões',
    ctaLabel: 'Abrir fazendas',
    to: '/fazendas',
    tone: 'default',
    icon: FaCloudSunRain,
  };
}

function buildPlanningAction(overview: DashboardOverview | null): ActionCard {
  const firstField = overview?.fields[0];
  const highAttentionAlerts = overview?.alerts.filter((alert) => alert.severity !== 'low').length ?? 0;

  if (firstField) {
    return {
      title: highAttentionAlerts > 0 ? 'Planeje com alertas ativos' : 'Monte o próximo plano',
      description:
        highAttentionAlerts > 0
          ? 'Há alertas pedindo atenção. Use o planejamento para ajustar datas, janela de plantio e exposição ao risco.'
          : 'Transforme a previsão em decisão operacional com um plano de plantio e avaliação de risco por talhão.',
      badge: highAttentionAlerts > 0 ? `${highAttentionAlerts} alerta${highAttentionAlerts > 1 ? 's' : ''}` : 'Próxima etapa',
      ctaLabel: 'Abrir planejamento',
      to: `/fazendas/${firstField.farmId}/talhoes/${firstField.fieldId}/planejamento`,
      tone: highAttentionAlerts > 0 ? 'attention' : 'success',
      icon: FaSeedling,
    };
  }

  return {
    title: 'Planejamento depende da estrutura básica',
    description: 'Antes de montar cenários de plantio, organize fazendas e talhões com a área produtiva inicial.',
    badge: 'Aguardando base',
    ctaLabel: 'Organizar fazendas',
    to: '/fazendas',
    tone: 'default',
    icon: FaSeedling,
  };
}

function buildActionCards(overview: DashboardOverview | null): ActionCard[] {
  const totals = overview?.totals;
  const fields = overview?.fields ?? [];

  const structureAction: ActionCard =
    totals && totals.farms > 0
      ? {
          title: totals.fields > 0 ? 'Estrutura operacional ativa' : 'Operação sem talhões cadastrados',
          description:
            totals.fields > 0
              ? 'Sua base produtiva já está montada. Agora vale acelerar cobertura climática e planejamento por talhão.'
              : 'Você já cadastrou fazendas, mas ainda precisa abrir os talhões para liberar previsão e análise climática.',
          badge: `${totals.farms} fazenda${totals.farms > 1 ? 's' : ''}`,
          ctaLabel: 'Gerenciar fazendas',
          to: '/fazendas',
          tone: totals.fields > 0 ? 'success' : 'default',
          icon: FaMapLocationDot,
        }
      : {
          title: 'Comece pela estrutura da operação',
          description: 'Cadastre a primeira fazenda para organizar propriedades, delimitar talhões e iniciar o monitoramento.',
          badge: 'Começar agora',
          ctaLabel: 'Cadastrar fazenda',
          to: '/fazendas',
          tone: 'default',
          icon: FaMapLocationDot,
        };

  return [structureAction, buildClimateAction(fields), buildPlanningAction(overview)];
}

export function PreparedModules({ overview, isLoading }: PreparedModulesProps) {
  const items = buildActionCards(overview);

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2>Próximas ações</h2>
        <p>Atalhos objetivos para transformar o painel em rotina operacional.</p>
      </header>

      <div className={styles.grid}>
        {items.map((item) => (
          <article key={item.title} className={`${styles.card} ${styles[item.tone]}`}>
            <div className={styles.cardTop}>
              <span className={styles.iconWrap}>
                <item.icon />
              </span>
              <span className={styles.badge}>{isLoading ? 'Carregando...' : item.badge}</span>
            </div>
            <div className={styles.cardContent}>
              <h3>{item.title}</h3>
              <p>{isLoading ? 'Aguarde enquanto montamos as prioridades operacionais.' : item.description}</p>
            </div>
            <Link to={item.to} className={styles.actionLink}>
              {item.ctaLabel}
              <FaArrowRight />
            </Link>
          </article>
        ))}
      </div>

      {overview && !isLoading && <p className={styles.footerNote}>Atualizado em {formatDateTime(overview.updatedAt)}.</p>}
    </section>
  );
}
