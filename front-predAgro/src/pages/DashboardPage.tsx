import { useEffect, useState } from 'react';
import { FaArrowRotateRight, FaMapLocationDot, FaRightFromBracket } from 'react-icons/fa6';
import { Link, useNavigate } from 'react-router-dom';
import { FieldSummaryList } from '../components/dashboard/FieldSummaryList';
import { ImportantAlerts } from '../components/dashboard/ImportantAlerts';
import { PreparedModules } from '../components/dashboard/PreparedModules';
import { TotalsOverview } from '../components/dashboard/TotalsOverview';
import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { dashboardService } from '../services/dashboardService';
import type { DashboardOverview } from '../types/domain';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const { token, user, signOut } = useAuth();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiError, setHasApiError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setHasApiError(false);

      try {
        const response = await dashboardService.getOverview(token);

        if (isMounted) {
          setOverview(response);
        }
      } catch {
        if (isMounted) {
          setHasApiError(true);
          setOverview(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      isMounted = false;
    };
  }, [token, refreshKey]);

  function handleSignOut() {
    signOut();
    navigate('/entrar', { replace: true });
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Painel principal</p>
            <h1>Bem-vindo, {user?.name ?? 'Produtor'}</h1>
            <p className={styles.subtitle}>Acompanhe fazendas, talhões e alertas climáticos.</p>
          </div>

          <div className={styles.headerActions}>
            <Link to="/fazendas" className={styles.outlineButton}>
              <FaMapLocationDot />
              Fazendas
            </Link>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className={styles.outlineButton}>
              <FaArrowRotateRight />
              Atualizar
            </button>
            <button type="button" onClick={handleSignOut} className={styles.outlineButton}>
              <FaRightFromBracket />
              Sair
            </button>
          </div>
        </header>

        {hasApiError && (
          <p className={styles.warningBanner}>Não foi possível carregar dados da API neste momento.</p>
        )}

        {isLoading && (
          <div className={styles.loadingBlock}>
            <LoadingState label="Carregando dados do painel..." />
          </div>
        )}

        {!isLoading && overview && (
          <section className={styles.grid}>
            <TotalsOverview totals={overview.totals} isLoading={isLoading} />
            <ImportantAlerts alerts={overview.alerts} isLoading={isLoading} />
            <FieldSummaryList fields={overview.fields} isLoading={isLoading} />
          </section>
        )}

        {!isLoading && !overview && !hasApiError && (
          <p className={styles.emptyState}>Nenhum dado disponível para exibir no painel.</p>
        )}

        <PreparedModules />
      </section>
    </main>
  );
}
