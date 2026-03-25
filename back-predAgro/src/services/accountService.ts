import type { UserRecord } from 'firebase-admin/auth';
import { firebaseAuth } from '../config/firebaseAdmin';
import * as userRepository from '../repositories/userRepository';
import type { User } from '../types/domain';
import { AppError } from '../utils/AppError';
import { requireEmail, requirePhone, requireString } from '../utils/validators';

interface UpdateProfilePayload {
  name: string;
  email: string;
  telefone: string;
}

export interface AccountProfileResponse {
  user: User;
  authProvider: string;
  emailEditable: boolean;
}

function hasPasswordProvider(authUser: UserRecord) {
  return authUser.providerData.some((provider) => provider.providerId === 'password');
}

function resolveAuthProvider(authUser: UserRecord) {
  return authUser.providerData[0]?.providerId ?? (hasPasswordProvider(authUser) ? 'password' : 'unknown');
}

async function syncCurrentUser(userId: string, authUser: UserRecord) {
  const currentUser = await userRepository.findById(userId);
  const email = authUser.email?.trim().toLowerCase() ?? currentUser?.email;

  if (!email) {
    throw new AppError('Usuário autenticado sem e-mail válido.', 400);
  }

  return userRepository.upsert({
    id: userId,
    name: authUser.displayName?.trim() || currentUser?.name || 'Usuário PredAgro',
    email,
    telefone: currentUser?.telefone,
  });
}

function buildAccountProfile(user: User, authUser: UserRecord): AccountProfileResponse {
  return {
    user,
    authProvider: resolveAuthProvider(authUser),
    emailEditable: hasPasswordProvider(authUser),
  };
}

function mapFirebaseUpdateError(error: unknown): never {
  if (typeof error === 'object' && error && 'code' in error) {
    const code = String((error as { code?: string }).code ?? '');

    if (code === 'auth/email-already-exists') {
      throw new AppError('Já existe usuário com este e-mail.', 409);
    }

    if (code === 'auth/invalid-email') {
      throw new AppError('E-mail inválido.', 400);
    }

    if (code === 'auth/user-not-found') {
      throw new AppError('Usuário não encontrado.', 404);
    }
  }

  throw new AppError('Não foi possível atualizar os dados da conta.', 502);
}

export async function getProfile(userId: string): Promise<AccountProfileResponse> {
  const authUser = await firebaseAuth.getUser(userId);
  const user = await syncCurrentUser(userId, authUser);

  return buildAccountProfile(user, authUser);
}

export async function updateProfile(
  userId: string,
  payload: UpdateProfilePayload
): Promise<AccountProfileResponse> {
  const authUser = await firebaseAuth.getUser(userId);
  const currentUser = await syncCurrentUser(userId, authUser);
  const name = requireString(payload.name, 'name', 3);
  const email = requireEmail(payload.email);
  const telefone = requirePhone(payload.telefone);
  const emailEditable = hasPasswordProvider(authUser);
  const currentEmail = authUser.email?.trim().toLowerCase() ?? currentUser.email;

  if (!emailEditable && email !== currentEmail) {
    throw new AppError('O e-mail de contas Google deve ser alterado na própria conta Google.', 400);
  }

  try {
    await firebaseAuth.updateUser(userId, {
      displayName: name,
      ...(emailEditable && email !== currentEmail ? { email } : {}),
    });
  } catch (error) {
    mapFirebaseUpdateError(error);
  }

  const refreshedAuthUser = await firebaseAuth.getUser(userId);
  const user = await userRepository.upsert({
    id: userId,
    name,
    email: refreshedAuthUser.email?.trim().toLowerCase() ?? email,
    telefone,
  });

  return buildAccountProfile(user, refreshedAuthUser);
}
