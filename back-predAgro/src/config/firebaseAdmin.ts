import fs from 'node:fs';
import admin from 'firebase-admin';
import { AppError } from '../utils/AppError';
import { config } from './env';

type ServiceAccount = admin.ServiceAccount & { project_id?: string };

function loadServiceAccount(): ServiceAccount {
  if (!fs.existsSync(config.firebaseServiceAccountPath)) {
    throw new AppError(
      `Arquivo de credencial Firebase não encontrado em ${config.firebaseServiceAccountPath}.`,
      500
    );
  }

  const rawCredential = fs.readFileSync(config.firebaseServiceAccountPath, 'utf8');

  try {
    return JSON.parse(rawCredential) as ServiceAccount;
  } catch {
    throw new AppError('Arquivo de credencial Firebase inválido.', 500);
  }
}

function initializeFirebaseApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = loadServiceAccount();

  if (!serviceAccount.project_id) {
    throw new AppError('project_id ausente na credencial Firebase.', 500);
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const firebaseApp = initializeFirebaseApp();
const firebaseFirestore = firebaseApp.firestore();

firebaseFirestore.settings({
  ignoreUndefinedProperties: true,
});

export { firebaseApp, firebaseFirestore };
export const firebaseAuth = firebaseApp.auth();
