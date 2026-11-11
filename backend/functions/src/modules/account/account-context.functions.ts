import { onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { requireAuthenticatedUser, type VerifiedAuthContext } from '../../core/auth/auth-guard.js';

export interface MyAuthContext {
  uid: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  superAdmin: boolean;
}

export function getVerifiedAccountContext(request: CallableRequest<unknown>): MyAuthContext {
  const authContext: VerifiedAuthContext = requireAuthenticatedUser(request);
  const phoneNumber = authContext.token.phone_number;

  return {
    uid: authContext.uid,
    emailVerified: authContext.token.email_verified === true,
    phoneVerified: typeof phoneNumber === 'string' && phoneNumber.length > 0,
    superAdmin: authContext.token.superAdmin === true,
  };
}

export const getMyAuthContext = onCall((request) => getVerifiedAccountContext(request));