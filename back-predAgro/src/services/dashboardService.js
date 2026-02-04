const agriculturalProfileService = require('./agriculturalProfileService');
const climateService = require('./climateService');
const agrometService = require('./agrometService');
const predictionService = require('./predictionService');
const alertService = require('./alertService');

function mapClimateForDashboard(snapshot) {
  return {
    region: snapshot.region,
    temperatureCelsius: snapshot.temperatureCelsius,
    rainMillimeters: snapshot.rainMillimeters,
    humidity: snapshot.humidity,
    windSpeedKmh: snapshot.windSpeedKmh,
    updatedAt: snapshot.collectedAt,
  };
}

async function getOverview(userId) {
  const profile = await agriculturalProfileService.getByUserId(userId);

  const latestClimateRecord = await climateService.findLatestByUserId(userId);
  const climateSnapshot = latestClimateRecord
    ? latestClimateRecord
    : agrometService.getLatestSnapshot(profile?.state ?? 'Triângulo Mineiro');

  const predictionSummary = predictionService.buildSummary(profile, climateSnapshot);
  const alerts = alertService.buildAlerts({
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

module.exports = {
  getOverview,
};
