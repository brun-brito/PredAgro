import { AppError } from './AppError';

export function requireString(value: unknown, fieldName: string, minLength = 1) {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw new AppError(`Campo ${fieldName} inválido.`, 400);
  }

  return value.trim();
}

export function requireEmail(value: unknown) {
  const email = requireString(value, 'email', 5).toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValidEmail) {
    throw new AppError('E-mail inválido.', 400);
  }

  return email;
}

export function requirePhone(value: unknown) {
  const phone = requireString(value, 'telefone', 8).replace(/\D/g, '');

  if (phone.length < 8 || phone.length > 15) {
    throw new AppError('Campo telefone inválido.', 400);
  }

  return phone;
}

export function requireNumber(value: unknown, fieldName: string, min?: number, max?: number) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    throw new AppError(`Campo ${fieldName} deve ser numérico.`, 400);
  }

  if (min !== undefined && numberValue < min) {
    throw new AppError(`Campo ${fieldName} abaixo do limite permitido.`, 400);
  }

  if (max !== undefined && numberValue > max) {
    throw new AppError(`Campo ${fieldName} acima do limite permitido.`, 400);
  }

  return numberValue;
}

export function optionalString(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value).trim();
}

export function optionalEnum<T extends string>(value: unknown, allowed: readonly T[], fieldName: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = String(value).trim() as T;

  if (!allowed.includes(normalized)) {
    throw new AppError(`Campo ${fieldName} inválido.`, 400);
  }

  return normalized;
}

export function optionalBoolean(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === 'false') {
    return value === 'true';
  }

  throw new AppError(`Campo ${fieldName} inválido.`, 400);
}

export function requireStringList(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new AppError(`Campo ${fieldName} deve ser uma lista.`, 400);
  }

  const items = value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);

  if (items.length === 0) {
    throw new AppError(`Campo ${fieldName} deve conter ao menos um item válido.`, 400);
  }

  return items;
}
