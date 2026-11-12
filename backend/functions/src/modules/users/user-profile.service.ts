import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import { AppError } from '../../core/errors/app-errors.js';
import type { NotificationPreferences, ProvisionMyProfileInput, UpdateMyProfileInput } from './user-profile.validation.js';

export interface UserProfile {
  name: string;
  email: string | null;
  emailVerified: boolean;
  locale: 'en' | 'hi';
  notificationPreferences: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
}

interface ProfileTransaction {
  get(uid: string): Promise<Record<string, unknown> | undefined>;
  create(uid: string, profile: Record<string, unknown>): void;
  update(uid: string, fields: Record<string, unknown>): void;
}

interface ProfileStore {
  runTransaction<T>(operation: (transaction: ProfileTransaction) => Promise<T>): Promise<T>;
  get(uid: string): Promise<Record<string, unknown> | undefined>;
}

interface AuthReader {
  getUser(uid: string): Promise<UserRecord>;
}

export interface UserProfileService {
  provision(uid: string, input: ProvisionMyProfileInput): Promise<{ profile: UserProfile; created: boolean }>;
  get(uid: string): Promise<UserProfile>;
  update(uid: string, input: UpdateMyProfileInput): Promise<UserProfile>;
}

function timestampToIso(value: unknown): string | undefined {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  if (
    typeof value === 'object'
    && value !== null
    && 'toDate' in value
    && typeof value.toDate === 'function'
  ) {
    const date: unknown = value.toDate();
    if (date instanceof Date && Number.isFinite(date.getTime())) {
      return date.toISOString();
    }
  }
  return undefined;
}

function toUserProfile(uid: string, data: Record<string, unknown> | undefined, email?: string): UserProfile {
  if (!data) {
    throw new AppError('not-found', 'Profile not found.');
  }

  const createdAt = timestampToIso(data.createdAt);
  const updatedAt = timestampToIso(data.updatedAt) ?? createdAt;
  const preferences = data.notificationPreferences;
  const campaignUpdate = typeof preferences === 'object'
    && preferences !== null
    && 'campaign_update' in preferences
    ? preferences.campaign_update
    : false;

  if (
    typeof uid !== 'string'
    || typeof data.name !== 'string'
    || (data.locale !== 'en' && data.locale !== 'hi')
    || typeof campaignUpdate !== 'boolean'
    || !createdAt
    || !updatedAt
  ) {
    throw new Error('Stored user profile failed validation.');
  }

  return {
    name: data.name,
    email: email ?? null,
    emailVerified: email !== undefined,
    locale: data.locale,
    notificationPreferences: { campaign_update: campaignUpdate },
    createdAt,
    updatedAt,
  };
}

function verifiedEmail(user: UserRecord): string | undefined {
  return user.emailVerified && typeof user.email === 'string' && user.email.trim().length > 0
    ? user.email.trim()
    : undefined;
}

function isAuthUserNotFound(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'auth/user-not-found';
}

async function getVerifiedEmail(authReader: AuthReader, uid: string): Promise<string | undefined> {
  try {
    return verifiedEmail(await authReader.getUser(uid));
  } catch (error) {
    if (isAuthUserNotFound(error)) {
      return undefined;
    }
    throw error;
  }
}

export function createFirestoreProfileStore(firestore: Firestore): ProfileStore {
  const profileRef = (uid: string) => firestore.collection('users').doc(uid);

  return {
    async runTransaction<T>(operation: (transaction: ProfileTransaction) => Promise<T>): Promise<T> {
      return firestore.runTransaction(async (transaction) => operation({
        async get(uid) {
          const snapshot = await transaction.get(profileRef(uid));
          return snapshot.exists ? snapshot.data() : undefined;
        },
        create(uid, profile) {
          transaction.create(profileRef(uid), profile);
        },
        update(uid, fields) {
          transaction.update(profileRef(uid), fields);
        },
      }));
    },
    async get(uid) {
      const snapshot = await profileRef(uid).get();
      return snapshot.exists ? snapshot.data() : undefined;
    },
  };
}

export function createUserProfileService(authReader: AuthReader, store: ProfileStore): UserProfileService {
  return {
    async provision(uid, input) {
      const email = await getVerifiedEmail(authReader, uid);
      const created = await store.runTransaction(async (transaction) => {
        const existing = await transaction.get(uid);
        if (existing) {
          if (email && existing.email !== email) {
            transaction.update(uid, {
              email,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          return false;
        }

        if (!email) {
          throw new AppError('failed-precondition', 'Verify an email address before creating a profile.');
        }

        transaction.create(uid, {
          name: input.name,
          email,
          locale: input.locale,
          notificationPreferences: input.notificationPreferences,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return true;
      });

      return { profile: toUserProfile(uid, await store.get(uid), email), created };
    },
    async get(uid) {
      const email = await getVerifiedEmail(authReader, uid);
      await store.runTransaction(async (transaction) => {
        const existing = await transaction.get(uid);
        if (!existing) {
          throw new AppError('not-found', 'Profile not found.');
        }
        if (email && existing.email !== email) {
          transaction.update(uid, {
            email,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });

      return toUserProfile(uid, await store.get(uid), email);
    },
    async update(uid, input) {
      const email = await getVerifiedEmail(authReader, uid);
      await store.runTransaction(async (transaction) => {
        const existing = await transaction.get(uid);
        if (!existing) {
          throw new AppError('not-found', 'Profile not found.');
        }

        const fields: Record<string, unknown> = {};
        if (input.name !== undefined && input.name !== existing.name) {
          fields.name = input.name;
        }
        if (input.locale !== undefined && input.locale !== existing.locale) {
          fields.locale = input.locale;
        }
        const storedPreferences = existing.notificationPreferences;
        const preferencesMatch = typeof storedPreferences === 'object'
          && storedPreferences !== null
          && !Array.isArray(storedPreferences)
          && Object.keys(storedPreferences).length === 1
          && 'campaign_update' in storedPreferences
          && storedPreferences.campaign_update === input.notificationPreferences?.campaign_update;
        if (input.notificationPreferences !== undefined && !preferencesMatch) {
          fields.notificationPreferences = input.notificationPreferences;
        }
        if (email && existing.email !== email) {
          fields.email = email;
        }
        if (Object.keys(fields).length > 0) {
          fields.updatedAt = FieldValue.serverTimestamp();
          transaction.update(uid, fields);
        }
      });

      return toUserProfile(uid, await store.get(uid), email);
    },
  };
}
