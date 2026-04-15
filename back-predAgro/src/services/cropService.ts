import { cropCatalog } from '../modules/crops/catalog/crops';
import type { CropProfile } from '../types/domain';

const ACTIVE_CROP_IDS = new Set(['milho']);

export function listCrops(): CropProfile[] {
  return cropCatalog.filter((crop) => ACTIVE_CROP_IDS.has(crop.id));
}

export function isActiveCropId(cropId: string): boolean {
  return ACTIVE_CROP_IDS.has(cropId);
}

export function getCropById(cropId: string): CropProfile | null {
  return cropCatalog.find((crop) => crop.id === cropId) ?? null;
}
