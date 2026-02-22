import { cropCatalog } from '../modules/crops/catalog/crops';
import type { CropProfile } from '../types/domain';

export function listCrops(): CropProfile[] {
  return cropCatalog;
}

export function getCropById(cropId: string): CropProfile | null {
  return cropCatalog.find((crop) => crop.id === cropId) ?? null;
}
