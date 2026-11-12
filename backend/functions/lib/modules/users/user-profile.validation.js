"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseProvisionMyProfileInput = parseProvisionMyProfileInput;
exports.parseGetMyProfileInput = parseGetMyProfileInput;
exports.parseUpdateMyProfileInput = parseUpdateMyProfileInput;
const app_errors_js_1 = require("../../core/errors/app-errors.js");
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function assertAllowedKeys(value, allowed) {
    if (Object.keys(value).some((key) => !allowed.includes(key))) {
        throw new app_errors_js_1.AppError('invalid-argument', 'The request contains unsupported fields.');
    }
}
function parseName(value) {
    if (typeof value !== 'string') {
        throw new app_errors_js_1.AppError('invalid-argument', 'Name must be a string.');
    }
    const name = value.trim();
    if (name.length === 0
        || Array.from(name).length > 100
        || /[\p{Cc}]/u.test(name)) {
        throw new app_errors_js_1.AppError('invalid-argument', 'Name must contain 1 to 100 characters and no control characters.');
    }
    return name;
}
function parseLocale(value) {
    if (value !== 'en' && value !== 'hi') {
        throw new app_errors_js_1.AppError('invalid-argument', 'Locale must be en or hi.');
    }
    return value;
}
function parseNotificationPreferences(value) {
    if (!isObject(value)) {
        throw new app_errors_js_1.AppError('invalid-argument', 'Notification preferences must be an object.');
    }
    assertAllowedKeys(value, ['campaign_update']);
    const campaignUpdate = 'campaign_update' in value ? value.campaign_update : false;
    if (typeof campaignUpdate !== 'boolean') {
        throw new app_errors_js_1.AppError('invalid-argument', 'campaign_update must be a boolean.');
    }
    return { campaign_update: campaignUpdate };
}
function parseProvisionMyProfileInput(value) {
    if (!isObject(value)) {
        throw new app_errors_js_1.AppError('invalid-argument', 'A profile request object is required.');
    }
    assertAllowedKeys(value, ['name', 'locale', 'notificationPreferences']);
    if (!('name' in value) || !('locale' in value)) {
        throw new app_errors_js_1.AppError('invalid-argument', 'Name and locale are required.');
    }
    return {
        name: parseName(value.name),
        locale: parseLocale(value.locale),
        notificationPreferences: value.notificationPreferences === undefined
            ? { campaign_update: false }
            : parseNotificationPreferences(value.notificationPreferences),
    };
}
function parseGetMyProfileInput(value) {
    if (!isObject(value) || Object.keys(value).length !== 0) {
        throw new app_errors_js_1.AppError('invalid-argument', 'This operation does not accept request fields.');
    }
}
function parseUpdateMyProfileInput(value) {
    if (!isObject(value)) {
        throw new app_errors_js_1.AppError('invalid-argument', 'A profile update object is required.');
    }
    assertAllowedKeys(value, ['name', 'locale', 'notificationPreferences']);
    if (Object.keys(value).length === 0) {
        throw new app_errors_js_1.AppError('invalid-argument', 'At least one profile field must be provided.');
    }
    const input = {};
    if ('name' in value) {
        input.name = parseName(value.name);
    }
    if ('locale' in value) {
        input.locale = parseLocale(value.locale);
    }
    if ('notificationPreferences' in value) {
        input.notificationPreferences = parseNotificationPreferences(value.notificationPreferences);
    }
    return input;
}
//# sourceMappingURL=user-profile.validation.js.map