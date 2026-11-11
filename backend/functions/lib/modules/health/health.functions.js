"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.healthCheck = (0, https_1.onRequest)((_request, response) => {
    if (_request.method !== 'GET') {
        response.set('Allow', 'GET');
        response.status(405).json({ status: 'method_not_allowed' });
        return;
    }
    response.status(200).json({ status: 'ok' });
});
//# sourceMappingURL=health.functions.js.map