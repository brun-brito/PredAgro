const { randomUUID } = require('node:crypto');

function createAlert(title, description, severity) {
  return {
    id: randomUUID(),
    title,
    description,
    severity,
    createdAt: new Date().toISOString(),
  };
}

function buildAlerts({ climateSnapshot, predictionSummary }) {
  const alerts = [];

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

module.exports = {
  buildAlerts,
};
