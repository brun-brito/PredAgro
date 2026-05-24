import type { CropProfile } from '../../../types/domain';

export const cropCatalog: CropProfile[] = [
  {
    id: 'milho',
    name: 'Milho 1ª safra',
    description: 'Análise agroclimática baseada no ZARC da 1ª safra.',
    cycleDays: 120,
    cycleModel: {
      method: 'thermal-time',
      baseTempC: 10,
      referenceTempC: 22.5,
      minCycleDays: 105,
      maxCycleDays: 150,
    },
    stages: [
      {
        id: 'fase_1',
        name: 'Germinação e emergência',
        durationShare: 0.125,
        weight: 1,
        thresholds: {
          tempAvgMinIdeal: 15,
          tempAvgMinCritical: 10,
          tempMinIdeal: 10,
          tempMinCritical: 2,
          precipMinPerDay: 4.17,
        },
      },
      {
        id: 'fase_2',
        name: 'Crescimento e desenvolvimento',
        durationShare: 0.375,
        weight: 0.85,
        thresholds: {
          tempAvgMinIdeal: 15,
          tempAvgMinCritical: 10,
          tempMinIdeal: 10,
          tempMinCritical: 2,
        },
      },
      {
        id: 'fase_3',
        name: 'Florescimento e enchimento de grãos',
        durationShare: 0.3333,
        weight: 1.5,
        thresholds: {
          tempAvgMinIdeal: 15,
          tempAvgMaxIdeal: 30,
          tempAvgMinCritical: 10,
          tempAvgMaxCritical: 34,
          tempMinIdeal: 10,
          tempMaxCritical: 34,
          tempMinCritical: 2,
          precipMinPerDay: 4.17,
        },
      },
      {
        id: 'fase_4',
        name: 'Maturação',
        durationShare: 0.1667,
        weight: 0.75,
        thresholds: {
          tempAvgMinIdeal: 15,
          tempAvgMinCritical: 10,
          tempMinIdeal: 10,
          tempMinCritical: 2,
          rainyDaysMax: 5,
        },
      },
    ],
    yieldModel: {
      baselineYield: 6.06,
      minYield: 5.5,
      maxYield: 6.61,
      sensitivity: 0.35,
      riskWeights: {
        water_stress: 0.5,
        heat_stress: 0.25,
        cold_stress: 0.15,
        water_excess: 0.1,
      },
    },
  },
];
