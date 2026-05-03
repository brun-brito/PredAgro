import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { firebaseAuth } from '../config/firebaseAdmin';

function resolveUserName(name: unknown, email: unknown) {
  if (typeof name === 'string' && name.trim().length > 0) {
    return name.trim();
  }

  if (typeof email === 'string' && email.includes('@')) {
    return email.split('@')[0].trim() || 'Usuário PredAgro';
  }

  return 'Usuário PredAgro';
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    next(new AppError('Token de acesso não informado.', 401));
    return;
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    req.user = {
      id: decodedToken.uid,
      email: typeof decodedToken.email === 'string' ? decodedToken.email : '',
      name: resolveUserName(decodedToken.name, decodedToken.email),
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
