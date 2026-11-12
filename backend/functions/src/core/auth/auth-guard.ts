import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase-admin.js';
import { logWarning } from '../logging/logger.js';

export type VerifiedAuthContext = NonNullable<CallableRequest<unknown>['auth']>;

export interface SuperAdminAccessState {
  enabled: unknown;
  updatedAt: unknown;
  updatedBy: unknown;
  reasonCode: unknown;
  version: unknown;
}

export type SuperAdminAccessStateReader = (uid: string) => Promise<unknown>;

const superAdminAccessStateKeys = [
  'enabled',
  'updatedAt',
  'updatedBy',
  'reasonCode',
  'version',
] as const;

const readSuperAdminAccessState: SuperAdminAccessStateReader = async (uid) => {
  const snapshot = await db.collection('super_admin_access').doc(uid).get();
  return snapshot.exists ? snapshot.data() : undefined;
};

function isActiveSuperAdminState(value: unknown): value is SuperAdminAccessState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const state = value as Record<string, unknown>;
  const keys = Object.keys(state);

  return keys.length === superAdminAccessStateKeys.length
    && superAdminAccessStateKeys.every((key) => keys.includes(key))
    && state.enabled === true
    && state.updatedAt instanceof Timestamp
    && typeof state.updatedBy === 'string'
    && state.updatedBy.length > 0
    && typeof state.reasonCode === 'string'
    && state.reasonCode.length > 0
    && typeof state.version === 'number'
    && Number.isSafeInteger(state.version)
    && state.version > 0;
}

function permissionDenied(): HttpsError {
  return new HttpsError('permission-denied', 'Super Admin access is required.');
}

export function requireAuthenticatedUser(
  request: CallableRequest<unknown>,
): VerifiedAuthContext {
  const authContext = request.auth;
  if (!authContext || typeof authContext.uid !== 'string' || authContext.uid.length === 0) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  return authContext;
}

export function createActiveSuperAdminGuard(readState: SuperAdminAccessStateReader) {
  return async function requireActiveSuperAdmin(
    request: CallableRequest<unknown>,
  ): Promise<VerifiedAuthContext> {
    const authContext = requireAuthenticatedUser(request);
    if (authContext.token.superAdmin !== true) {
      throw permissionDenied();
    }

    let state: unknown;
    try {
      state = await readState(authContext.uid);
    } catch {
      logWarning('super_admin_authorization_state_read_failed');
      throw permissionDenied();
    }

    if (!isActiveSuperAdminState(state)) {
      throw permissionDenied();
    }

    return authContext;
  };
}

export const requireActiveSuperAdmin = createActiveSuperAdminGuard(readSuperAdminAccessState);