import { Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './components/routing/PrivateRoute';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { FarmDetailsPage } from './pages/FarmDetailsPage';
import { FarmsPage } from './pages/FarmsPage';
import { FieldMapPage } from './pages/FieldMapPage';
import { FieldOverviewPage } from './pages/FieldOverviewPage';
import { FieldPlanPage } from './pages/FieldPlanPage';
import { FieldWeatherPage } from './pages/FieldWeatherPage';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/entrar" element={<AuthPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/painel" element={<DashboardPage />} />
        <Route path="/fazendas" element={<FarmsPage />} />
        <Route path="/fazendas/:farmId" element={<FarmDetailsPage />} />
        <Route path="/fazendas/:farmId/talhoes/:fieldId/delimitacao" element={<FieldMapPage />} />
        <Route path="/fazendas/:farmId/talhoes/:fieldId/planejamento" element={<FieldPlanPage />} />
        <Route path="/fazendas/:farmId/talhoes/:fieldId/previsao" element={<FieldWeatherPage />} />
        <Route path="/fazendas/:farmId/talhoes/:fieldId" element={<FieldOverviewPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
