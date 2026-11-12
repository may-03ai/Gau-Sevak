import { AppError } from '../../core/errors/app-errors.js';

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

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertAllowedKeys(value: JsonObject, allowed: readonly string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) {
    throw new AppError('invalid-argument', 'The request contains unsupported fields.');
  }
}

function parseName(value: unknown): string {
  if (typeof value !== 'string') {
    throw new AppError('invalid-argument', 'Name must be a string.');
  }

  const name = value.trim();
  if (
    name.length === 0
    || Array.from(name).length > 100
    || /[\p{Cc}]/u.test(name)
  ) {
    throw new AppError('invalid-argument', 'Name must contain 1 to 100 characters and no control characters.');
  }

  return name;
}

function parseLocale(value: unknown): 'en' | 'hi' {
  if (value !== 'en' && value !== 'hi') {
    throw new AppError('invalid-argument', 'Locale must be en or hi.');
  }

  return value;
}

function parseNotificationPreferences(value: unknown): NotificationPreferences {
  if (!isObject(value)) {
    throw new AppError('invalid-argument', 'Notification preferences must be an object.');
  }

  assertAllowedKeys(value, ['campaign_update']);
  const campaignUpdate = 'campaign_update' in value ? value.campaign_update : false;
  if (typeof campaignUpdate !== 'boolean') {
    throw new AppError('invalid-argument', 'campaign_update must be a boolean.');
  }

  return { campaign_update: campaignUpdate };
}

export function parseProvisionMyProfileInput(value: unknown): ProvisionMyProfileInput {
  if (!isObject(value)) {
    throw new AppError('invalid-argument', 'A profile request object is required.');
  }

  assertAllowedKeys(value, ['name', 'locale', 'notificationPreferences']);
  if (!('name' in value) || !('locale' in value)) {
    throw new AppError('invalid-argument', 'Name and locale are required.');
  }

  return {
    name: parseName(value.name),
    locale: parseLocale(value.locale),
    notificationPreferences: value.notificationPreferences === undefined
      ? { campaign_update: false }
      : parseNotificationPreferences(value.notificationPreferences),
  };
}

export function parseGetMyProfileInput(value: unknown): void {
  if (!isObject(value) || Object.keys(value).length !== 0) {
    throw new AppError('invalid-argument', 'This operation does not accept request fields.');
  }
}

export function parseUpdateMyProfileInput(value: unknown): UpdateMyProfileInput {
  if (!isObject(value)) {
    throw new AppError('invalid-argument', 'A profile update object is required.');
  }

  assertAllowedKeys(value, ['name', 'locale', 'notificationPreferences']);
  if (Object.keys(value).length === 0) {
    throw new AppError('invalid-argument', 'At least one profile field must be provided.');
  }

  const input: UpdateMyProfileInput = {};
  if ('name' in value) {
    input.name = parseName(value.name);
  }
  if ('locale' in value) {
    input.locale = parseLocale(value.locale);
  }
  if ('notificationPreferences' in value) {
    input.notificationPreferences = parseNotificationPreferences(value.notificationPreferences);
  }

  return input;
}
