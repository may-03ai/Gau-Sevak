"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyAuthContext = void 0;
exports.getVerifiedAccountContext = getVerifiedAccountContext;
const https_1 = require("firebase-functions/v2/https");
const auth_guard_js_1 = require("../../core/auth/auth-guard.js");
function getVerifiedAccountContext(request) {
    const authContext = (0, auth_guard_js_1.requireAuthenticatedUser)(request);
    const phoneNumber = authContext.token.phone_number;
    return {
        uid: authContext.uid,
        emailVerified: authContext.token.email_verified === true,
        phoneVerified: typeof phoneNumber === 'string' && phoneNumber.length > 0,
        superAdmin: authContext.token.superAdmin === true,
    };
}
exports.getMyAuthContext = (0, https_1.onCall)((request) => getVerifiedAccountContext(request));
//# sourceMappingURL=account-context.functions.js.map