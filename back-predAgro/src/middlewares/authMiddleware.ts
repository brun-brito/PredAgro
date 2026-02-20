import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { firebaseAuth } from '../config/firebaseAdmin';
import * as userRepository from '../repositories/userRepository';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    next(new AppError('Token de acesso não informado.', 401));
    return;
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    const authUser = await firebaseAuth.getUser(decodedToken.uid);

    const persistedUser = await userRepository.upsert({
      id: authUser.uid,
      name: authUser.displayName ?? 'Usuário PredAgro',
      email: authUser.email ?? '',
    });

    req.user = {
      id: persistedUser.id,
      email: persistedUser.email,
      name: persistedUser.name,
    };

    next();
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error) {
      const code = String((error as { code?: string }).code ?? '');

      if (code === 'auth/id-token-expired') {
        next(new AppError('Token expirado. Realize o login novamente.', 401));
        return;
      }

      if (code === 'auth/argument-error') {
        next(new AppError('Token inválido.', 401));
        return;
      }

      if (code === 'auth/user-not-found') {
        next(new AppError('Usuário autenticado não encontrado.', 401));
        return;
      }
    }

    next(new AppError('Falha ao validar token de autenticação.', 401));
  }
}
