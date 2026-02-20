import area from '@turf/area';
import centroid from '@turf/centroid';
import { AppError } from '../utils/AppError';
import { requireString } from '../utils/validators';
import * as farmRepository from '../repositories/farmRepository';
import * as fieldRepository from '../repositories/fieldRepository';
import * as weatherRepository from '../repositories/weatherRepository';
import type { Field, FieldGeometry } from '../types/domain';

interface FieldPayload {
  name: string;
  geometry: FieldGeometry;
}

function ensureGeometry(geometry: unknown): FieldGeometry {
  if (!geometry || typeof geometry !== 'object') {
    throw new AppError('Geometry inválida.', 400);
  }

  const { type, coordinates } = geometry as FieldGeometry;

  if (type !== 'Polygon' && type !== 'MultiPolygon') {
    throw new AppError('Geometry deve ser Polygon ou MultiPolygon.', 400);
  }

  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    throw new AppError('Geometry sem coordenadas válidas.', 400);
  }

  return { type, coordinates };
}

function computeMetrics(geometry: FieldGeometry) {
  const areaSquareMeters = area(geometry as never);
  const areaHa = Number((areaSquareMeters / 10000).toFixed(4));

  const centroidFeature = centroid(geometry as never);
  const [lon, lat] = centroidFeature.geometry.coordinates;

  return {
    areaHa,
    centroidLat: Number(lat.toFixed(6)),
    centroidLon: Number(lon.toFixed(6)),
  };
}

export async function listByFarm(userId: string, farmId: string): Promise<Field[]> {
  await farmRepository.findById(userId, farmId);
  return fieldRepository.listByFarmId(userId, farmId);
}

export async function listByUser(userId: string): Promise<Field[]> {
  const farms = await farmRepository.listByUserId(userId);

  if (farms.length === 0) {
    return [];
  }

  const fieldsByFarm = await Promise.all(
    farms.map((farm) => fieldRepository.listByFarmId(userId, farm.id))
  );

  return fieldsByFarm.flat();
}

export async function getById(userId: string, farmId: string, fieldId: string): Promise<Field> {
  const field = await fieldRepository.findById(userId, farmId, fieldId);

  if (!field) {
    throw new AppError('Talhão não encontrado.', 404);
  }

  return field;
}

export async function create(userId: string, farmId: string, payload: FieldPayload): Promise<Field> {
  const farm = await farmRepository.findById(userId, farmId);

  if (!farm) {
    throw new AppError('Fazenda não encontrada.', 404);
  }

  const name = requireString(payload.name, 'name', 3);
  const geometry = ensureGeometry(payload.geometry);
  const metrics = computeMetrics(geometry);
  const now = new Date().toISOString();

  return fieldRepository.create(userId, farmId, {
    userId,
    farmId,
    name,
    geometry,
    areaHa: metrics.areaHa,
    centroidLat: metrics.centroidLat,
    centroidLon: metrics.centroidLon,
    createdAt: now,
    updatedAt: now,
  });
}

export async function update(
  userId: string,
  farmId: string,
  fieldId: string,
  payload: Partial<FieldPayload>
): Promise<Field> {
  const field = await getById(userId, farmId, fieldId);

  const name = payload.name ? requireString(payload.name, 'name', 3) : field.name;
  const geometry = payload.geometry ? ensureGeometry(payload.geometry) : field.geometry;
  const metrics = payload.geometry ? computeMetrics(geometry) : null;

  const nextField: Field = {
    ...field,
    name,
    geometry,
    areaHa: metrics ? metrics.areaHa : field.areaHa,
    centroidLat: metrics ? metrics.centroidLat : field.centroidLat,
    centroidLon: metrics ? metrics.centroidLon : field.centroidLon,
    updatedAt: new Date().toISOString(),
  };

  await fieldRepository.update(userId, field.farmId, field.id, nextField);
  return nextField;
}

export async function remove(userId: string, farmId: string, fieldId: string): Promise<void> {
  const field = await getById(userId, farmId, fieldId);

  await weatherRepository.removeSnapshots(userId, field.farmId, field.id);
  await fieldRepository.remove(userId, field.farmId, field.id);
}
