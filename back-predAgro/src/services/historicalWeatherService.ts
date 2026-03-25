import { AppError } from '../utils/AppError';
import type { WeatherDay } from '../types/domain';

const ARCHIVE_BASE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const DAY_MS = 24 * 60 * 60 * 1000;
const YEARS_BACK = 10;

interface ArchiveDailyResponse {
  time: string[];
  temperature_2m_min: number[];
  temperature_2m_max: number[];
  precipitation_sum: number[];
  wind_speed_10m_max?: number[];
}

interface ArchiveResponse {
  daily?: ArchiveDailyResponse;
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timeout),
  };
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

async function fetchArchiveRange(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  const dailyFields = [
    'temperature_2m_min',
    'temperature_2m_max',
    'precipitation_sum',
    'wind_speed_10m_max',
  ];

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    start_date: startDate,
    end_date: endDate,
    daily: dailyFields.join(','),
    timezone: 'America/Sao_Paulo',
  });

  const { signal, cancel } = withTimeout(10000);

  try {
    const response = await fetch(`${ARCHIVE_BASE_URL}?${params.toString()}`, { signal });

    if (!response.ok) {
      throw new AppError('Falha ao consultar histórico climático.', 502);
    }

    const data = (await response.json()) as ArchiveResponse;

    if (!data.daily) {
      throw new AppError('Histórico climático indisponível.', 502);
    }

    return data.daily.time.map((date, index) => ({
      date,
      temperatureMin: data.daily!.temperature_2m_min[index],
      temperatureMax: data.daily!.temperature_2m_max[index],
      precipitationSum: data.daily!.precipitation_sum[index],
      windSpeedMax: data.daily!.wind_speed_10m_max?.[index],
    }));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Falha ao consultar histórico climático.', 502);
  } finally {
    cancel();
  }
}

export async function getHistoricalNormals(
  lat: number,
  lon: number,
  planStart: Date,
  totalDays: number
): Promise<WeatherDay[]> {
  if (totalDays <= 0) {
    return [];
  }

  const currentYear = new Date().getUTCFullYear();
  const lastFullYear = currentYear - 1;
  const startYear = lastFullYear - YEARS_BACK + 1;

  const years = Array.from({ length: YEARS_BACK }, (_, index) => startYear + index).filter((year) => {
    const histStart = new Date(Date.UTC(year, planStart.getUTCMonth(), planStart.getUTCDate()));
    const histEnd = addDays(histStart, totalDays - 1);
    return histEnd.getUTCFullYear() <= lastFullYear;
  });

  if (years.length === 0) {
    throw new AppError('Histórico climático insuficiente para o período selecionado.', 400);
  }

  const yearlySeries: WeatherDay[][] = [];

  for (const year of years) {
    const histStart = new Date(Date.UTC(year, planStart.getUTCMonth(), planStart.getUTCDate()));
    const histEnd = addDays(histStart, totalDays - 1);
    const series = await fetchArchiveRange(lat, lon, formatDate(histStart), formatDate(histEnd));

    if (series.length !== totalDays) {
      continue;
    }

    yearlySeries.push(series);
  }

  if (yearlySeries.length === 0) {
    throw new AppError('Histórico climático indisponível para o período selecionado.', 502);
  }

  const normals: WeatherDay[] = Array.from({ length: totalDays }, (_, index) => {
    const tempMinValues = yearlySeries.map((series) => series[index].temperatureMin);
    const tempMaxValues = yearlySeries.map((series) => series[index].temperatureMax);
    const precipValues = yearlySeries.map((series) => series[index].precipitationSum);
    const windValues = yearlySeries
      .map((series) => series[index].windSpeedMax)
      .filter((value): value is number => value !== undefined);
    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

    return {
      date: formatDate(addDays(planStart, index)),
      temperatureMin: average(tempMinValues),
      temperatureMax: average(tempMaxValues),
      precipitationSum: average(precipValues),
      windSpeedMax: windValues.length ? average(windValues) : undefined,
    };
  });

  return normals;
}
