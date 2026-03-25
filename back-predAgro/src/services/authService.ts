import { AppError } from '../utils/AppError';
import { requireEmail, requirePhone, requireString } from '../utils/validators';
import { config } from '../config/env';
import { firebaseAuth } from '../config/firebaseAdmin';
import * as userRepository from '../repositories/userRepository';
import type { User } from '../types/domain';

const FIREBASE_AUTH_BASE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

const firebaseErrorMap: Record<string, { statusCode: number; message: string }> = {
  EMAIL_EXISTS: { statusCode: 409, message: 'Já existe usuário com este e-mail.' },
  EMAIL_NOT_FOUND: { statusCode: 401, message: 'Credenciais inválidas.' },
  INVALID_PASSWORD: { statusCode: 401, message: 'Credenciais inválidas.' },
  INVALID_LOGIN_CREDENTIALS: { statusCode: 401, message: 'Credenciais inválidas.' },
  USER_DISABLED: { statusCode: 403, message: 'Conta de usuário desativada.' },
  WEAK_PASSWORD: { statusCode: 400, message: 'Senha muito fraca. Use ao menos 6 caracteres.' },
};

interface FirebaseAuthErrorResponse {
  error?: {
    message?: string;
  };
}

interface FirebaseAuthSuccessResponse {
  localId: string;
  idToken: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface GoogleAuthPayload {
  idToken: string;
}

export interface RegisterPayload extends AuthCredentials {
  name: string;
  telefone: string;
}

export interface MessageResponse {
  message: string;
}

function ensureFirebaseWebApiKey() {
  if (!config.firebaseWebApiKey) {
    throw new AppError('Configure FIREBASE_WEB_API_KEY para autenticação com Firebase Auth.', 500);
  }
}

function getFirebaseErrorCode(rawError: FirebaseAuthErrorResponse) {
  return String(rawError?.error?.message ?? 'UNKNOWN').split(':')[0].trim();
}

function mapFirebaseError(rawError: FirebaseAuthErrorResponse) {
  const code = getFirebaseErrorCode(rawError);

  if (firebaseErrorMap[code]) {
    return firebaseErrorMap[code];
  }

  return {
    statusCode: 502,
    message: 'Falha ao comunicar com o Firebase Auth.',
  };
}

async function requestFirebaseAuth(action: string, payload: Record<string, unknown>) {
  ensureFirebaseWebApiKey();

  let response: Response;

  try {
    response = await fetch(`${FIREBASE_AUTH_BASE_URL}:${action}?key=${config.firebaseWebApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AppError('Falha de comunicação com o Firebase Auth.', 502);
  }

  const body = (await response.json().catch(() => ({}))) as FirebaseAuthErrorResponse &
    FirebaseAuthSuccessResponse;

  if (!response.ok) {
    const mappedError = mapFirebaseError(body);
    throw new AppError(mappedError.message, mappedError.statusCode, body.error ?? null);
  }

  return body;
}

function isEmailNotFoundError(error: unknown) {
  if (!(error instanceof AppError) || !error.details || typeof error.details !== 'object') {
    return false;
  }

  return getFirebaseErrorCode({ error: error.details as { message?: string } }) === 'EMAIL_NOT_FOUND';
}

async function syncUser(userInput: Pick<User, 'id' | 'name' | 'email'> & Pick<Partial<User>, 'telefone'>) {
  return userRepository.upsert({
    id: userInput.id,
    name: userInput.name,
    email: userInput.email,
    telefone: userInput.telefone,
  });
}

function resolveUserName(displayName: string | null | undefined, email: string) {
  const normalizedDisplayName = displayName?.trim();

  if (normalizedDisplayName) {
    return normalizedDisplayName;
  }

  const emailPrefix = email.split('@')[0]?.trim();
  return emailPrefix || 'Usuário PredAgro';
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const name = requireString(payload.name, 'name', 3);
  const telefone = requirePhone(payload.telefone);
  const email = requireEmail(payload.email);
  const password = requireString(payload.password, 'password', 6);

  const signUpResponse = await requestFirebaseAuth('signUp', {
    email,
    password,
    returnSecureToken: true,
  });

  await firebaseAuth.updateUser(signUpResponse.localId, {
    displayName: name,
  });

  const user = await syncUser({
    id: signUpResponse.localId,
    name,
    email,
    telefone,
  });

  return {
    user,
    token: signUpResponse.idToken,
  };
}

export async function login(payload: AuthCredentials): Promise<AuthResponse> {
  const email = requireEmail(payload.email);
  const password = requireString(payload.password, 'password', 6);

  const signInResponse = await requestFirebaseAuth('signInWithPassword', {
    email,
    password,
    returnSecureToken: true,
  });

  const authUser = await firebaseAuth.getUser(signInResponse.localId);

  const user = await syncUser({
    id: authUser.uid,
    name: authUser.displayName ?? 'Usuário PredAgro',
    email: authUser.email ?? email,
  });

  return {
    user,
    token: signInResponse.idToken,
  };
}

export async function authenticateWithGoogle(payload: GoogleAuthPayload): Promise<AuthResponse> {
  const idToken = requireString(payload.idToken, 'idToken', 10);

  let decodedToken;

  try {
    decodedToken = await firebaseAuth.verifyIdToken(idToken);
  } catch {
    throw new AppError('Falha ao validar autenticação com Google.', 401);
  }

  if (decodedToken.firebase.sign_in_provider !== 'google.com') {
    throw new AppError('Conta Google inválida para autenticação.', 400);
  }

  const authUser = await firebaseAuth.getUser(decodedToken.uid);
  const email = authUser.email ?? (typeof decodedToken.email === 'string' ? decodedToken.email : '');

  if (!email) {
    throw new AppError('Conta Google sem e-mail válido.', 400);
  }

  const decodedName =
    'name' in decodedToken && typeof decodedToken.name === 'string' ? decodedToken.name : undefined;

  const user = await syncUser({
    id: authUser.uid,
    name: resolveUserName(authUser.displayName ?? decodedName, email),
    email,
  });

  return {
    user,
    token: idToken,
  };
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
  const email = requireEmail(payload.email);
  const message =
    'Se houver uma conta com este e-mail, enviaremos as instruções para redefinir a senha.';

  try {
    await requestFirebaseAuth('sendOobCode', {
      requestType: 'PASSWORD_RESET',
      email,
    });
  } catch (error) {
    if (isEmailNotFoundError(error)) {
      return { message };
    }

    throw error;
  }

  return { message };
}
