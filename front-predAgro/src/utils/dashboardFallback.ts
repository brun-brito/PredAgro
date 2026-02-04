import type { DashboardOverview } from '../types/domain';

export function getFallbackOverview(): DashboardOverview {
  const now = new Date().toISOString();

  return {
    climate: {
      region: 'Triângulo Mineiro',
      temperatureCelsius: 27,
      rainMillimeters: 8,
      humidity: 62,
      windSpeedKmh: 11,
      updatedAt: now,
    },
    prediction: {
      crop: 'Soja',
      expectedYieldBagsPerHectare: 62.5,
      confidence: 79,
      nextHarvestWindow: '14 a 26 de março',
    },
    alerts: [
      {
        id: 'fallback-1',
        title: 'Risco moderado de estresse hídrico',
        description: 'Há previsão de dois dias consecutivos com alta temperatura e pouca chuva.',
        severity: 'medium',
        createdAt: now,
      },
      {
        id: 'fallback-2',
        title: 'Monitorar aplicação foliar',
        description: 'Volume de vento acima da média no período da tarde para sua região.',
        severity: 'low',
        createdAt: now,
      },
    ],
    modules: {
      charts: 'Estrutura pronta para histórico de chuva e temperatura.',
      tables: 'Tabela preparada para consolidar talhões e produtividade.',
      reports: 'Modelo pronto para gerar relatórios executivos e técnicos.',
    },
  };
}
