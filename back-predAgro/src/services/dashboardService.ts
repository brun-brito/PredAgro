import * as farmRepository from '../repositories/farmRepository';
import * as fieldRepository from '../repositories/fieldRepository';
import * as weatherRepository from '../repositories/weatherRepository';
import { createAlert } from './alertService';
import { evaluateRisk } from './predictionService';
import type { AlertItem, DashboardFieldSummary, DashboardOverview } from '../types/domain';

export async function getOverview(userId: string): Promise<DashboardOverview> {
  const farms = await farmRepository.listByUserId(userId);
  const fieldsByFarm = await Promise.all(
    farms.map((farm) => fieldRepository.listByFarmId(userId, farm.id))
  );
  const fields = fieldsByFarm.flat();

  const farmMap = new Map(farms.map((farm) => [farm.id, farm.name]));

  const totals = {
    farms: farms.length,
    fields: fields.length,
    areaHa: Number(fields.reduce((sum, field) => sum + field.areaHa, 0).toFixed(2)),
  };

  const alerts: AlertItem[] = [];
  const fieldSummaries: DashboardFieldSummary[] = [];

  for (const field of fields) {
    const latestSnapshot = await weatherRepository.findLatestSnapshot(userId, field.farmId, field.id);

    fieldSummaries.push({
      fieldId: field.id,
      fieldName: field.name,
      farmId: field.farmId,
      farmName: farmMap.get(field.farmId),
      areaHa: field.areaHa,
      lastSnapshotAt: latestSnapshot?.fetchedAt,
    });

    if (latestSnapshot) {
      const risk = evaluateRisk(latestSnapshot.days);

      if (risk.riskLevel !== 'LOW') {
        alerts.push(
          createAlert(
            `Risco ${risk.riskLevel === 'HIGH' ? 'alto' : 'médio'} em ${field.name}`,
            risk.reasons[0],
            risk.riskLevel === 'HIGH' ? 'high' : 'medium'
          )
        );
      }
    }
  }

  if (alerts.length === 0) {
    alerts.push(
      createAlert(
        'Sem alertas críticos no momento',
        'Condições gerais dentro da faixa esperada para os próximos dias.',
        'low'
      )
    );
  }

  return {
    totals,
    alerts,
    fields: fieldSummaries,
    updatedAt: new Date().toISOString(),
  };
}
