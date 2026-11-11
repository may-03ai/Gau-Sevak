import { type CallableRequest } from 'firebase-functions/v2/https';
export type VerifiedAuthContext = NonNullable<CallableRequest<unknown>['auth']>;
export declare function requireAuthenticatedUser(request: CallableRequest<unknown>): VerifiedAuthContext;
export declare function requireSuperAdmin(request: CallableRequest<unknown>): VerifiedAuthContext;
