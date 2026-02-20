import * as agriculturalProfileService from './agriculturalProfileService';
import * as climateService from './climateService';
import * as agrometService from './agrometService';
import { buildSummary } from './predictionService';
import { buildAlerts } from './alertService';
import type { ClimateSnapshot, DashboardOverview } from '../types/domain';

function mapClimateForDashboard(snapshot: ClimateSnapshot) {
  return {
    region: snapshot.region,
    temperatureCelsius: snapshot.temperatureCelsius,
    rainMillimeters: snapshot.rainMillimeters,
    humidity: snapshot.humidity,
    windSpeedKmh: snapshot.windSpeedKmh,
    updatedAt: snapshot.collectedAt,
  };
}

export async function getOverview(userId: string): Promise<DashboardOverview> {
  const profile = await agriculturalProfileService.getByUserId(userId);

  const latestClimateRecord = await climateService.findLatestByUserId(userId);
  const climateSnapshot = latestClimateRecord
    ? latestClimateRecord
    : agrometService.getLatestSnapshot(profile?.state ?? 'Triângulo Mineiro');

  const predictionSummary = buildSummary(profile, climateSnapshot);
  const alerts = buildAlerts({
    climateSnapshot,
    predictionSummary,
  });

  return {
    climate: mapClimateForDashboard(climateSnapshot),
    prediction: predictionSummary,
    alerts,
    modules: {
      charts: 'Estrutura pronta para histórico de chuva, umidade e temperatura por período.',
      tables: 'Modelo preparado para consolidar talhões, culturas e indicadores técnicos.',
      reports: 'Base pronta para relatórios operacionais e consolidado mensal da safra.',
    },
  };
}
