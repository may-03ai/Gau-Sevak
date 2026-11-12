"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveSuperAdmin = void 0;
exports.requireAuthenticatedUser = requireAuthenticatedUser;
exports.createActiveSuperAdminGuard = createActiveSuperAdminGuard;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const firebase_admin_js_1 = require("../../config/firebase-admin.js");
const logger_js_1 = require("../logging/logger.js");
const superAdminAccessStateKeys = [
    'enabled',
    'updatedAt',
    'updatedBy',
    'reasonCode',
    'version',
];
const readSuperAdminAccessState = async (uid) => {
    const snapshot = await firebase_admin_js_1.db.collection('super_admin_access').doc(uid).get();
    return snapshot.exists ? snapshot.data() : undefined;
};
function isActiveSuperAdminState(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false;
    }
    const state = value;
    const keys = Object.keys(state);
    return keys.length === superAdminAccessStateKeys.length
        && superAdminAccessStateKeys.every((key) => keys.includes(key))
        && state.enabled === true
        && state.updatedAt instanceof firestore_1.Timestamp
        && typeof state.updatedBy === 'string'
        && state.updatedBy.length > 0
        && typeof state.reasonCode === 'string'
        && state.reasonCode.length > 0
        && typeof state.version === 'number'
        && Number.isSafeInteger(state.version)
        && state.version > 0;
}
function permissionDenied() {
    return new https_1.HttpsError('permission-denied', 'Super Admin access is required.');
}
function requireAuthenticatedUser(request) {
    const authContext = request.auth;
    if (!authContext || typeof authContext.uid !== 'string' || authContext.uid.length === 0) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication is required.');
    }
    return authContext;
}
function createActiveSuperAdminGuard(readState) {
    return async function requireActiveSuperAdmin(request) {
        const authContext = requireAuthenticatedUser(request);
        if (authContext.token.superAdmin !== true) {
            throw permissionDenied();
        }
        let state;
        try {
            state = await readState(authContext.uid);
        }
        catch {
            (0, logger_js_1.logWarning)('super_admin_authorization_state_read_failed');
            throw permissionDenied();
        }
        if (!isActiveSuperAdminState(state)) {
            throw permissionDenied();
        }
        return authContext;
    };
}
exports.requireActiveSuperAdmin = createActiveSuperAdminGuard(readSuperAdminAccessState);
//# sourceMappingURL=auth-guard.js.map