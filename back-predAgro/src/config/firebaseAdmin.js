const fs = require('node:fs');
const admin = require('firebase-admin');
const { AppError } = require('../utils/AppError');
const { config } = require('./env');

function loadServiceAccount() {
  if (!fs.existsSync(config.firebaseServiceAccountPath)) {
    throw new AppError(
      `Arquivo de credencial Firebase não encontrado em ${config.firebaseServiceAccountPath}.`,
      500
    );
  }

  const rawCredential = fs.readFileSync(config.firebaseServiceAccountPath, 'utf8');

  try {
    return JSON.parse(rawCredential);
  } catch {
    throw new AppError('Arquivo de credencial Firebase inválido.', 500);
  }
}

function initializeFirebaseApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = loadServiceAccount();

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

module.exports = {
  firebaseApp,
  firebaseAuth: firebaseApp.auth(),
  firebaseFirestore,
};
