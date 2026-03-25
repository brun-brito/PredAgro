import { getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInWithPopup,
  signOut,
  type Auth,
} from 'firebase/auth';

const FIREBASE_APP_NAME = 'predagro-web';

function getFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? '';
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ?? '';
  const authDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || `${projectId}.firebaseapp.com`).trim();

  if (!apiKey || !projectId) {
    throw new Error('Configure o Firebase Web no front para habilitar o login com Google.');
  }

  return {
    apiKey,
    authDomain,
    projectId,
  };
}

let authInstance: Auth | null = null;
let persistencePromise: Promise<void> | null = null;

function getFirebaseAuthClient() {
  if (authInstance) {
    return authInstance;
  }

  const firebaseConfig = getFirebaseConfig();
  const existingApp = getApps().find((app) => app.name === FIREBASE_APP_NAME);
  const firebaseApp = existingApp ?? initializeApp(firebaseConfig, FIREBASE_APP_NAME);

  authInstance = getAuth(firebaseApp);
  return authInstance;
}

async function ensurePersistence() {
  if (!persistencePromise) {
    persistencePromise = setPersistence(getFirebaseAuthClient(), browserLocalPersistence);
  }

  await persistencePromise;
}

function mapGoogleAuthError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

  if (code === 'auth/popup-closed-by-user') {
    return 'Autenticação com Google cancelada.';
  }

  if (code === 'auth/popup-blocked') {
    return 'O navegador bloqueou a janela do Google. Libere pop-ups e tente novamente.';
  }

  if (code === 'auth/cancelled-popup-request') {
    return 'A solicitação de login com Google foi cancelada.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'O domínio atual não está autorizado no Firebase Auth. Adicione o domínio do front em Authentication > Settings > Authorized domains.';
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return 'Este e-mail já está vinculado a outro método de acesso. Entre com senha para continuar.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'O provedor Google não está habilitado no Firebase Auth.';
  }

  return 'Não foi possível autenticar com Google.';
}

export async function authenticateWithGooglePopup() {
  const auth = getFirebaseAuthClient();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  await ensurePersistence();

  try {
    const result = await signInWithPopup(auth, provider);
    return {
      idToken: await result.user.getIdToken(),
    };
  } catch (error) {
    throw new Error(mapGoogleAuthError(error));
  }
}

export async function clearFirebaseAuthSession() {
  if (!authInstance) {
    return;
  }

  await signOut(authInstance);
}
