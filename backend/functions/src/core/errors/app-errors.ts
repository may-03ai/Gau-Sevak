import { HttpsError, type FunctionsErrorCode } from 'firebase-functions/v2/https';

export class AppError extends Error {
  constructor(
    readonly code: FunctionsErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toHttpsError(error: unknown): HttpsError {
  if (error instanceof HttpsError) {
    return error;
  }

  if (error instanceof AppError) {
    return new HttpsError(error.code, error.message);
  }

  return new HttpsError('internal', 'An unexpected error occurred.');
}