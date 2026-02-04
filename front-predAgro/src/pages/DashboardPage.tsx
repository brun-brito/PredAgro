import { useEffect, useState } from 'react';
import { FaArrowRotateRight, FaRightFromBracket } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { ClimateOverview } from '../components/dashboard/ClimateOverview';
import { ForecastSummary } from '../components/dashboard/ForecastSummary';
import { ImportantAlerts } from '../components/dashboard/ImportantAlerts';
import { PreparedModules } from '../components/dashboard/PreparedModules';
import { useAuth } from '../hooks/useAuth';
import { dashboardService } from '../services/dashboardService';
import type { DashboardOverview } from '../types/domain';
import { getFallbackOverview } from '../utils/dashboardFallback';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const { token, user, signOut } = useAuth();

  const [overview, setOverview] = useState<DashboardOverview>(getFallbackOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiError, setHasApiError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      if (!token) {
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
          setOverview(getFallbackOverview());
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
            <p className={styles.subtitle}>Acompanhe indicadores climáticos e previsões da sua safra.</p>
          </div>

          <div className={styles.headerActions}>
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
          <p className={styles.warningBanner}>
            Não foi possível carregar dados da API neste momento. Exibindo informações de referência.
          </p>
        )}

        <section className={styles.grid}>
          <ClimateOverview climate={overview.climate} isLoading={isLoading} />
          <ForecastSummary prediction={overview.prediction} isLoading={isLoading} />
          <ImportantAlerts alerts={overview.alerts} isLoading={isLoading} />
        </section>

        <PreparedModules modules={overview.modules} />
      </section>
    </main>
  );
}
