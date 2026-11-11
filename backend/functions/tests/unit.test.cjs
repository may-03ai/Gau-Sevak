const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getApps } = require('firebase-admin/app');
const { auth, db } = require('../lib/config/firebase-admin.js');
const {
  requireAuthenticatedUser,
  requireSuperAdmin,
} = require('../lib/core/auth/auth-guard.js');
const { AppError, toHttpsError } = require('../lib/core/errors/app-errors.js');
const { getVerifiedAccountContext } = require('../lib/modules/account/account-context.functions.js');

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

test('requireSuperAdmin requires the verified boolean custom claim', () => {
  assert.throws(
    () => requireSuperAdmin({ auth: { uid: 'regular-user', token: { superAdmin: false } } }),
    (error) => error.code === 'permission-denied',
  );

  const authContext = requireSuperAdmin({
    auth: { uid: 'admin-user', token: { superAdmin: true } },
  });
  assert.equal(authContext.uid, 'admin-user');
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