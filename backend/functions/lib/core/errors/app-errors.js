"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.toHttpsError = toHttpsError;
const https_1 = require("firebase-functions/v2/https");
class AppError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function toHttpsError(error) {
    if (error instanceof https_1.HttpsError) {
        return error;
    }
    if (error instanceof AppError) {
        return new https_1.HttpsError(error.code, error.message);
    }
    return new https_1.HttpsError('internal', 'An unexpected error occurred.');
}
//# sourceMappingURL=app-errors.js.map