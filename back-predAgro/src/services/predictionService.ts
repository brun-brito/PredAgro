import type { AgriculturalProfile, ClimateSnapshot, PredictionSummary } from '../types/domain';

function getHarvestWindow(daysFromNowStart: number, daysFromNowEnd: number) {
  const startDate = new Date();
  const endDate = new Date();

  startDate.setDate(startDate.getDate() + daysFromNowStart);
  endDate.setDate(endDate.getDate() + daysFromNowEnd);

  const startDay = startDate.toLocaleDateString('pt-BR', { day: '2-digit' });
  const endDay = endDate.toLocaleDateString('pt-BR', { day: '2-digit' });
  const month = endDate.toLocaleDateString('pt-BR', { month: 'long' });

  return `${startDay} a ${endDay} de ${month}`;
}

export function buildSummary(
  profile: AgriculturalProfile | null,
  climateSnapshot: ClimateSnapshot
): PredictionSummary {
  const crop = profile?.cropTypes?.[0] ?? 'Soja';

  let expectedYieldBagsPerHectare = 64;

  if (climateSnapshot.temperatureCelsius > 32) {
    expectedYieldBagsPerHectare -= 4;
  }

  if (climateSnapshot.rainMillimeters < 5) {
    expectedYieldBagsPerHectare -= 3;
  }

  if (climateSnapshot.humidity < 55) {
    expectedYieldBagsPerHectare -= 2;
  }

  const areaFactor = profile?.areaHectares && profile.areaHectares > 100 ? 1.2 : 0.4;
  const confidence = Math.max(
    58,
    Math.min(93, 76 + areaFactor + (climateSnapshot.rainMillimeters >= 5 ? 4 : -3))
  );

  return {
    crop,
    expectedYieldBagsPerHectare: Number(expectedYieldBagsPerHectare.toFixed(1)),
    confidence: Number(confidence.toFixed(0)),
    nextHarvestWindow: getHarvestWindow(38, 54),
  };
}
