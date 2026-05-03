import * as farmRepository from '../repositories/farmRepository';
import * as fieldRepository from '../repositories/fieldRepository';
import * as weatherRepository from '../repositories/weatherRepository';
import { createAlert } from './alertService';
import { evaluateRisk } from './predictionService';
import type { AlertItem, DashboardFieldSummary, DashboardOverview } from '../types/domain';
import { logger } from '../utils/logger';

function isFirestorePreconditionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = (error as unknown as { code?: unknown }).code;
  return code === 9 || error.message.includes('FAILED_PRECONDITION');
}

function buildOverview(
  farms: Awaited<ReturnType<typeof farmRepository.listByUserId>>,
  fields: Awaited<ReturnType<typeof fieldRepository.listByUserId>>,
  latestSnapshotsByFieldId: Map<string, Awaited<ReturnType<typeof weatherRepository.findLatestSnapshot>>>
): DashboardOverview {
  const farmMap = new Map(farms.map((farm) => [farm.id, farm.name]));

  const totals = {
    farms: farms.length,
    fields: fields.length,
    areaHa: Number(fields.reduce((sum, field) => sum + (field.areaHa ?? 0), 0).toFixed(2)),
  };

  const alerts: AlertItem[] = [];
  const fieldSummaries: DashboardFieldSummary[] = fields.map((field) => {
    const latestSnapshot = latestSnapshotsByFieldId.get(field.id) ?? null;

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

    return {
      fieldId: field.id,
      fieldName: field.name,
      farmId: field.farmId,
      farmName: farmMap.get(field.farmId),
      areaHa: field.areaHa ?? 0,
      lastSnapshotAt: latestSnapshot?.fetchedAt,
    };
  });

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

export async function getOverview(userId: string): Promise<DashboardOverview> {
  try {
    const [farms, fields, latestSnapshotsByFieldId] = await Promise.all([
      farmRepository.listByUserId(userId),
      fieldRepository.listByUserId(userId),
      weatherRepository.listLatestSnapshotsByUserId(userId),
    ]);

    return buildOverview(farms, fields, latestSnapshotsByFieldId);
  } catch (error) {
    if (!isFirestorePreconditionError(error)) {
      throw error;
    }

    logger.warn('Dashboard fallback ativado por falta de indice no Firestore.');

    const farms = await farmRepository.listByUserId(userId);
    const fieldsByFarm = await Promise.all(
      farms.map((farm) => fieldRepository.listByFarmId(userId, farm.id))
    );
    const fields = fieldsByFarm.flat();
    const latestSnapshots = await Promise.all(
      fields.map(async (field) => ({
        fieldId: field.id,
        snapshot: await weatherRepository.findLatestSnapshot(userId, field.farmId, field.id),
      }))
    );

    const latestSnapshotsByFieldId = new Map(
      latestSnapshots.map(({ fieldId, snapshot }) => [fieldId, snapshot])
    );

    return buildOverview(farms, fields, latestSnapshotsByFieldId);
  }
}
