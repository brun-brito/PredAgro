import { firebaseFirestore } from '../config/firebaseAdmin';
import type { Farm } from '../types/domain';

function farmsCollection(userId: string) {
  return firebaseFirestore.collection('users').doc(userId).collection('farms');
}

export async function listByUserId(userId: string): Promise<Farm[]> {
  const snapshot = await farmsCollection(userId).orderBy('createdAt', 'desc').get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => doc.data() as Farm);
}

export async function findById(userId: string, farmId: string): Promise<Farm | null> {
  const snapshot = await farmsCollection(userId).doc(farmId).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as Farm;
}

export async function create(userId: string, farmInput: Omit<Farm, 'id' | 'userId'>): Promise<Farm> {
  const farmRef = farmsCollection(userId).doc();

  const farm: Farm = {
    id: farmRef.id,
    userId,
    ...farmInput,
  };

  await farmRef.set(farm);
  return farm;
}

export async function update(userId: string, farmId: string, farmInput: Partial<Farm>): Promise<Farm> {
  await farmsCollection(userId).doc(farmId).set(farmInput, { merge: true });
  const snapshot = await farmsCollection(userId).doc(farmId).get();
  return snapshot.data() as Farm;
}

export async function remove(userId: string, farmId: string): Promise<void> {
  await farmsCollection(userId).doc(farmId).delete();
}
