process.env.GCLOUD_PROJECT = 'demo-gau-sevak';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { auth, db } = require('../lib/config/firebase-admin.js');

const projectId = 'demo-gau-sevak';
const authBase = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
const functionsBase = `http://127.0.0.1:5001/${projectId}/us-central1`;
let regularUser;
let concurrentUser;
let unverifiedUser;
let superAdminUser;
let changedEmailUser;
let legacyUser;
let concurrentEmailUser;
const profileUids = new Set();

async function createEmulatorUser(email) {
  const response = await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'LocalTestOnly!123', returnSecureToken: true }),
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

async function signIn(email) {
  const response = await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'LocalTestOnly!123', returnSecureToken: true }),
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

async function createVerifiedEmulatorUser(email) {
  const user = await createEmulatorUser(email);
  await auth.updateUser(user.localId, { emailVerified: true });
  return signIn(email);
}

async function invokeCallable(functionName, idToken, data = {}) {
  const headers = { 'content-type': 'application/json' };
  if (idToken) {
    headers.authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(`${functionsBase}/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  return { response, body: await response.json() };
}

before(async () => {
  const suffix = Date.now();
  regularUser = await createVerifiedEmulatorUser(`regular-${suffix}@example.test`);
  concurrentUser = await createVerifiedEmulatorUser(`concurrent-${suffix}@example.test`);
  unverifiedUser = await createEmulatorUser(`unverified-${suffix}@example.test`);
  superAdminUser = await createVerifiedEmulatorUser(`admin-${suffix}@example.test`);
  changedEmailUser = await createVerifiedEmulatorUser(`changed-${suffix}@example.test`);
  legacyUser = await createEmulatorUser(`legacy-${suffix}@example.test`);
  concurrentEmailUser = await createVerifiedEmulatorUser(`email-race-${suffix}@example.test`);
  await auth.setCustomUserClaims(superAdminUser.localId, { superAdmin: true });
  superAdminUser = await signIn(superAdminUser.email);
});

after(async () => {
  await Promise.all([...profileUids].map((uid) => db.collection('users').doc(uid).delete()));
  if (regularUser?.localId) {
    await auth.deleteUser(regularUser.localId);
  }
  if (concurrentUser?.localId) {
    await auth.deleteUser(concurrentUser.localId);
  }
  if (unverifiedUser?.localId) {
    await auth.deleteUser(unverifiedUser.localId);
  }
  if (superAdminUser?.localId) {
    await auth.deleteUser(superAdminUser.localId);
  }
  if (changedEmailUser?.localId) {
    await auth.deleteUser(changedEmailUser.localId);
  }
  if (legacyUser?.localId) {
    await auth.deleteUser(legacyUser.localId);
  }
  if (concurrentEmailUser?.localId) {
    await auth.deleteUser(concurrentEmailUser.localId);
  }
});

test('healthCheck returns only a generic healthy status', async () => {
  const response = await fetch(`${functionsBase}/healthCheck`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });

  const unsupportedMethod = await fetch(`${functionsBase}/healthCheck`, { method: 'POST' });
  assert.equal(unsupportedMethod.status, 405);
  assert.deepEqual(await unsupportedMethod.json(), { status: 'method_not_allowed' });
});

test('getMyAuthContext rejects unauthenticated callable requests', async () => {
  const { response, body } = await invokeCallable('getMyAuthContext', null);
  assert.equal(response.status, 401);
  assert.equal(body.error.status, 'UNAUTHENTICATED');
});

test('getMyAuthContext returns verified caller context and ignores client-supplied UID', async () => {
  const { response, body } = await invokeCallable('getMyAuthContext', regularUser.idToken, {
    uid: 'attacker-uid',
    userId: 'another-user',
  });
  assert.equal(response.status, 200);
  const result = body.result ?? body.data;
  assert.deepEqual(Object.keys(result).sort(), ['emailVerified', 'phoneVerified', 'superAdmin', 'uid']);
  assert.equal(result.uid, regularUser.localId);
  assert.equal(result.emailVerified, true);
  assert.equal(result.phoneVerified, false);
  assert.equal(result.superAdmin, false);
});

test('getMyAuthContext recognizes a Firebase Admin-set Super Admin claim', async () => {
  const { response, body } = await invokeCallable('getMyAuthContext', superAdminUser.idToken);
  assert.equal(response.status, 200);
  const result = body.result ?? body.data;
  assert.equal(result.uid, superAdminUser.localId);
  assert.equal(result.superAdmin, true);
});

test('profile callables reject unauthenticated callers', async () => {
  for (const functionName of ['provisionMyProfile', 'getMyProfile', 'updateMyProfile']) {
    const { response, body } = await invokeCallable(functionName, null, { name: 'Unauthenticated' });
    assert.equal(response.status, 401);
    assert.equal(body.error.status, 'UNAUTHENTICATED');
  }
});

test('provisionMyProfile creates and safely repeats the authenticated user profile', async () => {
  profileUids.add(regularUser.localId);
  const first = await invokeCallable('provisionMyProfile', regularUser.idToken, {
    name: '  गौ-सेवक User  ',
    locale: 'hi',
  });
  assert.equal(first.response.status, 200);
  const created = first.body.result ?? first.body.data;
  assert.equal(created.created, true);
  assert.equal(created.profile.name, 'गौ-सेवक User');
  assert.equal(created.profile.email, regularUser.email);
  assert.equal(created.profile.locale, 'hi');
  assert.deepEqual(created.profile.notificationPreferences, { campaign_update: false });
  assert.match(created.profile.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(created.profile.updatedAt, /^\d{4}-\d{2}-\d{2}T/);

  const duplicate = await invokeCallable('provisionMyProfile', regularUser.idToken, {
    name: 'Must not overwrite',
    locale: 'en',
    notificationPreferences: { campaign_update: true },
  });
  assert.equal(duplicate.response.status, 200);
  const repeated = duplicate.body.result ?? duplicate.body.data;
  assert.equal(repeated.created, false);
  assert.equal(repeated.profile.name, 'गौ-सेवक User');
  assert.equal(repeated.profile.locale, 'hi');
  assert.deepEqual(repeated.profile.notificationPreferences, { campaign_update: false });
});

test('profile retrieval is self-scoped and missing profiles return not-found', async () => {
  const own = await invokeCallable('getMyProfile', regularUser.idToken);
  assert.equal(own.response.status, 200);
  assert.equal((own.body.result ?? own.body.data).profile.email, regularUser.email);

  const missing = await invokeCallable('getMyProfile', unverifiedUser.idToken);
  assert.equal(missing.response.status, 404);
  assert.equal(missing.body.error.status, 'NOT_FOUND');
  const missingUpdate = await invokeCallable('updateMyProfile', unverifiedUser.idToken, { name: 'No profile' });
  assert.equal(missingUpdate.response.status, 404);
  assert.equal(missingUpdate.body.error.status, 'NOT_FOUND');

  const spoofed = await invokeCallable('getMyProfile', regularUser.idToken, { uid: unverifiedUser.localId });
  assert.equal(spoofed.response.status, 400);
  assert.equal(spoofed.body.error.status, 'INVALID_ARGUMENT');
});

test('getMyProfile synchronizes a newly verified Firebase Auth email', async () => {
  profileUids.add(changedEmailUser.localId);
  const initial = await invokeCallable('provisionMyProfile', changedEmailUser.idToken, {
    name: 'Email change user',
    locale: 'en',
  });
  assert.equal(initial.response.status, 200);

  const newEmail = `verified-${Date.now()}@example.test`;
  await auth.updateUser(changedEmailUser.localId, { email: newEmail, emailVerified: true });
  changedEmailUser = await signIn(newEmail);

  const fetched = await invokeCallable('getMyProfile', changedEmailUser.idToken);
  assert.equal(fetched.response.status, 200);
  const profile = (fetched.body.result ?? fetched.body.data).profile;
  assert.equal(profile.email, newEmail);
  assert.equal(profile.emailVerified, true);

  const stored = await db.collection('users').doc(changedEmailUser.localId).get();
  assert.equal(stored.data().email, newEmail);
});

test('legacy email remains hidden while unverified and is reconciled after verification', async () => {
  profileUids.add(legacyUser.localId);
  const legacyEmail = 'legacy-client-value@example.test';
  await db.collection('users').doc(legacyUser.localId).set({
    name: 'Legacy profile',
    email: legacyEmail,
    locale: 'hi',
    notificationPreferences: { campaign_update: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const fetched = await invokeCallable('getMyProfile', legacyUser.idToken);
  assert.equal(fetched.response.status, 200);
  let profile = (fetched.body.result ?? fetched.body.data).profile;
  assert.equal(profile.email, null);
  assert.equal(profile.emailVerified, false);
  assert.equal(profile.name, 'Legacy profile');
  assert.equal((await db.collection('users').doc(legacyUser.localId).get()).data().email, legacyEmail);

  const update = await invokeCallable('updateMyProfile', legacyUser.idToken, { name: 'Updated legacy profile' });
  assert.equal(update.response.status, 200);
  profile = (update.body.result ?? update.body.data).profile;
  assert.equal(profile.name, 'Updated legacy profile');
  assert.equal(profile.email, null);
  assert.equal(profile.emailVerified, false);

  await auth.updateUser(legacyUser.localId, { emailVerified: true });
  legacyUser = await signIn(legacyUser.email);
  const verified = await invokeCallable('getMyProfile', legacyUser.idToken);
  assert.equal(verified.response.status, 200);
  profile = (verified.body.result ?? verified.body.data).profile;
  assert.equal(profile.email, legacyUser.email);
  assert.equal(profile.emailVerified, true);
  assert.equal((await db.collection('users').doc(legacyUser.localId).get()).data().email, legacyUser.email);
});

test('concurrent profile retrieval and update preserve the canonical Auth email', async () => {
  profileUids.add(concurrentEmailUser.localId);
  const provisioned = await invokeCallable('provisionMyProfile', concurrentEmailUser.idToken, {
    name: 'Concurrent email user',
    locale: 'en',
  });
  assert.equal(provisioned.response.status, 200);

  const newEmail = `concurrent-verified-${Date.now()}@example.test`;
  await auth.updateUser(concurrentEmailUser.localId, { email: newEmail, emailVerified: true });
  concurrentEmailUser = await signIn(newEmail);
  const [getResult, updateResult] = await Promise.all([
    invokeCallable('getMyProfile', concurrentEmailUser.idToken),
    invokeCallable('updateMyProfile', concurrentEmailUser.idToken, { name: 'Concurrent update' }),
  ]);
  assert.equal(getResult.response.status, 200);
  assert.equal(updateResult.response.status, 200);
  for (const result of [getResult, updateResult]) {
    const profile = (result.body.result ?? result.body.data).profile;
    assert.equal(profile.email, newEmail);
    assert.equal(profile.emailVerified, true);
  }
  const stored = await db.collection('users').doc(concurrentEmailUser.localId).get();
  assert.equal(stored.data().email, newEmail);
  assert.equal(stored.data().name, 'Concurrent update');
});

test('profile updates allow only validated fields and synchronize verified Auth email', async () => {
  const update = await invokeCallable('updateMyProfile', regularUser.idToken, {
    name: 'नया नाम',
    notificationPreferences: { campaign_update: true },
  });
  assert.equal(update.response.status, 200);
  const changed = update.body.result ?? update.body.data;
  assert.equal(changed.profile.name, 'नया नाम');
  assert.deepEqual(changed.profile.notificationPreferences, { campaign_update: true });

  for (const field of [
    'uid',
    'email',
    'role',
    'accountStatus',
    'panEncrypted',
    'kycStatus',
    'totalDonated',
    'donationCount',
    'balance',
    'verificationBadge',
    'createdAt',
    'updatedAt',
    'unknownField',
  ]) {
    const rejected = await invokeCallable('updateMyProfile', regularUser.idToken, { [field]: 'forged' });
    assert.equal(rejected.response.status, 400, `${field} should be rejected`);
    assert.equal(rejected.body.error.status, 'INVALID_ARGUMENT', `${field} should be rejected`);
  }

  const empty = await invokeCallable('updateMyProfile', regularUser.idToken, {});
  assert.equal(empty.response.status, 400);

  const newEmail = `updated-${Date.now()}@example.test`;
  await auth.updateUser(regularUser.localId, { email: newEmail, emailVerified: true });
  const emailSync = await invokeCallable('updateMyProfile', regularUser.idToken, { locale: 'en' });
  assert.equal(emailSync.response.status, 200);
  assert.equal((emailSync.body.result ?? emailSync.body.data).profile.email, newEmail);
});

test('profile provisioning requires verified Auth email and rejects malformed profile input', async () => {
  const unverified = await invokeCallable('provisionMyProfile', unverifiedUser.idToken, {
    name: 'Unverified',
    locale: 'en',
  });
  assert.equal(unverified.response.status, 400);
  assert.equal(unverified.body.error.status, 'FAILED_PRECONDITION');

  const malformed = await invokeCallable('provisionMyProfile', regularUser.idToken, {
    name: 'Invalid',
    locale: 'en',
    accountStatus: 'admin',
  });
  assert.equal(malformed.response.status, 400);
  assert.equal(malformed.body.error.status, 'INVALID_ARGUMENT');

  const uidSpoof = await invokeCallable('provisionMyProfile', regularUser.idToken, {
    name: 'Invalid',
    locale: 'en',
    uid: unverifiedUser.localId,
  });
  assert.equal(uidSpoof.response.status, 400);
  assert.equal(uidSpoof.body.error.status, 'INVALID_ARGUMENT');

  const invalidLocale = await invokeCallable('provisionMyProfile', regularUser.idToken, {
    name: 'Invalid',
    locale: 'fr',
  });
  assert.equal(invalidLocale.response.status, 400);
});

test('concurrent profile provisioning is duplicate-safe', async () => {
  profileUids.add(concurrentUser.localId);
  const results = await Promise.all([
    invokeCallable('provisionMyProfile', concurrentUser.idToken, { name: 'First', locale: 'en' }),
    invokeCallable('provisionMyProfile', concurrentUser.idToken, { name: 'Second', locale: 'hi' }),
  ]);
  assert.deepEqual(results.map(({ response }) => response.status), [200, 200]);
  const bodies = results.map(({ body }) => body.result ?? body.data);
  assert.equal(bodies.filter(({ created }) => created).length, 1);
  assert.equal(bodies.filter(({ created }) => !created).length, 1);
  const stored = await db.collection('users').doc(concurrentUser.localId).get();
  assert.ok(['First', 'Second'].includes(stored.data().name));
});