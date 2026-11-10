# Firebase Cloud Functions

Reserved for the TypeScript backend, organized by domain under `src/`. Firestore is the application data store, Firebase Auth provides authentication, and PostgreSQL is reserved for the financial ledger. No handlers, integrations, or business features are implemented here. The empty CommonJS entrypoint and local `firebase-functions` SDK dependency exist only so Firebase CLI can discover this Functions emulator codebase.

Node.js 22 is the project runtime baseline per V2.1 and is listed by the Firebase Functions runtime guide checked on 2026-11-10. The Node.js release schedule lists upstream EOL as 2027-04-30; plan an upgrade before then and re-verify Firebase compatibility. Do not use Node 20 or switch to another major without Firebase documentation confirming support. References: [Firebase runtime guide](https://firebase.google.com/docs/functions/manage-functions) and [Node.js release schedule](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json).

Do not deploy, provision Firebase resources, configure live payments, or add further dependencies until approved setup decisions and the V2.1 source requirements are available.
