import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { PrivateRoute } from './components/routing/PrivateRoute';
import { HomePage } from './pages/HomePage';

const AuthPage        = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const AccountPage     = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const DashboardPage   = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const FarmDetailsPage = lazy(() => import('./pages/FarmDetailsPage').then(m => ({ default: m.FarmDetailsPage })));
const FarmsPage       = lazy(() => import('./pages/FarmsPage').then(m => ({ default: m.FarmsPage })));
const FieldMapPage    = lazy(() => import('./pages/FieldMapPage').then(m => ({ default: m.FieldMapPage })));
const FieldOverviewPage = lazy(() => import('./pages/FieldOverviewPage').then(m => ({ default: m.FieldOverviewPage })));
const FieldPlanPage   = lazy(() => import('./pages/FieldPlanPage').then(m => ({ default: m.FieldPlanPage })));
const FieldWeatherPage = lazy(() => import('./pages/FieldWeatherPage').then(m => ({ default: m.FieldWeatherPage })));

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/entrar" element={<AuthPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/painel" element={<DashboardPage />} />
            <Route path="/conta" element={<AccountPage />} />
            <Route path="/fazendas" element={<FarmsPage />} />
            <Route path="/fazendas/:farmId" element={<FarmDetailsPage />} />
            <Route path="/fazendas/:farmId/talhoes/:fieldId/delimitacao" element={<FieldMapPage />} />
            <Route path="/fazendas/:farmId/talhoes/:fieldId/planejamento" element={<FieldPlanPage />} />
            <Route path="/fazendas/:farmId/talhoes/:fieldId/previsao" element={<FieldWeatherPage />} />
            <Route path="/fazendas/:farmId/talhoes/:fieldId" element={<FieldOverviewPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
