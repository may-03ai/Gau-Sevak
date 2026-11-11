import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

export type VerifiedAuthContext = NonNullable<CallableRequest<unknown>['auth']>;

export function requireAuthenticatedUser(
  request: CallableRequest<unknown>,
): VerifiedAuthContext {
  const authContext = request.auth;
  if (!authContext || typeof authContext.uid !== 'string' || authContext.uid.length === 0) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  return authContext;
}

export function requireSuperAdmin(
  request: CallableRequest<unknown>,
): VerifiedAuthContext {
  const authContext = requireAuthenticatedUser(request);
  if (authContext.token.superAdmin !== true) {
    throw new HttpsError('permission-denied', 'Super Admin access is required.');
  }

  return authContext;
}