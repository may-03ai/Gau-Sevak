import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const defaultApp = getApps().find((candidate) => candidate.name === '[DEFAULT]');
const app = defaultApp ?? initializeApp();

export const auth = getAuth(app);
export const db = getFirestore(app);