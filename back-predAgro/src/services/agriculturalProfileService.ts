import * as profileRepository from '../repositories/profileRepository';
import { optionalString, requireNumber, requireStringList } from '../utils/validators';
import type { AgriculturalProfile } from '../types/domain';

interface ProfilePayload {
  farmName?: string;
  city?: string;
  state?: string;
  cropTypes?: string[];
  areaHectares?: number;
}

export async function getByUserId(userId: string): Promise<AgriculturalProfile | null> {
  return profileRepository.findByUserId(userId);
}

export async function updateByUserId(
  userId: string,
  payload: ProfilePayload
): Promise<AgriculturalProfile> {
  const farmName = optionalString(payload.farmName) ?? 'Propriedade sem nome';
  const city = optionalString(payload.city) ?? 'Cidade não informada';
  const state = optionalString(payload.state) ?? 'Estado não informado';

  const cropTypes = payload.cropTypes
    ? requireStringList(payload.cropTypes, 'cropTypes')
    : ['Soja'];

  const areaHectares = requireNumber(payload.areaHectares ?? 1, 'areaHectares', 0.1, 10000);

  return profileRepository.upsert(userId, {
    farmName,
    city,
    state,
    cropTypes,
    areaHectares,
  });
}
