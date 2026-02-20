export class AppError extends Error {
  statusCode: number;
  details: unknown;

  constructor(message: string, statusCode = 400, details: unknown = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
