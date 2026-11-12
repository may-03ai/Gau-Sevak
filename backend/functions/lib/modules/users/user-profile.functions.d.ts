export declare const provisionMyProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    profile: import("./user-profile.service.js").UserProfile;
    created: boolean;
}>, unknown>;
export declare const getMyProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    profile: import("./user-profile.service.js").UserProfile;
}>, unknown>;
export declare const updateMyProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    profile: import("./user-profile.service.js").UserProfile;
}>, unknown>;
