const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getApps } = require('firebase-admin/app');
const { Timestamp } = require('firebase-admin/firestore');
const { auth, db } = require('../lib/config/firebase-admin.js');
const {
  createActiveSuperAdminGuard,
  requireAuthenticatedUser,
} = require('../lib/core/auth/auth-guard.js');
const { AppError, toHttpsError } = require('../lib/core/errors/app-errors.js');
const { getVerifiedAccountContext } = require('../lib/modules/account/account-context.functions.js');
const {
  parseGetMyProfileInput,
  parseProvisionMyProfileInput,
  parseUpdateMyProfileInput,
} = require('../lib/modules/users/user-profile.validation.js');
const { createUserProfileService } = require('../lib/modules/users/user-profile.service.js');

function makeProfileStore(initialProfiles = {}) {
  const profiles = new Map(Object.entries(initialProfiles));
  const storedValue = (value) => value?.constructor?.name === 'ServerTimestampTransform'
    ? new Date()
    : value;

  return {
    profiles,
    async runTransaction(operation) {
      return operation({
        async get(uid) {
          const profile = profiles.get(uid);
          return profile ? { ...profile } : undefined;
        },
        create(uid, profile) {
          assert.equal(profiles.has(uid), false);
          profiles.set(uid, Object.fromEntries(
            Object.entries(profile).map(([key, value]) => [key, storedValue(value)]),
          ));
        },
        update(uid, fields) {
          const current = profiles.get(uid);
          assert.ok(current);
          profiles.set(uid, {
            ...current,
            ...Object.fromEntries(
              Object.entries(fields).map(([key, value]) => [key, storedValue(value)]),
            ),
          });
        },
      });
    },
    async get(uid) {
      const profile = profiles.get(uid);
      return profile ? { ...profile } : undefined;
    },
  };
}

function makeTimestampedProfile(overrides = {}) {
  const timestamp = new Date('2026-01-02T03:04:05.000Z');
  return {
    name: 'Existing Name',
    email: 'old@example.test',
    locale: 'hi',
    notificationPreferences: { campaign_update: true },
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function makeService(store, authUser = { email: 'verified@example.test', emailVerified: true }) {
  return createUserProfileService(
    { async getUser() { return authUser; } },
    store,
  );
}

test('Firebase Admin is initialized once and reusable Auth/Firestore clients are exported', () => {
  const defaultApps = getApps().filter((app) => app.name === '[DEFAULT]');
  assert.equal(defaultApps.length, 1);
  assert.ok(auth);
  assert.ok(db);
});

test('requireAuthenticatedUser rejects missing auth and missing UID', () => {
  assert.throws(
    () => requireAuthenticatedUser({ auth: null }),
    (error) => error.code === 'unauthenticated',
  );
  assert.throws(
    () => requireAuthenticatedUser({ auth: { uid: '', token: {} } }),
    (error) => error.code === 'unauthenticated',
  );
});

test('requireAuthenticatedUser returns the UID from verified auth, not request data', () => {
  const request = {
    data: { uid: 'attacker-uid', userId: 'other-user' },
    auth: { uid: 'verified-uid', token: { email_verified: true } },
  };

  assert.equal(requireAuthenticatedUser(request).uid, 'verified-uid');
});

test('requireActiveSuperAdmin fails closed unless claim and authorization state are valid', async () => {
  const validState = {
    enabled: true,
    updatedAt: Timestamp.now(),
    updatedBy: 'synthetic-operator',
    reasonCode: 'approved_access',
    version: 1,
  };
  const request = (claim) => ({
    auth: {
      uid: 'admin-user',
      token: claim === undefined ? {} : { superAdmin: claim },
    },
  });
  const isPermissionDenied = (error) => error.code === 'permission-denied'
    && error.message === 'Super Admin access is required.';
  let stateReadUid;
  const requireActiveSuperAdmin = createActiveSuperAdminGuard(async (uid) => {
    stateReadUid = uid;
    return validState;
  });

  await assert.rejects(
    requireActiveSuperAdmin({ auth: null }),
    (error) => error.code === 'unauthenticated',
  );
  await assert.rejects(
    requireActiveSuperAdmin({ auth: { uid: '', token: { superAdmin: true } } }),
    (error) => error.code === 'unauthenticated',
  );

  for (const claim of [undefined, false, null, 'true', 1]) {
    await assert.rejects(
      requireActiveSuperAdmin(request(claim)),
      isPermissionDenied,
    );
  }
  assert.equal(stateReadUid, undefined);

  for (const state of [
    undefined,
    { ...validState, enabled: false },
    { ...validState, enabled: 'true' },
    { ...validState, updatedAt: 'not-a-timestamp' },
    { ...validState, unexpected: true },
  ]) {
    await assert.rejects(
      createActiveSuperAdminGuard(async () => state)(request(true)),
      isPermissionDenied,
    );
  }

  await assert.rejects(
    createActiveSuperAdminGuard(async () => {
      throw new Error('private Firestore failure details');
    })(request(true)),
    (error) => isPermissionDenied(error)
      && !error.message.includes('private Firestore failure details'),
  );

  const authContext = await requireActiveSuperAdmin(request(true));
  assert.equal(authContext.uid, 'admin-user');
  assert.equal(stateReadUid, 'admin-user');
});

test('getVerifiedAccountContext returns only the caller UID and verification booleans', () => {
  const request = {
    data: { userId: 'another-user', uid: 'another-user' },
    auth: {
      uid: 'verified-user',
      token: {
        email: 'private@example.test',
        email_verified: true,
        phone_number: '+15555550123',
        superAdmin: false,
        pan: 'SHOULD_NOT_BE_RETURNED',
      },
    },
  };

  const context = getVerifiedAccountContext(request);
  assert.deepEqual(context, {
    uid: 'verified-user',
    emailVerified: true,
    phoneVerified: true,
    superAdmin: false,
  });
});

test('getVerifiedAccountContext reports missing phone verification safely', () => {
  const context = getVerifiedAccountContext({
    auth: { uid: 'verified-user', token: { email_verified: false } },
  });

  assert.equal(context.emailVerified, false);
  assert.equal(context.phoneVerified, false);
});

test('application errors map to safe HttpsError responses', () => {
  const appError = new AppError('failed-precondition', 'Account is not eligible.');
  const mapped = toHttpsError(appError);
  assert.equal(mapped.code, 'failed-precondition');
  assert.equal(mapped.message, 'Account is not eligible.');

  const unexpected = toHttpsError(new Error('contains internal details'));
  assert.equal(unexpected.code, 'internal');
  assert.equal(unexpected.message, 'An unexpected error occurred.');
});

test('profile validation supports trimmed Unicode names and accepts only en or hi', () => {
  const input = parseProvisionMyProfileInput({
    name: '  गौ-सेवक 李  ',
    locale: 'hi',
  });
  assert.equal(input.name, 'गौ-सेवक 李');
  assert.equal(input.notificationPreferences.campaign_update, false);
  assert.equal(parseUpdateMyProfileInput({ locale: 'en' }).locale, 'en');
});

test('profile validation rejects empty, overlong, and control-character names', () => {
  assert.throws(() => parseProvisionMyProfileInput({ name: '  ', locale: 'en' }), /Name must/);
  assert.throws(() => parseProvisionMyProfileInput({ name: 'x'.repeat(101), locale: 'en' }), /Name must/);
  assert.throws(() => parseProvisionMyProfileInput({ name: 'line\nbreak', locale: 'en' }), /Name must/);
  assert.doesNotThrow(() => parseProvisionMyProfileInput({ name: '😀'.repeat(100), locale: 'en' }));
  assert.throws(() => parseProvisionMyProfileInput({ name: '😀'.repeat(101), locale: 'en' }), /Name must/);
});

test('profile validation rejects unsupported locales, notification keys, and non-boolean values', () => {
  assert.throws(() => parseProvisionMyProfileInput({ name: 'User', locale: 'fr' }), /Locale must/);
  assert.deepEqual(
    parseProvisionMyProfileInput({
      name: 'User',
      locale: 'en',
      notificationPreferences: { campaign_update: true },
    }).notificationPreferences,
    { campaign_update: true },
  );
  assert.throws(
    () => parseProvisionMyProfileInput({
      name: 'User',
      locale: 'en',
      notificationPreferences: { campaign_update: 'yes' },
    }),
    /campaign_update must be a boolean/,
  );
  assert.throws(
    () => parseUpdateMyProfileInput({ notificationPreferences: { donation_receipt: true } }),
    /unsupported fields/,
  );
});

test('profile validation rejects UID, email, server fields, and all unknown fields', () => {
  for (const field of ['uid', 'email', 'role', 'accountStatus', 'panEncrypted', 'kycStatus', 'totalDonated', 'createdAt', 'updatedAt', 'extra']) {
    assert.throws(
      () => parseProvisionMyProfileInput({ name: 'User', locale: 'en', [field]: 'forged' }),
      /unsupported fields/,
    );
    assert.throws(
      () => parseUpdateMyProfileInput({ [field]: 'forged' }),
      /unsupported fields/,
    );
  }
  assert.throws(() => parseGetMyProfileInput({ uid: 'another-user' }), /does not accept/);
  assert.doesNotThrow(() => parseGetMyProfileInput({}));
  assert.throws(() => parseUpdateMyProfileInput({}), /At least one/);
});

test('profile provisioning sources email from verified Firebase Auth and controls timestamps', async () => {
  const store = makeProfileStore();
  const service = makeService(store, { email: 'canonical@example.test', emailVerified: true });

  const result = await service.provision(
    'verified-uid',
    parseProvisionMyProfileInput({ name: 'Donor', locale: 'en' }),
  );

  assert.equal(result.created, true);
  assert.equal(result.profile.email, 'canonical@example.test');
  assert.equal(result.profile.notificationPreferences.campaign_update, false);
  assert.match(result.profile.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(result.profile.createdAt, result.profile.updatedAt);
  assert.ok(store.profiles.get('verified-uid').createdAt instanceof Date);
  assert.ok(store.profiles.get('verified-uid').updatedAt instanceof Date);
});

test('profile provisioning requires a verified email only for first creation', async () => {
  const input = parseProvisionMyProfileInput({ name: 'Donor', locale: 'en' });
  const emptyStore = makeProfileStore();
  const noEmailService = makeService(emptyStore, { email: undefined, emailVerified: false });

  await assert.rejects(
    noEmailService.provision('phone-user', input),
    (error) => error.code === 'failed-precondition',
  );
  assert.equal(emptyStore.profiles.has('phone-user'), false);

  const existingStore = makeProfileStore({ 'existing-user': makeTimestampedProfile() });
  const unverifiedService = makeService(existingStore, { email: 'unverified@example.test', emailVerified: false });
  const duplicate = await unverifiedService.provision('existing-user', input);
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.profile.name, 'Existing Name');
  assert.equal(duplicate.profile.email, null);
  assert.equal(duplicate.profile.emailVerified, false);
  assert.equal(duplicate.profile.locale, 'hi');
  assert.equal(duplicate.profile.notificationPreferences.campaign_update, true);
});

test('repeated provisioning preserves existing profile fields and synchronizes only verified email', async () => {
  const store = makeProfileStore({ 'existing-user': makeTimestampedProfile() });
  const service = makeService(store, { email: 'new-verified@example.test', emailVerified: true });

  const result = await service.provision(
    'existing-user',
    parseProvisionMyProfileInput({ name: 'Replacement', locale: 'en' }),
  );

  assert.equal(result.created, false);
  assert.equal(result.profile.name, 'Existing Name');
  assert.equal(result.profile.locale, 'hi');
  assert.equal(result.profile.notificationPreferences.campaign_update, true);
  assert.equal(result.profile.email, 'new-verified@example.test');
  assert.equal(result.profile.emailVerified, true);
});

test('profile retrieval reconciles a changed verified Auth email', async () => {
  const store = makeProfileStore();
  let authUser = { email: 'initial@example.test', emailVerified: true };
  const service = createUserProfileService(
    { async getUser() { return authUser; } },
    store,
  );
  await service.provision('changing-user', parseProvisionMyProfileInput({ name: 'Donor', locale: 'en' }));
  const previousUpdatedAt = store.profiles.get('changing-user').updatedAt;

  authUser = { email: 'current@example.test', emailVerified: true };
  const profile = await service.get('changing-user');

  assert.equal(profile.email, 'current@example.test');
  assert.equal(profile.emailVerified, true);
  assert.equal(store.profiles.get('changing-user').email, 'current@example.test');
  assert.notEqual(store.profiles.get('changing-user').updatedAt, previousUpdatedAt);
});

test('unverified and legacy emails stay private until Firebase Auth verifies the current email', async () => {
  const legacyProfile = makeTimestampedProfile({ email: 'legacy-untrusted@example.test' });
  const store = makeProfileStore({ 'legacy-user': legacyProfile });
  let authUser = { email: 'pending@example.test', emailVerified: false };
  const service = createUserProfileService(
    { async getUser() { return authUser; } },
    store,
  );

  const fetched = await service.get('legacy-user');
  assert.equal(fetched.email, null);
  assert.equal(fetched.emailVerified, false);
  assert.equal(fetched.name, 'Existing Name');
  assert.equal(store.profiles.get('legacy-user').email, 'legacy-untrusted@example.test');

  const updated = await service.update(
    'legacy-user',
    parseUpdateMyProfileInput({ name: 'Updated while unverified' }),
  );
  assert.equal(updated.name, 'Updated while unverified');
  assert.equal(updated.email, null);
  assert.equal(updated.emailVerified, false);

  authUser = { email: 'pending@example.test', emailVerified: true };
  const verified = await service.get('legacy-user');
  assert.equal(verified.email, 'pending@example.test');
  assert.equal(verified.emailVerified, true);
  assert.equal(store.profiles.get('legacy-user').email, 'pending@example.test');
});

test('missing Firebase Auth users return no email without hiding an existing profile', async () => {
  const store = makeProfileStore({ 'deleted-auth-user': makeTimestampedProfile() });
  const missingAuthReader = {
    async getUser() {
      const error = new Error('Auth user not found');
      error.code = 'auth/user-not-found';
      throw error;
    },
  };
  const service = createUserProfileService(missingAuthReader, store);

  const profile = await service.get('deleted-auth-user');
  assert.equal(profile.email, null);
  assert.equal(profile.emailVerified, false);
  assert.equal(profile.name, 'Existing Name');
  assert.equal(store.profiles.get('deleted-auth-user').email, 'old@example.test');

  const noEmailStore = makeProfileStore({ 'no-email-user': makeTimestampedProfile() });
  const noEmailService = createUserProfileService(
    { async getUser() { return { email: undefined, emailVerified: false }; } },
    noEmailStore,
  );
  const noEmailProfile = await noEmailService.get('no-email-user');
  assert.equal(noEmailProfile.email, null);
  assert.equal(noEmailProfile.emailVerified, false);

  await assert.rejects(
    service.provision(
      'missing-auth-user',
      parseProvisionMyProfileInput({ name: 'Donor', locale: 'en' }),
    ),
    (error) => error.code === 'failed-precondition',
  );
});

test('profile get and update return not-found for missing records and update only allowed fields', async () => {
  const store = makeProfileStore({ 'existing-user': makeTimestampedProfile() });
  const service = makeService(store, { email: 'new-verified@example.test', emailVerified: true });

  await assert.rejects(service.get('missing-user'), (error) => error.code === 'not-found');
  await assert.rejects(
    service.update('missing-user', parseUpdateMyProfileInput({ name: 'New name' })),
    (error) => error.code === 'not-found',
  );

  const updated = await service.update(
    'existing-user',
    parseUpdateMyProfileInput({
      name: '  नवीन नाम  ',
      notificationPreferences: { campaign_update: false },
    }),
  );
  assert.equal(updated.name, 'नवीन नाम');
  assert.equal(updated.locale, 'hi');
  assert.equal(updated.email, 'new-verified@example.test');
  assert.equal(updated.notificationPreferences.campaign_update, false);
  assert.ok(Date.parse(updated.updatedAt) >= Date.parse(updated.createdAt));

  const timestampBeforeNoop = store.profiles.get('existing-user').updatedAt;
  const noop = await service.update(
    'existing-user',
    parseUpdateMyProfileInput({
      name: 'नवीन नाम',
      notificationPreferences: { campaign_update: false },
    }),
  );
  assert.equal(noop.updatedAt, timestampBeforeNoop.toISOString());
  assert.equal(store.profiles.get('existing-user').updatedAt, timestampBeforeNoop);

  const unverifiedStore = makeProfileStore({ 'unverified-user': makeTimestampedProfile() });
  const unverifiedService = makeService(unverifiedStore, {
    email: 'unverified@example.test',
    emailVerified: false,
  });
  const unverifiedUpdate = await unverifiedService.update(
    'unverified-user',
    parseUpdateMyProfileInput({ locale: 'en' }),
  );
  assert.equal(unverifiedUpdate.email, null);
  assert.equal(unverifiedUpdate.emailVerified, false);
});