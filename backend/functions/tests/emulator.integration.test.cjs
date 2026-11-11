process.env.GCLOUD_PROJECT = 'demo-gau-sevak';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { auth } = require('../lib/config/firebase-admin.js');

const projectId = 'demo-gau-sevak';
const authBase = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
const functionsBase = `http://127.0.0.1:5001/${projectId}/us-central1`;
let regularUser;
let superAdminUser;

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
  regularUser = await createEmulatorUser(`regular-${Date.now()}@example.test`);
  superAdminUser = await createEmulatorUser(`admin-${Date.now()}@example.test`);
  await auth.setCustomUserClaims(superAdminUser.localId, { superAdmin: true });
  superAdminUser = await signIn(superAdminUser.email);
});

after(async () => {
  if (regularUser?.localId) {
    await auth.deleteUser(regularUser.localId);
  }
  if (superAdminUser?.localId) {
    await auth.deleteUser(superAdminUser.localId);
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
  assert.equal(result.emailVerified, false);
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