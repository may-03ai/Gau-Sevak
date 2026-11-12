import { type CallableRequest } from 'firebase-functions/v2/https';
export type VerifiedAuthContext = NonNullable<CallableRequest<unknown>['auth']>;
export interface SuperAdminAccessState {
    enabled: unknown;
    updatedAt: unknown;
    updatedBy: unknown;
    reasonCode: unknown;
    version: unknown;
}
export type SuperAdminAccessStateReader = (uid: string) => Promise<unknown>;
export declare function requireAuthenticatedUser(request: CallableRequest<unknown>): VerifiedAuthContext;
export declare function createActiveSuperAdminGuard(readState: SuperAdminAccessStateReader): (request: CallableRequest<unknown>) => Promise<VerifiedAuthContext>;
export declare const requireActiveSuperAdmin: (request: CallableRequest<unknown>) => Promise<VerifiedAuthContext>;
