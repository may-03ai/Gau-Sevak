import { HttpsError, type FunctionsErrorCode } from 'firebase-functions/v2/https';
export declare class AppError extends Error {
    readonly code: FunctionsErrorCode;
    constructor(code: FunctionsErrorCode, message: string);
}
export declare function toHttpsError(error: unknown): HttpsError;
