import { firebaseFirestore } from '../config/firebaseAdmin';
import type { WeatherSnapshot } from '../types/domain';

function weatherCollection(userId: string, farmId: string, fieldId: string) {
  return firebaseFirestore
    .collection('users')
    .doc(userId)
    .collection('farms')
    .doc(farmId)
    .collection('fields')
    .doc(fieldId)
    .collection('weatherSnapshots');
}

export async function findLatestSnapshot(
  userId: string,
  farmId: string,
  fieldId: string
): Promise<WeatherSnapshot | null> {
  const snapshot = await weatherCollection(userId, farmId, fieldId)
    .orderBy('fetchedAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as WeatherSnapshot;
}

export async function listSnapshots(
  userId: string,
  farmId: string,
  fieldId: string,
  limit = 10
): Promise<WeatherSnapshot[]> {
  const snapshot = await weatherCollection(userId, farmId, fieldId)
    .orderBy('fetchedAt', 'desc')
    .limit(limit)
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => doc.data() as WeatherSnapshot);
}

export async function createSnapshot(
  userId: string,
  farmId: string,
  fieldId: string,
  snapshotInput: Omit<WeatherSnapshot, 'id'>
): Promise<WeatherSnapshot> {
  const snapshotRef = weatherCollection(userId, farmId, fieldId).doc();

  const snapshot: WeatherSnapshot = {
    id: snapshotRef.id,
    ...snapshotInput,
  };

  await snapshotRef.set(snapshot);
  return snapshot;
}

export async function removeSnapshots(userId: string, farmId: string, fieldId: string): Promise<void> {
  const snapshot = await weatherCollection(userId, farmId, fieldId).get();

  if (snapshot.empty) {
    return;
  }

  const batch = firebaseFirestore.batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}
