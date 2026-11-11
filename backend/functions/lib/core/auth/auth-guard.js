"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuthenticatedUser = requireAuthenticatedUser;
exports.requireSuperAdmin = requireSuperAdmin;
const https_1 = require("firebase-functions/v2/https");
function requireAuthenticatedUser(request) {
    const authContext = request.auth;
    if (!authContext || typeof authContext.uid !== 'string' || authContext.uid.length === 0) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication is required.');
    }
    return authContext;
}
function requireSuperAdmin(request) {
    const authContext = requireAuthenticatedUser(request);
    if (authContext.token.superAdmin !== true) {
        throw new https_1.HttpsError('permission-denied', 'Super Admin access is required.');
    }
    return authContext;
}
//# sourceMappingURL=auth-guard.js.map