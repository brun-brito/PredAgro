import * as climateRepository from '../repositories/climateRepository';
import { requireNumber, requireString } from '../utils/validators';
import type { ClimateRecord } from '../types/domain';

interface ClimatePayload {
  region: string;
  temperatureCelsius: number;
  rainMillimeters: number;
  humidity: number;
  windSpeedKmh: number;
}

export async function ingestRecord(userId: string, payload: ClimatePayload): Promise<ClimateRecord> {
  const region = requireString(payload.region, 'region', 2);
  const temperatureCelsius = requireNumber(payload.temperatureCelsius, 'temperatureCelsius', -10, 55);
  const rainMillimeters = requireNumber(payload.rainMillimeters, 'rainMillimeters', 0, 600);
  const humidity = requireNumber(payload.humidity, 'humidity', 0, 100);
  const windSpeedKmh = requireNumber(payload.windSpeedKmh, 'windSpeedKmh', 0, 180);

  return climateRepository.create({
    userId,
    region,
    temperatureCelsius,
    rainMillimeters,
    humidity,
    windSpeedKmh,
    collectedAt: new Date().toISOString(),
  });
}

export async function listByUserId(userId: string): Promise<ClimateRecord[]> {
  return climateRepository.findByUserId(userId);
}

export async function findLatestByUserId(userId: string): Promise<ClimateRecord | null> {
  return climateRepository.findLatestByUserId(userId);
}
