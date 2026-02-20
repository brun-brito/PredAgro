import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingState } from '../ui/LoadingState';
import styles from './PrivateRoute.module.css';

export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <LoadingState label="Verificando acesso..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace />;
  }

  return <Outlet />;
}
