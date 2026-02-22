import { firebaseFirestore } from '../config/firebaseAdmin';
import type { PlantingPlan } from '../types/domain';

function plansCollection(userId: string, farmId: string, fieldId: string) {
  return firebaseFirestore
    .collection('users')
    .doc(userId)
    .collection('farms')
    .doc(farmId)
    .collection('fields')
    .doc(fieldId)
    .collection('plans');
}

export async function listByFieldId(
  userId: string,
  farmId: string,
  fieldId: string
): Promise<PlantingPlan[]> {
  const snapshot = await plansCollection(userId, farmId, fieldId).orderBy('createdAt', 'desc').get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => doc.data() as PlantingPlan);
}

export async function findById(
  userId: string,
  farmId: string,
  fieldId: string,
  planId: string
): Promise<PlantingPlan | null> {
  const snapshot = await plansCollection(userId, farmId, fieldId).doc(planId).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as PlantingPlan;
}

export async function create(
  userId: string,
  farmId: string,
  fieldId: string,
  planInput: Omit<PlantingPlan, 'id'>
): Promise<PlantingPlan> {
  const planRef = plansCollection(userId, farmId, fieldId).doc();

  const plan: PlantingPlan = {
    id: planRef.id,
    ...planInput,
  };

  await planRef.set(plan);
  return plan;
}

export async function update(
  userId: string,
  farmId: string,
  fieldId: string,
  planId: string,
  planInput: Partial<PlantingPlan>
): Promise<void> {
  await plansCollection(userId, farmId, fieldId).doc(planId).set(planInput, { merge: true });
}
