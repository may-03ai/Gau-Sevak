import { type CallableRequest } from 'firebase-functions/v2/https';
export interface MyAuthContext {
    uid: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    superAdmin: boolean;
}
export declare function getVerifiedAccountContext(request: CallableRequest<unknown>): MyAuthContext;
export declare const getMyAuthContext: import("firebase-functions/v2/https").CallableFunction<any, Promise<MyAuthContext>, unknown>;
