import { AppError } from '../utils/AppError';
import { requireEmail, requireString } from '../utils/validators';
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

export interface RegisterPayload extends AuthCredentials {
  name: string;
}

function ensureFirebaseWebApiKey() {
  if (!config.firebaseWebApiKey) {
    throw new AppError('Configure FIREBASE_WEB_API_KEY para autenticação com Firebase Auth.', 500);
  }
}

function mapFirebaseError(rawError: FirebaseAuthErrorResponse) {
  const message = String(rawError?.error?.message ?? 'UNKNOWN');
  const code = message.split(':')[0].trim();

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

async function syncUser(userInput: Pick<User, 'id' | 'name' | 'email'>) {
  return userRepository.upsert({
    id: userInput.id,
    name: userInput.name,
    email: userInput.email,
  });
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const name = requireString(payload.name, 'name', 3);
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
