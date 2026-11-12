"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyProfile = exports.getMyProfile = exports.provisionMyProfile = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_js_1 = require("../../config/firebase-admin.js");
const auth_guard_js_1 = require("../../core/auth/auth-guard.js");
const app_errors_js_1 = require("../../core/errors/app-errors.js");
const logger_js_1 = require("../../core/logging/logger.js");
const user_profile_validation_js_1 = require("./user-profile.validation.js");
const user_profile_service_js_1 = require("./user-profile.service.js");
const userProfileService = (0, user_profile_service_js_1.createUserProfileService)({ getUser: (uid) => firebase_admin_js_1.auth.getUser(uid) }, (0, user_profile_service_js_1.createFirestoreProfileStore)(firebase_admin_js_1.db));
function handleError(error) {
    if (!(error instanceof app_errors_js_1.AppError) && !(error instanceof https_1.HttpsError)) {
        (0, logger_js_1.logError)('user_profile.callable_failed');
    }
    throw (0, app_errors_js_1.toHttpsError)(error);
}
exports.provisionMyProfile = (0, https_1.onCall)(async (request) => {
    try {
        const { uid } = (0, auth_guard_js_1.requireAuthenticatedUser)(request);
        const input = (0, user_profile_validation_js_1.parseProvisionMyProfileInput)(request.data);
        return await userProfileService.provision(uid, input);
    }
    catch (error) {
        return handleError(error);
    }
});
exports.getMyProfile = (0, https_1.onCall)(async (request) => {
    try {
        const { uid } = (0, auth_guard_js_1.requireAuthenticatedUser)(request);
        (0, user_profile_validation_js_1.parseGetMyProfileInput)(request.data);
        return { profile: await userProfileService.get(uid) };
    }
    catch (error) {
        return handleError(error);
    }
});
exports.updateMyProfile = (0, https_1.onCall)(async (request) => {
    try {
        const { uid } = (0, auth_guard_js_1.requireAuthenticatedUser)(request);
        const input = (0, user_profile_validation_js_1.parseUpdateMyProfileInput)(request.data);
        return { profile: await userProfileService.update(uid, input) };
    }
    catch (error) {
        return handleError(error);
    }
});
//# sourceMappingURL=user-profile.functions.js.map