const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config();

const firebaseServiceAccountPathInput =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
  path.resolve(__dirname, '../../pred-agro-firebase-adminsdk-fbsvc-3e36bd3970.json');

const config = {
  port: Number(process.env.PORT ?? 3333),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  firebaseServiceAccountPath: path.isAbsolute(firebaseServiceAccountPathInput)
    ? firebaseServiceAccountPathInput
    : path.resolve(process.cwd(), firebaseServiceAccountPathInput),
  firebaseWebApiKey: process.env.FIREBASE_WEB_API_KEY ?? '',
};

module.exports = { config };
