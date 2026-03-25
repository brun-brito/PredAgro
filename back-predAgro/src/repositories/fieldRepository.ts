import { firebaseFirestore } from '../config/firebaseAdmin';
import { deleteDocumentTree } from './firestoreDelete';
import type { Field, FieldGeometry } from '../types/domain';

type FirestoreFieldDoc = Omit<Field, 'geometry'> & {
  geometryJson?: string;
  geometry?: FieldGeometry;
};

function parseGeometry(geometryJson: string) {
  try {
    return JSON.parse(geometryJson) as FieldGeometry;
  } catch (error) {
    throw new Error('Falha ao interpretar a geometria do talhão.');
  }
}

function toFirestoreField(fieldInput: Field) {
  const { geometry, ...rest } = fieldInput;

  if (!geometry) {
    return {
      ...rest,
    };
  }

  return {
    ...rest,
    geometryJson: JSON.stringify(geometry),
  };
}

function fromFirestoreField(data: FirestoreFieldDoc): Field {
  const { geometryJson, geometry: legacyGeometry, ...rest } = data;

  if (geometryJson) {
    return {
      ...rest,
      geometry: parseGeometry(geometryJson),
      areaHa: rest.areaHa ?? null,
      centroidLat: rest.centroidLat ?? null,
      centroidLon: rest.centroidLon ?? null,
    };
  }

  if (legacyGeometry) {
    return {
      ...rest,
      geometry: legacyGeometry,
      areaHa: rest.areaHa ?? null,
      centroidLat: rest.centroidLat ?? null,
      centroidLon: rest.centroidLon ?? null,
    };
  }

  return {
    ...rest,
    geometry: null,
    areaHa: rest.areaHa ?? null,
    centroidLat: rest.centroidLat ?? null,
    centroidLon: rest.centroidLon ?? null,
  };
}

function fieldsCollection(userId: string, farmId: string) {
  return firebaseFirestore.collection('users').doc(userId).collection('farms').doc(farmId).collection('fields');
}

export async function listByFarmId(userId: string, farmId: string): Promise<Field[]> {
  const snapshot = await fieldsCollection(userId, farmId).orderBy('createdAt', 'desc').get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => fromFirestoreField(doc.data() as FirestoreFieldDoc));
}

export async function listByUserId(userId: string): Promise<Field[]> {
  const snapshot = await firebaseFirestore
    .collectionGroup('fields')
    .where('userId', '==', userId)
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => fromFirestoreField(doc.data() as FirestoreFieldDoc));
}

export async function findById(userId: string, farmId: string, fieldId: string): Promise<Field | null> {
  const snapshot = await fieldsCollection(userId, farmId).doc(fieldId).get();

  if (!snapshot.exists) {
    return null;
  }

  return fromFirestoreField(snapshot.data() as FirestoreFieldDoc);
}

export async function create(userId: string, farmId: string, fieldInput: Omit<Field, 'id'>): Promise<Field> {
  const fieldRef = fieldsCollection(userId, farmId).doc();

  const field: Field = {
    id: fieldRef.id,
    ...fieldInput,
  };

  await fieldRef.set(toFirestoreField(field));
  return field;
}

export async function update(userId: string, farmId: string, fieldId: string, field: Field): Promise<Field> {
  await fieldsCollection(userId, farmId).doc(fieldId).set(toFirestoreField(field), { merge: true });
  return field;
}

export async function remove(userId: string, farmId: string, fieldId: string): Promise<void> {
  await deleteDocumentTree(fieldsCollection(userId, farmId).doc(fieldId));
}
