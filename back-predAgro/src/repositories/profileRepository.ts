import { firebaseFirestore } from '../config/firebaseAdmin';
import type { AgriculturalProfile } from '../types/domain';

function profileDoc(userId: string) {
  return firebaseFirestore.collection('profiles').doc(userId);
}

export async function findByUserId(userId: string): Promise<AgriculturalProfile | null> {
  const snapshot = await profileDoc(userId).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as AgriculturalProfile;
}

export async function upsert(
  userId: string,
  profileInput: Omit<AgriculturalProfile, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<AgriculturalProfile> {
  const currentProfile = await findByUserId(userId);

  const nextProfile: AgriculturalProfile = {
    userId,
    farmName: profileInput.farmName,
    city: profileInput.city,
    state: profileInput.state,
    cropTypes: profileInput.cropTypes,
    areaHectares: profileInput.areaHectares,
    updatedAt: new Date().toISOString(),
    createdAt: currentProfile?.createdAt ?? new Date().toISOString(),
  };

  await profileDoc(userId).set(nextProfile, { merge: true });
  return nextProfile;
}
