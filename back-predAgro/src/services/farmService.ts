import { AppError } from '../utils/AppError';
import { optionalString, requireString } from '../utils/validators';
import * as farmRepository from '../repositories/farmRepository';
import type { Farm } from '../types/domain';

interface FarmPayload {
  name: string;
  city?: string;
  state?: string;
}

export async function listByUserId(userId: string): Promise<Farm[]> {
  return farmRepository.listByUserId(userId);
}

export async function getById(userId: string, farmId: string): Promise<Farm> {
  const farm = await farmRepository.findById(userId, farmId);

  if (!farm) {
    throw new AppError('Fazenda não encontrada.', 404);
  }

  return farm;
}

export async function create(userId: string, payload: FarmPayload): Promise<Farm> {
  const name = requireString(payload.name, 'name', 3);
  const city = optionalString(payload.city);
  const state = optionalString(payload.state);

  const now = new Date().toISOString();

  return farmRepository.create(userId, {
    name,
    city,
    state,
    createdAt: now,
    updatedAt: now,
  });
}

export async function update(userId: string, farmId: string, payload: Partial<FarmPayload>): Promise<Farm> {
  const farm = await getById(userId, farmId);

  const name = payload.name ? requireString(payload.name, 'name', 3) : farm.name;
  const city = payload.city ? optionalString(payload.city) : farm.city;
  const state = payload.state ? optionalString(payload.state) : farm.state;

  return farmRepository.update(userId, farmId, {
    ...farm,
    name,
    city,
    state,
    updatedAt: new Date().toISOString(),
  });
}

export async function remove(userId: string, farmId: string): Promise<void> {
  const farm = await farmRepository.findById(userId, farmId);

  if (!farm) {
    throw new AppError('Fazenda não encontrada.', 404);
  }

  await farmRepository.remove(userId, farmId);
}
