import { AppError } from '../utils/AppError';
import * as fieldService from './fieldService';
import * as weatherRepository from '../repositories/weatherRepository';
import type { WeatherDay, WeatherSnapshot } from '../types/domain';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 60 * 60 * 1000;

interface OpenMeteoDailyResponse {
  time: string[];
  temperature_2m_min: number[];
  temperature_2m_max: number[];
  precipitation_sum: number[];
  wind_speed_10m_max?: number[];
  relative_humidity_2m_mean?: number[];
}

interface OpenMeteoResponse {
  daily: OpenMeteoDailyResponse;
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timeout),
  };
}

function mapDailyToDays(daily: OpenMeteoDailyResponse): WeatherDay[] {
  return daily.time.map((date, index) => ({
    date,
    temperatureMin: daily.temperature_2m_min[index],
    temperatureMax: daily.temperature_2m_max[index],
    precipitationSum: daily.precipitation_sum[index],
    windSpeedMax: daily.wind_speed_10m_max?.[index],
    humidityMean: daily.relative_humidity_2m_mean?.[index],
  }));
}

async function fetchForecast(lat: number, lon: number, days: number): Promise<WeatherDay[]> {
  const dailyFields = [
    'temperature_2m_min',
    'temperature_2m_max',
    'precipitation_sum',
    'wind_speed_10m_max',
    'relative_humidity_2m_mean',
  ];

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    daily: dailyFields.join(','),
    forecast_days: days.toString(),
    timezone: 'America/Sao_Paulo',
  });

  const { signal, cancel } = withTimeout(8000);

  try {
    const response = await fetch(`${OPEN_METEO_BASE_URL}?${params.toString()}`, {
      signal,
    });

    if (!response.ok) {
      throw new AppError('Falha ao consultar Open-Meteo.', 502);
    }

    const data = (await response.json()) as OpenMeteoResponse;

    if (!data.daily) {
      throw new AppError('Resposta inválida do Open-Meteo.', 502);
    }

    return mapDailyToDays(data.daily);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Falha ao consultar Open-Meteo.', 502);
  } finally {
    cancel();
  }
}

export async function getForecast(
  userId: string,
  farmId: string,
  fieldId: string,
  options?: { days?: number; force?: boolean }
): Promise<WeatherSnapshot> {
  const field = await fieldService.getById(userId, farmId, fieldId);
  const days = Math.min(Math.max(options?.days ?? 7, 1), 14);

  const latest = await weatherRepository.findLatestSnapshot(userId, field.farmId, field.id);
  const now = Date.now();

  if (!options?.force && latest && new Date(latest.expiresAt).getTime() > now) {
    return latest;
  }

  const forecastDays = await fetchForecast(field.centroidLat, field.centroidLon, days);

  const fetchedAt = new Date().toISOString();
  const expiresAt = new Date(now + CACHE_TTL_MS).toISOString();

  return weatherRepository.createSnapshot(userId, field.farmId, field.id, {
    userId,
    farmId: field.farmId,
    fieldId: field.id,
    source: 'open-meteo',
    fetchedAt,
    expiresAt,
    days: forecastDays,
  });
}

export async function listSnapshots(
  userId: string,
  farmId: string,
  fieldId: string,
  limit = 10
): Promise<WeatherSnapshot[]> {
  const field = await fieldService.getById(userId, farmId, fieldId);
  return weatherRepository.listSnapshots(userId, field.farmId, field.id, limit);
}
