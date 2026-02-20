import { randomUUID } from 'node:crypto';
import type { AlertItem, AlertSeverity, PredictionSummary } from '../types/domain';
import type { ClimateSnapshot } from '../types/domain';

function createAlert(title: string, description: string, severity: AlertSeverity): AlertItem {
  return {
    id: randomUUID(),
    title,
    description,
    severity,
    createdAt: new Date().toISOString(),
  };
}

export function buildAlerts({
  climateSnapshot,
  predictionSummary,
}: {
  climateSnapshot: ClimateSnapshot;
  predictionSummary: PredictionSummary;
}): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (climateSnapshot.rainMillimeters < 5) {
    alerts.push(
      createAlert(
        'Volume de chuva abaixo do ideal',
        'Considere reforçar o monitoramento de umidade do solo nas próximas 48 horas.',
        'high'
      )
    );
  }

  if (climateSnapshot.windSpeedKmh > 18) {
    alerts.push(
      createAlert(
        'Vento acima da faixa recomendada',
        'Evite aplicação pulverizada nos horários de maior rajada para reduzir perdas.',
        'medium'
      )
    );
  }

  if (predictionSummary.confidence < 70) {
    alerts.push(
      createAlert(
        'Confiança da previsão em atenção',
        'Acumule mais registros climáticos para melhorar a consistência das próximas estimativas.',
        'medium'
      )
    );
  }

  alerts.push(
    createAlert(
      'Atualização diária recomendada',
      'Mantenha os dados da propriedade e os registros climáticos atualizados para ganhos de precisão.',
      'low'
    )
  );

  return alerts;
}
