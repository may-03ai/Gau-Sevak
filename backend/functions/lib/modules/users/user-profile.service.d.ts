import { type Firestore } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import type { NotificationPreferences, ProvisionMyProfileInput, UpdateMyProfileInput } from './user-profile.validation.js';
export interface UserProfile {
    name: string;
    email: string | null;
    emailVerified: boolean;
    locale: 'en' | 'hi';
    notificationPreferences: NotificationPreferences;
    createdAt: string;
    updatedAt: string;
}
interface ProfileTransaction {
    get(uid: string): Promise<Record<string, unknown> | undefined>;
    create(uid: string, profile: Record<string, unknown>): void;
    update(uid: string, fields: Record<string, unknown>): void;
}
interface ProfileStore {
    runTransaction<T>(operation: (transaction: ProfileTransaction) => Promise<T>): Promise<T>;
    get(uid: string): Promise<Record<string, unknown> | undefined>;
}
interface AuthReader {
    getUser(uid: string): Promise<UserRecord>;
}
export interface UserProfileService {
    provision(uid: string, input: ProvisionMyProfileInput): Promise<{
        profile: UserProfile;
        created: boolean;
    }>;
    get(uid: string): Promise<UserProfile>;
    update(uid: string, input: UpdateMyProfileInput): Promise<UserProfile>;
}
export declare function createFirestoreProfileStore(firestore: Firestore): ProfileStore;
export declare function createUserProfileService(authReader: AuthReader, store: ProfileStore): UserProfileService;
export {};
