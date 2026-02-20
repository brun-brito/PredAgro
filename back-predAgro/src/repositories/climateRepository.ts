import { firebaseFirestore } from '../config/firebaseAdmin';
import type { ClimateRecord } from '../types/domain';

type ClimateRecordInput = Omit<ClimateRecord, 'id' | 'createdAt'>;

function climateCollection(userId: string) {
  return firebaseFirestore.collection('users').doc(userId).collection('climateRecords');
}

export async function create(recordInput: ClimateRecordInput): Promise<ClimateRecord> {
  const recordRef = climateCollection(recordInput.userId).doc();

  const record: ClimateRecord = {
    id: recordRef.id,
    ...recordInput,
    createdAt: new Date().toISOString(),
  };

  await recordRef.set(record);
  return record;
}

export async function findByUserId(userId: string): Promise<ClimateRecord[]> {
  const snapshot = await climateCollection(userId).orderBy('collectedAt', 'desc').get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => doc.data() as ClimateRecord);
}

export async function findLatestByUserId(userId: string): Promise<ClimateRecord | null> {
  const snapshot = await climateCollection(userId).orderBy('collectedAt', 'desc').limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as ClimateRecord;
}
