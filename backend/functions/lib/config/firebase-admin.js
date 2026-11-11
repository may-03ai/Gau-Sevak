"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.auth = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const defaultApp = (0, app_1.getApps)().find((candidate) => candidate.name === '[DEFAULT]');
const app = defaultApp ?? (0, app_1.initializeApp)();
exports.auth = (0, auth_1.getAuth)(app);
exports.db = (0, firestore_1.getFirestore)(app);
//# sourceMappingURL=firebase-admin.js.map