import { firebaseFirestore } from '../config/firebaseAdmin';
import type { User } from '../types/domain';

function userDoc(userId: string) {
  return firebaseFirestore.collection('users').doc(userId);
}

export async function findById(userId: string): Promise<User | null> {
  const snapshot = await userDoc(userId).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as User;
}

export async function upsert({ id, name, email }: Pick<User, 'id' | 'name' | 'email'>): Promise<User> {
  const currentUser = await findById(id);

  const nextUser: User = {
    id,
    name,
    email,
    createdAt: currentUser?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await userDoc(id).set(nextUser, { merge: true });
  return nextUser;
}
