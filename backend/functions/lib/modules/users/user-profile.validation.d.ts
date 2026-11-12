export interface NotificationPreferences {
    campaign_update: boolean;
}
export interface ProvisionMyProfileInput {
    name: string;
    locale: 'en' | 'hi';
    notificationPreferences: NotificationPreferences;
}
export interface UpdateMyProfileInput {
    name?: string;
    locale?: 'en' | 'hi';
    notificationPreferences?: NotificationPreferences;
}
export declare function parseProvisionMyProfileInput(value: unknown): ProvisionMyProfileInput;
export declare function parseGetMyProfileInput(value: unknown): void;
export declare function parseUpdateMyProfileInput(value: unknown): UpdateMyProfileInput;
