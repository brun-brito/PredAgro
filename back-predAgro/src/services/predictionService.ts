import type { PredictionRisk, RiskLevel, WeatherDay } from '../types/domain';

function pushReason(reasons: string[], text: string) {
  if (!reasons.includes(text)) {
    reasons.push(text);
  }
}

function pushRecommendation(recommendations: string[], text: string) {
  if (!recommendations.includes(text)) {
    recommendations.push(text);
  }
}

export function evaluateRisk(days: WeatherDay[]): Omit<PredictionRisk, 'fieldId' | 'generatedAt'> {
  const nextDays = days.slice(0, 5);

  const totalPrecip = nextDays.reduce((sum, day) => sum + day.precipitationSum, 0);
  const maxTemp = Math.max(...nextDays.map((day) => day.temperatureMax));
  const minTemp = Math.min(...nextDays.map((day) => day.temperatureMin));
  const tempVariation = maxTemp - minTemp;

  let riskLevel: RiskLevel = 'LOW';
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (totalPrecip < 5 && maxTemp >= 32) {
    riskLevel = 'HIGH';
    pushReason(reasons, 'Pouca chuva e temperatura elevada nos próximos dias.');
    pushRecommendation(recommendations, 'Priorize irrigação e monitoramento de umidade do solo.');
  }

  if (totalPrecip < 10 && riskLevel !== 'HIGH') {
    riskLevel = 'MEDIUM';
    pushReason(reasons, 'Volume de chuva abaixo do ideal no curto prazo.');
    pushRecommendation(recommendations, 'Considere ajustar manejo hídrico e revisar calendário de aplicação.');
  }

  if (totalPrecip > 60) {
    riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
    pushReason(reasons, 'Acúmulo de chuva alto no período, risco de encharcamento.');
    pushRecommendation(recommendations, 'Avalie drenagem e evite tráfego intenso nas áreas úmidas.');
  }

  if (tempVariation >= 12 && riskLevel === 'LOW') {
    riskLevel = 'MEDIUM';
    pushReason(reasons, 'Variação térmica acentuada nos próximos dias.');
    pushRecommendation(recommendations, 'Redobre atenção ao manejo de estresse térmico.');
  }

  if (reasons.length === 0) {
    pushReason(reasons, 'Condições climáticas dentro da faixa esperada.');
    pushRecommendation(recommendations, 'Mantenha o acompanhamento diário dos indicadores.');
  }

  return {
    riskLevel,
    reasons,
    recommendations,
  };
}
