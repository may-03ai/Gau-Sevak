import { logger as firebaseLogger } from 'firebase-functions/logger';

export function logInfo(event: string): void {
  firebaseLogger.info(event);
}

export function logWarning(event: string): void {
  firebaseLogger.warn(event);
}

export function logError(event: string): void {
  firebaseLogger.error(event);
}