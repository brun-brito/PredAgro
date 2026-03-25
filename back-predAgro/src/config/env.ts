import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ quiet: true });

const firebaseServiceAccountPathInput = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, '');
}

function parseCorsOrigins(rawOrigins: string) {
  const normalizedInput = rawOrigins.trim();

  if (!normalizedInput || normalizedInput === '*') {
    return {
      allowAnyCorsOrigin: true,
      corsOrigins: [] as string[],
    };
  }

  return {
    allowAnyCorsOrigin: false,
    corsOrigins: Array.from(
      new Set(
        normalizedInput
          .split(',')
          .map((origin) => normalizeOrigin(origin))
          .filter((origin) => origin.length > 0)
      )
    ),
  };
}

const corsSettings = parseCorsOrigins(process.env.CORS_ORIGIN ?? '*');

export interface AppConfig {
  port: number;
  nodeEnv: string;
  allowAnyCorsOrigin: boolean;
  corsOrigins: string[];
  firebaseServiceAccountPath?: string;
  firebaseServiceAccountJson?: string;
  firebaseServiceAccountBase64?: string;
  firebaseProjectId?: string;
  firebaseClientEmail?: string;
  firebasePrivateKey?: string;
  firebasePrivateKeyId?: string;
  firebaseClientId?: string;
  firebaseWebApiKey: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 3333),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  allowAnyCorsOrigin: corsSettings.allowAnyCorsOrigin,
  corsOrigins: corsSettings.corsOrigins,
  firebaseServiceAccountPath: firebaseServiceAccountPathInput
    ? path.isAbsolute(firebaseServiceAccountPathInput)
      ? firebaseServiceAccountPathInput
      : path.resolve(process.cwd(), firebaseServiceAccountPathInput)
    : undefined,
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() || undefined,
  firebaseServiceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim() || undefined,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID?.trim() || undefined,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim() || undefined,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || undefined,
  firebasePrivateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID?.trim() || undefined,
  firebaseClientId: process.env.FIREBASE_CLIENT_ID?.trim() || undefined,
  firebaseWebApiKey: process.env.FIREBASE_WEB_API_KEY ?? '',
};
