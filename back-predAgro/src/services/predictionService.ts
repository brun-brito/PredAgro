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
    pushReason(reasons, 'Pouca chuva e temperatura elevada no curto prazo do milho.');
    pushRecommendation(recommendations, 'Priorize irrigação suplementar e monitore a umidade do solo do milho.');
  }

  if (totalPrecip < 10 && riskLevel !== 'HIGH') {
    riskLevel = 'MEDIUM';
    pushReason(reasons, 'Volume de chuva abaixo do ideal para a janela atual do milho.');
    pushRecommendation(recommendations, 'Revise o manejo hídrico e reavalie as operações previstas para o talhão.');
  }

  if (totalPrecip > 60) {
    riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
    pushReason(reasons, 'Acúmulo de chuva elevado no período, com risco de encharcamento para o milho.');
    pushRecommendation(recommendations, 'Avalie drenagem, compactação e evite tráfego intenso nas áreas úmidas.');
  }

  if (tempVariation >= 12 && riskLevel === 'LOW') {
    riskLevel = 'MEDIUM';
    pushReason(reasons, 'Variação térmica acentuada para os próximos dias do milho.');
    pushRecommendation(recommendations, 'Redobre a atenção ao estresse térmico e à evolução fenológica do milho.');
  }

  if (reasons.length === 0) {
    pushReason(reasons, 'Condições climáticas dentro da faixa operacional esperada para o milho.');
    pushRecommendation(recommendations, 'Mantenha o acompanhamento diário da chuva, temperatura e umidade do solo.');
  }

  return {
    riskLevel,
    reasons,
    recommendations,
  };
}
