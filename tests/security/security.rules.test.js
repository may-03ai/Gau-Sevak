const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, before, test } = require('node:test');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const {
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore');
const { getBytes, ref, uploadBytes } = require('firebase/storage');

const projectId = 'demo-gau-sevak';
const root = path.resolve(__dirname, '../..');
const firestoreRules = fs.readFileSync(path.join(root, 'infra/firebase/firestore.rules'), 'utf8');
const storageRules = fs.readFileSync(path.join(root, 'infra/firebase/storage.rules'), 'utf8');
let testEnvironment;
let fixtureSequence = 0;

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: firestoreRules,
    },
    storage: {
      host: '127.0.0.1',
      port: 9199,
      rules: storageRules,
    },
  });
});

after(async () => {
  await testEnvironment?.cleanup();
});

function makeFixture() {
  const suffix = `${Date.now()}_${fixtureSequence++}`;
  const ids = {
    donorA: `donorA_${suffix}`,
    donorB: `donorB_${suffix}`,
    ownerA: `ownerA_${suffix}`,
    editorA: `editorA_${suffix}`,
    viewerA: `viewerA_${suffix}`,
    revokedA: `revokedA_${suffix}`,
    ownerB: `ownerB_${suffix}`,
    normalUser: `normal_${suffix}`,
    superAdmin: `super_${suffix}`,
    gaushalaA: `gaushalaA_${suffix}`,
    gaushalaB: `gaushalaB_${suffix}`,
    gaushalaRevoked: `gaushalaRevoked_${suffix}`,
  };

  return {
    ...ids,
    donationA: `donationA_${suffix}`,
    donationB: `donationB_${suffix}`,
    subscriptionA: `subscriptionA_${suffix}`,
    subscriptionB: `subscriptionB_${suffix}`,
    certificateA: `certificateA_${suffix}`,
    certificateB: `certificateB_${suffix}`,
    campaignActive: `campaignActive_${suffix}`,
    campaignDraft: `campaignDraft_${suffix}`,
    updateApproved: `updateApproved_${suffix}`,
    updatePending: `updatePending_${suffix}`,
    payoutA: `payoutA_${suffix}`,
    payoutB: `payoutB_${suffix}`,
    refundA: `refundA_${suffix}`,
    refundB: `refundB_${suffix}`,
    notificationA: `notificationA_${suffix}`,
    notificationB: `notificationB_${suffix}`,
    kycDocument: `kycDocument_${suffix}`,
    storageRoot: `test_${suffix}`,
    campaignOtherDraft: `campaignOtherDraft_${suffix}`,
  };
}

function membershipId(userId, gaushalaId) {
  return `${userId}_${gaushalaId}`;
}

async function seedFixture(ids) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const user = (name) => ({
      name,
      email: `${name}@example.test`,
      locale: 'en',
      createdAt: new Date(),
      panEncrypted: 'server-only-test-value',
      kycStatus: 'none',
      accountStatus: 'active',
      role: 'donor',
    });
    const membership = (userId, gaushalId, role, status = 'active') => ({
      userId,
      gaushalId,
      role,
      status,
      createdBy: 'trusted-test-fixture',
      createdAt: new Date(),
    });

    const records = [
      ['users', ids.donorA, user(ids.donorA)],
      ['users', ids.donorB, user(ids.donorB)],
      ['users', ids.ownerA, user(ids.ownerA)],
      ['users', ids.editorA, user(ids.editorA)],
      ['users', ids.viewerA, user(ids.viewerA)],
      ['users', ids.revokedA, user(ids.revokedA)],
      ['users', ids.ownerB, user(ids.ownerB)],
      ['users', ids.normalUser, user(ids.normalUser)],
      ['users', ids.superAdmin, user(ids.superAdmin)],
      ['gaushalas', ids.gaushalaA, { status: 'active', name: 'Test A' }],
      ['gaushalas', ids.gaushalaB, { status: 'active', name: 'Test B' }],
      ['gaushalas', ids.gaushalaRevoked, { status: 'suspended', name: 'Revoked test' }],
      ['gaushala_admins', membershipId(ids.ownerA, ids.gaushalaA), membership(ids.ownerA, ids.gaushalaA, 'owner')],
      ['gaushala_admins', membershipId(ids.editorA, ids.gaushalaA), membership(ids.editorA, ids.gaushalaA, 'editor')],
      ['gaushala_admins', membershipId(ids.viewerA, ids.gaushalaA), membership(ids.viewerA, ids.gaushalaA, 'viewer')],
      ['gaushala_admins', membershipId(ids.revokedA, ids.gaushalaRevoked), membership(ids.revokedA, ids.gaushalaRevoked, 'owner', 'revoked')],
      ['gaushala_admins', membershipId(ids.ownerB, ids.gaushalaB), membership(ids.ownerB, ids.gaushalaB, 'owner')],
      ['donations', ids.donationA, { userId: ids.donorA, gaushalId: ids.gaushalaA, status: 'captured', amountPaise: 10000 }],
      ['donations', ids.donationB, { userId: ids.donorB, gaushalId: ids.gaushalaB, status: 'captured', amountPaise: 20000 }],
      ['subscriptions', ids.subscriptionA, { userId: ids.donorA, gaushalId: ids.gaushalaA, status: 'active' }],
      ['subscriptions', ids.subscriptionB, { userId: ids.donorB, gaushalId: ids.gaushalaB, status: 'active' }],
      ['tax_certificates', ids.certificateA, { userId: ids.donorA, gaushalId: ids.gaushalaA }],
      ['tax_certificates', ids.certificateB, { userId: ids.donorB, gaushalId: ids.gaushalaB }],
      ['campaigns', ids.campaignActive, { gaushalId: ids.gaushalaA, status: 'active' }],
      ['campaigns', ids.campaignDraft, { gaushalId: ids.gaushalaA, status: 'draft' }],
      ['campaigns', ids.campaignOtherDraft, { gaushalId: ids.gaushalaB, status: 'draft' }],
      ['updates', ids.updateApproved, { gaushalId: ids.gaushalaA, status: 'approved' }],
      ['updates', ids.updatePending, { gaushalId: ids.gaushalaA, status: 'pending_moderation' }],
      ['payouts', ids.payoutA, { gaushalId: ids.gaushalaA, amountPaise: 10000 }],
      ['payouts', ids.payoutB, { gaushalId: ids.gaushalaB, amountPaise: 20000 }],
      ['refund_requests', ids.refundA, { requestedBy: ids.donorA, donationId: ids.donationA, status: 'pending' }],
      ['refund_requests', ids.refundB, { requestedBy: ids.donorB, donationId: ids.donationB, status: 'pending' }],
      ['notifications', ids.notificationA, { userId: ids.donorA, read: false, title: 'Private A' }],
      ['notifications', ids.notificationB, { userId: ids.donorB, read: false, title: 'Private B' }],
      ['gaushala_sensitive', ids.gaushalaA, { bankAccountNumber: 'synthetic-only' }],
      ['gaushala_kyc_documents', ids.kycDocument, { gaushalId: ids.gaushalaA, fileUrl: 'synthetic-only' }],
      ['audit_log', `audit_${ids.donorA}`, { actorId: ids.donorA, action: 'TEST' }],
      ['webhook_events', `event_${ids.donorA}`, { eventType: 'test' }],
      ['platform_config', 'test', { maintenanceModeEnabled: false }],
    ];

    await Promise.all(records.map(([collectionName, documentId, data]) =>
      setDoc(doc(db, collectionName, documentId), data)));
  });
}

function firestoreFor(uid, claims) {
  return claims
    ? testEnvironment.authenticatedContext(uid, claims).firestore()
    : testEnvironment.authenticatedContext(uid).firestore();
}

function storageFor(uid, claims) {
  return claims
    ? testEnvironment.authenticatedContext(uid, claims).storage()
    : testEnvironment.authenticatedContext(uid).storage();
}

function stagingPath(ids, gaushalaId = ids.gaushalaA, uploaderUid = ids.editorA) {
  return `staging/gaushalas/${gaushalaId}/${uploaderUid}/${ids.storageRoot}.png`;
}

async function seedStorageObject(objectPath, bytes, metadata) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(), objectPath), bytes, metadata);
  });
}

test('unauthenticated users cannot read private user, donation, or certificate records', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(getDoc(doc(db, 'users', ids.donorA)));
  await assertFails(getDoc(doc(db, 'donations', ids.donationA)));
  await assertFails(getDoc(doc(db, 'tax_certificates', ids.certificateA)));
});

test('public users can read active Gaushalas but not suspended Gaushalas', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = testEnvironment.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(db, 'gaushalas', ids.gaushalaA)));
  await assertFails(getDoc(doc(db, 'gaushalas', ids.gaushalaRevoked)));
});

test('public users can read active campaigns and approved updates only', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = testEnvironment.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(db, 'campaigns', ids.campaignActive)));
  await assertFails(getDoc(doc(db, 'campaigns', ids.campaignDraft)));
  await assertSucceeds(getDoc(doc(db, 'updates', ids.updateApproved)));
  await assertFails(getDoc(doc(db, 'updates', ids.updatePending)));
});

test('donors read only their own profile and cannot change sensitive fields', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.donorA);

  await assertSucceeds(getDoc(doc(db, 'users', ids.donorA)));
  await assertFails(getDoc(doc(db, 'users', ids.donorB)));
  await assertSucceeds(updateDoc(doc(db, 'users', ids.donorA), { name: 'Updated donor' }));
  await assertFails(updateDoc(doc(db, 'users', ids.donorA), { panEncrypted: 'forged' }));
  await assertFails(updateDoc(doc(db, 'users', ids.donorA), { kycStatus: 'approved' }));
  await assertFails(updateDoc(doc(db, 'users', ids.donorA), { role: 'superAdmin' }));
  await assertFails(updateDoc(doc(db, 'users', ids.donorA), { superAdmin: true }));
});

test('users can create only allowlisted profile fields', async () => {
  const ids = makeFixture();
  const allowedDb = firestoreFor(ids.donorA);
  const deniedDb = firestoreFor(ids.donorB);

  await assertSucceeds(setDoc(doc(allowedDb, 'users', ids.donorA), {
    name: 'Synthetic donor',
    email: 'synthetic@example.test',
    locale: 'en',
    createdAt: serverTimestamp(),
  }));
  await assertFails(setDoc(doc(deniedDb, 'users', ids.donorB), {
    name: 'Synthetic donor',
    email: 'synthetic@example.test',
    locale: 'en',
    createdAt: serverTimestamp(),
    role: 'owner',
  }));
});

test('donors cannot create or modify donations or payment status', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.donorA);

  await assertSucceeds(getDoc(doc(db, 'donations', ids.donationA)));
  await assertFails(getDoc(doc(db, 'donations', ids.donationB)));
  await assertFails(updateDoc(doc(db, 'donations', ids.donationA), { status: 'captured' }));
  await assertFails(setDoc(doc(db, 'donations', `forged_${ids.storageRoot}`), {
    userId: ids.donorA,
    gaushalId: ids.gaushalaA,
    status: 'captured',
    amountPaise: 1,
  }));
});

test('donors read only their own subscriptions and ownership-constrained donation queries', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.donorA);

  await assertSucceeds(getDoc(doc(db, 'subscriptions', ids.subscriptionA)));
  await assertFails(getDoc(doc(db, 'subscriptions', ids.subscriptionB)));
  const ownDonations = await assertSucceeds(getDocs(query(
    collection(db, 'donations'),
    where('userId', '==', ids.donorA),
  )));
  assert.equal(ownDonations.size, 1);
  await assertFails(getDocs(collection(db, 'donations')));
});

test('donors can read only their own certificates', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.donorA);

  await assertSucceeds(getDoc(doc(db, 'tax_certificates', ids.certificateA)));
  await assertFails(getDoc(doc(db, 'tax_certificates', ids.certificateB)));
  await assertFails(updateDoc(doc(db, 'tax_certificates', ids.certificateA), { pdfUrl: 'forged' }));
});

test('users can read only their own membership and cannot forge memberships', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.ownerA);

  await assertSucceeds(getDoc(doc(db, 'gaushala_admins', membershipId(ids.ownerA, ids.gaushalaA))));
  await assertFails(getDoc(doc(db, 'gaushala_admins', membershipId(ids.ownerB, ids.gaushalaB))));
  await assertFails(setDoc(doc(db, 'gaushala_admins', membershipId(ids.donorA, ids.gaushalaA)), {
    userId: ids.donorA,
    gaushalId: ids.gaushalaA,
    role: 'owner',
    status: 'active',
    createdBy: ids.donorA,
    createdAt: serverTimestamp(),
  }));
});

test('active Owner reads assigned Gaushala information and payouts only', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.ownerA);

  await assertSucceeds(getDoc(doc(db, 'gaushalas', ids.gaushalaA)));
  await assertSucceeds(getDoc(doc(db, 'gaushalas', ids.gaushalaB)));
  await assertSucceeds(getDoc(doc(db, 'payouts', ids.payoutA)));
  await assertFails(getDoc(doc(db, 'payouts', ids.payoutB)));
});

test('Owner and Editor can create only pending updates for their assigned Gaushala', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const updateId = `new_${ids.storageRoot}`;
  const update = {
    gaushalId: ids.gaushalaA,
    authorId: ids.editorA,
    title: 'Synthetic update',
    description: 'Synthetic test content',
    imageUrls: [],
    videoUrl: null,
    cowsTagged: 0,
    status: 'pending_moderation',
    createdAt: serverTimestamp(),
  };
  const editorDb = firestoreFor(ids.editorA);

  await assertSucceeds(setDoc(doc(editorDb, 'updates', updateId), update));
  await assertFails(updateDoc(doc(editorDb, 'updates', updateId), { status: 'approved' }));
  await assertFails(setDoc(doc(editorDb, 'updates', `wrong_status_${ids.storageRoot}`), {
    ...update,
    status: 'approved',
  }));

  const ownerUpdate = {
    ...update,
    authorId: ids.ownerA,
  };
  await assertSucceeds(setDoc(doc(firestoreFor(ids.ownerA), 'updates', `owner_${ids.storageRoot}`), ownerUpdate));
});

test('Viewer is read-only and cannot create Gaushala updates or access payouts', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.viewerA);
  const update = {
    gaushalId: ids.gaushalaA,
    authorId: ids.viewerA,
    title: 'Viewer attempt',
    description: 'Must fail',
    imageUrls: [],
    videoUrl: null,
    cowsTagged: 0,
    status: 'pending_moderation',
    createdAt: serverTimestamp(),
  };

  await assertSucceeds(getDoc(doc(db, 'gaushalas', ids.gaushalaA)));
  await assertFails(setDoc(doc(db, 'updates', `viewer_${ids.storageRoot}`), update));
  await assertFails(getDoc(doc(db, 'payouts', ids.payoutA)));
});

test('Editor cannot access payouts or cross-tenant admin data; active profiles remain public', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.editorA);

  await assertSucceeds(getDoc(doc(db, 'campaigns', ids.campaignActive)));
  await assertSucceeds(getDoc(doc(db, 'campaigns', ids.campaignDraft)));
  await assertFails(getDoc(doc(db, 'payouts', ids.payoutA)));
  await assertSucceeds(getDoc(doc(db, 'gaushalas', ids.gaushalaB)));
  await assertFails(getDoc(doc(db, 'campaigns', ids.campaignOtherDraft)));
  await assertFails(getDoc(doc(db, 'gaushala_admins', membershipId(ids.ownerB, ids.gaushalaB))));
  await assertFails(getDoc(doc(db, 'donations', ids.donationA)));
});

test('revoked membership does not grant Gaushala access', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.revokedA);

  await assertFails(getDoc(doc(db, 'gaushalas', ids.gaushalaRevoked)));
  await assertFails(getDoc(doc(db, 'payouts', ids.payoutA)));
});

test('Super Admin custom claim grants Gaushala reads but not direct sensitive access', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const superDb = firestoreFor(ids.superAdmin, { superAdmin: true });
  const normalDb = firestoreFor(ids.normalUser);

  await assertSucceeds(getDoc(doc(superDb, 'gaushalas', ids.gaushalaRevoked)));
  await assertFails(getDoc(doc(normalDb, 'gaushalas', ids.gaushalaRevoked)));
  await assertFails(updateDoc(doc(firestoreFor(ids.normalUser, { superAdmin: false }), 'users', ids.normalUser), { superAdmin: true }));
  await assertFails(updateDoc(doc(normalDb, 'users', ids.normalUser), { role: 'superAdmin' }));
});

test('sensitive and administrative collections deny direct client access even to Super Admin claims', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.superAdmin, { superAdmin: true });
  const privateRecords = [
    ['gaushala_sensitive', ids.gaushalaA],
    ['gaushala_kyc_documents', ids.kycDocument],
    ['audit_log', `audit_${ids.donorA}`],
    ['webhook_events', `event_${ids.donorA}`],
    ['platform_config', 'test'],
  ];

  for (const [collectionName, documentId] of privateRecords) {
    await assertFails(getDoc(doc(db, collectionName, documentId)), `${collectionName} direct read`);
    await assertFails(updateDoc(doc(db, collectionName, documentId), { altered: true }), `${collectionName} direct write`);
  }
});

test('refund requests are donor-readable but all client writes are denied', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.donorA);

  await assertSucceeds(getDoc(doc(db, 'refund_requests', ids.refundA)));
  await assertFails(getDoc(doc(db, 'refund_requests', ids.refundB)));
  await assertFails(setDoc(doc(db, 'refund_requests', `new_${ids.storageRoot}`), {
    requestedBy: ids.donorA,
    donationId: ids.donationA,
    status: 'pending',
  }));
  await assertFails(updateDoc(doc(db, 'refund_requests', ids.refundA), { status: 'approved' }));
});

test('users can update only the read flag on their notifications', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const db = firestoreFor(ids.donorA);

  await assertSucceeds(getDoc(doc(db, 'notifications', ids.notificationA)));
  await assertFails(getDoc(doc(db, 'notifications', ids.notificationB)));
  await assertSucceeds(updateDoc(doc(db, 'notifications', ids.notificationA), { read: true }));
  await assertFails(updateDoc(doc(db, 'notifications', ids.notificationA), { title: 'Changed' }));
  await assertFails(setDoc(doc(db, 'notifications', `new_${ids.storageRoot}`), { userId: ids.donorA, read: false }));
});

test('unlisted collections remain denied by default', async () => {
  const ids = makeFixture();
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'unlisted_private_records', ids.storageRoot), { value: 'synthetic' });
  });
  const db = firestoreFor(ids.donorA);

  await assertFails(getDoc(doc(db, 'unlisted_private_records', ids.storageRoot)));
  await assertFails(setDoc(doc(db, 'unlisted_private_records', `new_${ids.storageRoot}`), { value: 'forged' }));
});

test('Storage serves only published approved public media', async () => {
  const ids = makeFixture();
  const approvedPath = `public/gaushalas/${ids.gaushalaA}/${ids.storageRoot}_approved.png`;
  const pendingPath = `public/gaushalas/${ids.gaushalaA}/${ids.storageRoot}_pending.png`;
  await seedStorageObject(approvedPath, new Uint8Array([1, 2, 3]), {
    contentType: 'image/png',
    customMetadata: { moderationStatus: 'approved', publicationStatus: 'published' },
  });
  await seedStorageObject(pendingPath, new Uint8Array([4, 5, 6]), {
    contentType: 'image/png',
    customMetadata: { moderationStatus: 'pending', publicationStatus: 'published' },
  });
  const publicStorage = testEnvironment.unauthenticatedContext().storage();

  await assertSucceeds(getBytes(ref(publicStorage, approvedPath)));
  await assertFails(getBytes(ref(publicStorage, pendingPath)));
  await assertFails(uploadBytes(ref(publicStorage, `public/gaushalas/${ids.gaushalaA}/${ids.storageRoot}_forged.png`), new Uint8Array([7]), { contentType: 'image/png' }));
});

test('Storage certificates and exports are private to the matching donor', async () => {
  const ids = makeFixture();
  const certificateA = `private/certificates/${ids.donorA}/${ids.storageRoot}.pdf`;
  const exportA = `private/exports/${ids.donorA}/${ids.storageRoot}.json`;
  await seedStorageObject(certificateA, new Uint8Array([1, 2]), { contentType: 'application/pdf' });
  await seedStorageObject(exportA, new Uint8Array([3, 4]), { contentType: 'application/json' });

  await assertSucceeds(getBytes(ref(storageFor(ids.donorA), certificateA)));
  await assertFails(getBytes(ref(storageFor(ids.donorB), certificateA)));
  await assertSucceeds(getBytes(ref(storageFor(ids.donorA), exportA)));
  await assertFails(getBytes(ref(testEnvironment.unauthenticatedContext().storage(), exportA)));
  await assertFails(uploadBytes(ref(storageFor(ids.donorA), `private/certificates/${ids.donorA}/forged.pdf`), new Uint8Array([5]), { contentType: 'application/pdf' }));
});

test('Storage KYC paths deny direct client access, including authorized admins', async () => {
  const ids = makeFixture();
  const kycPath = `private/kyc/${ids.gaushalaA}/${ids.storageRoot}.pdf`;
  await seedStorageObject(kycPath, new Uint8Array([1, 2]), { contentType: 'application/pdf' });

  await assertFails(getBytes(ref(testEnvironment.unauthenticatedContext().storage(), kycPath)));
  await assertFails(getBytes(ref(storageFor(ids.ownerA), kycPath)));
  await assertFails(uploadBytes(ref(storageFor(ids.ownerA), kycPath), new Uint8Array([3]), { contentType: 'application/pdf' }));
});

test('Storage staging uploads require active Owner/Editor membership, matching UID, type, and size', async () => {
  const ids = makeFixture();
  await seedFixture(ids);
  const bytes = new Uint8Array([1, 2, 3]);
  const editorPath = stagingPath(ids);

  await assertSucceeds(uploadBytes(ref(storageFor(ids.editorA), editorPath), bytes, { contentType: 'image/png' }));
  await assertFails(getBytes(ref(storageFor(ids.editorA), editorPath)));
  await assertFails(uploadBytes(ref(storageFor(ids.viewerA), stagingPath(ids, ids.gaushalaA, ids.viewerA)), bytes, { contentType: 'image/png' }));
  await assertFails(uploadBytes(ref(storageFor(ids.editorA), stagingPath(ids, ids.gaushalaB, ids.editorA)), bytes, { contentType: 'image/png' }));
  await assertFails(uploadBytes(ref(storageFor(ids.editorA), stagingPath(ids, ids.gaushalaA, ids.ownerA)), bytes, { contentType: 'image/png' }));
  await assertFails(uploadBytes(ref(storageFor(ids.editorA), `staging/gaushalas/${ids.gaushalaA}/${ids.editorA}/${ids.storageRoot}.pdf`), bytes, { contentType: 'application/pdf' }));
  await assertFails(uploadBytes(ref(storageFor(ids.editorA), `staging/gaushalas/${ids.gaushalaA}/${ids.editorA}/${ids.storageRoot}.large.png`), new Uint8Array(10 * 1024 * 1024 + 1), { contentType: 'image/png' }));
  await assertFails(uploadBytes(ref(storageFor(ids.revokedA), stagingPath(ids, ids.gaushalaRevoked, ids.revokedA)), bytes, { contentType: 'image/png' }));
});
