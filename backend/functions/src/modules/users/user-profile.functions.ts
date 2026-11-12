import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { auth, db } from '../../config/firebase-admin.js';
import { requireAuthenticatedUser } from '../../core/auth/auth-guard.js';
import { AppError, toHttpsError } from '../../core/errors/app-errors.js';
import { logError } from '../../core/logging/logger.js';
import {
  parseGetMyProfileInput,
  parseProvisionMyProfileInput,
  parseUpdateMyProfileInput,
} from './user-profile.validation.js';
import { createFirestoreProfileStore, createUserProfileService } from './user-profile.service.js';

const userProfileService = createUserProfileService(
  { getUser: (uid) => auth.getUser(uid) },
  createFirestoreProfileStore(db),
);

function handleError(error: unknown): never {
  if (!(error instanceof AppError) && !(error instanceof HttpsError)) {
    logError('user_profile.callable_failed');
  }
  throw toHttpsError(error);
}

export const provisionMyProfile = onCall(async (request) => {
  try {
    const { uid } = requireAuthenticatedUser(request);
    const input = parseProvisionMyProfileInput(request.data);
    return await userProfileService.provision(uid, input);
  } catch (error) {
    return handleError(error);
  }
});

export const getMyProfile = onCall(async (request) => {
  try {
    const { uid } = requireAuthenticatedUser(request);
    parseGetMyProfileInput(request.data);
    return { profile: await userProfileService.get(uid) };
  } catch (error) {
    return handleError(error);
  }
});

export const updateMyProfile = onCall(async (request) => {
  try {
    const { uid } = requireAuthenticatedUser(request);
    const input = parseUpdateMyProfileInput(request.data);
    return { profile: await userProfileService.update(uid, input) };
  } catch (error) {
    return handleError(error);
  }
});
