import fs from 'node:fs';
import admin from 'firebase-admin';
import { AppError } from '../utils/AppError';
import { config } from './env';

type ServiceAccount = admin.ServiceAccount & {
  project_id?: string;
  private_key?: string;
  private_key_id?: string;
  client_email?: string;
  client_id?: string;
};

function parseServiceAccount(rawCredential: string, sourceLabel: string): ServiceAccount {
  try {
    return JSON.parse(rawCredential) as ServiceAccount;
  } catch {
    throw new AppError(`Credencial Firebase inválida em ${sourceLabel}.`, 500);
  }
}

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, '\n').trim();
}

function normalizeServiceAccount(serviceAccount: ServiceAccount): admin.ServiceAccount {
  const projectId = serviceAccount.projectId ?? serviceAccount.project_id;
  const clientEmail = serviceAccount.clientEmail ?? serviceAccount.client_email;
  const privateKey = serviceAccount.privateKey ?? serviceAccount.private_key;

  if (!projectId || !clientEmail || !privateKey) {
    throw new AppError(
      'Credencial Firebase incompleta. Informe projectId, clientEmail e privateKey no arquivo ou nas variáveis de ambiente.',
      500
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: normalizePrivateKey(privateKey),
  };
}

function loadServiceAccountFromEnv(): admin.ServiceAccount | null {
  if (config.firebaseServiceAccountJson) {
    return normalizeServiceAccount(
      parseServiceAccount(config.firebaseServiceAccountJson, 'FIREBASE_SERVICE_ACCOUNT_JSON')
    );
  }

  if (config.firebaseServiceAccountBase64) {
    const rawCredential = Buffer.from(config.firebaseServiceAccountBase64, 'base64').toString('utf8');
    return normalizeServiceAccount(parseServiceAccount(rawCredential, 'FIREBASE_SERVICE_ACCOUNT_BASE64'));
  }

  if (config.firebaseProjectId && config.firebaseClientEmail && config.firebasePrivateKey) {
    return normalizeServiceAccount({
      projectId: config.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: config.firebasePrivateKey,
      private_key_id: config.firebasePrivateKeyId,
      client_id: config.firebaseClientId,
    });
  }

  return null;
}

function loadServiceAccountFromFile(): admin.ServiceAccount | null {
  if (!config.firebaseServiceAccountPath || !fs.existsSync(config.firebaseServiceAccountPath)) {
    return null;
  }

  const rawCredential = fs.readFileSync(config.firebaseServiceAccountPath, 'utf8');
  return normalizeServiceAccount(parseServiceAccount(rawCredential, config.firebaseServiceAccountPath));
}

function loadServiceAccount() {
  const serviceAccountFromEnv = loadServiceAccountFromEnv();

  if (serviceAccountFromEnv) {
    return serviceAccountFromEnv;
  }

  const serviceAccountFromFile = loadServiceAccountFromFile();

  if (serviceAccountFromFile) {
    return serviceAccountFromFile;
  }

  throw new AppError(
    'Configure o Firebase Admin com FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY ou FIREBASE_SERVICE_ACCOUNT_PATH.',
    500
  );
}

function initializeFirebaseApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = loadServiceAccount();

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

const firebaseApp = initializeFirebaseApp();
const firebaseFirestore = firebaseApp.firestore();

firebaseFirestore.settings({
  ignoreUndefinedProperties: true,
});

export { firebaseApp, firebaseFirestore };
export const firebaseAuth = firebaseApp.auth();
