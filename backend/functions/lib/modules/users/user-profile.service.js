"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFirestoreProfileStore = createFirestoreProfileStore;
exports.createUserProfileService = createUserProfileService;
const firestore_1 = require("firebase-admin/firestore");
const app_errors_js_1 = require("../../core/errors/app-errors.js");
function timestampToIso(value) {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
        return value.toISOString();
    }
    if (typeof value === 'object'
        && value !== null
        && 'toDate' in value
        && typeof value.toDate === 'function') {
        const date = value.toDate();
        if (date instanceof Date && Number.isFinite(date.getTime())) {
            return date.toISOString();
        }
    }
    return undefined;
}
function toUserProfile(uid, data, email) {
    if (!data) {
        throw new app_errors_js_1.AppError('not-found', 'Profile not found.');
    }
    const createdAt = timestampToIso(data.createdAt);
    const updatedAt = timestampToIso(data.updatedAt) ?? createdAt;
    const preferences = data.notificationPreferences;
    const campaignUpdate = typeof preferences === 'object'
        && preferences !== null
        && 'campaign_update' in preferences
        ? preferences.campaign_update
        : false;
    if (typeof uid !== 'string'
        || typeof data.name !== 'string'
        || (data.locale !== 'en' && data.locale !== 'hi')
        || typeof campaignUpdate !== 'boolean'
        || !createdAt
        || !updatedAt) {
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
function verifiedEmail(user) {
    return user.emailVerified && typeof user.email === 'string' && user.email.trim().length > 0
        ? user.email.trim()
        : undefined;
}
function isAuthUserNotFound(error) {
    return typeof error === 'object'
        && error !== null
        && 'code' in error
        && error.code === 'auth/user-not-found';
}
async function getVerifiedEmail(authReader, uid) {
    try {
        return verifiedEmail(await authReader.getUser(uid));
    }
    catch (error) {
        if (isAuthUserNotFound(error)) {
            return undefined;
        }
        throw error;
    }
}
function createFirestoreProfileStore(firestore) {
    const profileRef = (uid) => firestore.collection('users').doc(uid);
    return {
        async runTransaction(operation) {
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
function createUserProfileService(authReader, store) {
    return {
        async provision(uid, input) {
            const email = await getVerifiedEmail(authReader, uid);
            const created = await store.runTransaction(async (transaction) => {
                const existing = await transaction.get(uid);
                if (existing) {
                    if (email && existing.email !== email) {
                        transaction.update(uid, {
                            email,
                            updatedAt: firestore_1.FieldValue.serverTimestamp(),
                        });
                    }
                    return false;
                }
                if (!email) {
                    throw new app_errors_js_1.AppError('failed-precondition', 'Verify an email address before creating a profile.');
                }
                transaction.create(uid, {
                    name: input.name,
                    email,
                    locale: input.locale,
                    notificationPreferences: input.notificationPreferences,
                    createdAt: firestore_1.FieldValue.serverTimestamp(),
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
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
                    throw new app_errors_js_1.AppError('not-found', 'Profile not found.');
                }
                if (email && existing.email !== email) {
                    transaction.update(uid, {
                        email,
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
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
                    throw new app_errors_js_1.AppError('not-found', 'Profile not found.');
                }
                const fields = {};
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
                    fields.updatedAt = firestore_1.FieldValue.serverTimestamp();
                    transaction.update(uid, fields);
                }
            });
            return toUserProfile(uid, await store.get(uid), email);
        },
    };
}
//# sourceMappingURL=user-profile.service.js.map