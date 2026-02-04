const { AppError } = require('./AppError');

function requireString(value, fieldName, minLength = 1) {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw new AppError(`Campo ${fieldName} inválido.`, 400);
  }

  return value.trim();
}

function requireEmail(value) {
  const email = requireString(value, 'email', 5).toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValidEmail) {
    throw new AppError('E-mail inválido.', 400);
  }

  return email;
}

function requireNumber(value, fieldName, min, max) {
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

function optionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value).trim();
}

function requireStringList(value, fieldName) {
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

module.exports = {
  requireString,
  requireEmail,
  requireNumber,
  optionalString,
  requireStringList,
};
