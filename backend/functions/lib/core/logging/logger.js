"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInfo = logInfo;
exports.logWarning = logWarning;
exports.logError = logError;
const logger_1 = require("firebase-functions/logger");
function logInfo(event) {
    logger_1.logger.info(event);
}
function logWarning(event) {
    logger_1.logger.warn(event);
}
function logError(event) {
    logger_1.logger.error(event);
}
//# sourceMappingURL=logger.js.map