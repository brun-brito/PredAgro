const { AppError } = require('../utils/AppError');
const { requireEmail, requireString } = require('../utils/validators');
const { config } = require('../config/env');
const { firebaseAuth } = require('../config/firebaseAdmin');
const userRepository = require('../repositories/userRepository');

const FIREBASE_AUTH_BASE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

const firebaseErrorMap = {
  EMAIL_EXISTS: { statusCode: 409, message: 'Já existe usuário com este e-mail.' },
  EMAIL_NOT_FOUND: { statusCode: 401, message: 'Credenciais inválidas.' },
  INVALID_PASSWORD: { statusCode: 401, message: 'Credenciais inválidas.' },
  INVALID_LOGIN_CREDENTIALS: { statusCode: 401, message: 'Credenciais inválidas.' },
  USER_DISABLED: { statusCode: 403, message: 'Conta de usuário desativada.' },
  WEAK_PASSWORD: { statusCode: 400, message: 'Senha muito fraca. Use ao menos 6 caracteres.' },
};

function ensureFirebaseWebApiKey() {
  if (!config.firebaseWebApiKey) {
    throw new AppError(
      'Configure FIREBASE_WEB_API_KEY para autenticação com Firebase Auth.',
      500
    );
  }
}

function mapFirebaseError(rawError) {
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

async function requestFirebaseAuth(action, payload) {
  ensureFirebaseWebApiKey();

  let response;

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

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const mappedError = mapFirebaseError(body);
    throw new AppError(mappedError.message, mappedError.statusCode, body.error ?? null);
  }

  return body;
}

async function syncUser(userInput) {
  return userRepository.upsert({
    id: userInput.id,
    name: userInput.name,
    email: userInput.email,
  });
}

async function register(payload) {
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

async function login(payload) {
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

module.exports = {
  register,
  login,
};
