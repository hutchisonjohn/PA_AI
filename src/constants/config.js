/**
 * App Configuration Constants
 */

export const APP_CONFIG = {
  name: 'McCarthy',
  version: '1.0.0',
  environment: process.env.APP_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'https://us-central1-your-project.cloudfunctions.net',
};

export const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

export const LLM_CONFIG = {
  provider: process.env.LLM_PROVIDER || 'llama',
  replicateToken: process.env.REPLICATE_API_TOKEN,
  openaiKey: process.env.OPENAI_API_KEY,
};

export const MESSAGING_CONFIG = {
  provider: process.env.EXTERNAL_MSG_PROVIDER || 'native',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
};

export const MAPS_CONFIG = {
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
};

export const DEFAULT_USER_SETTINGS = {
  timezone: 'Australia/Sydney',
  currency: 'AUD',
  locale: 'en-AU',
  safeTimes: {
    enabled: true,
    start: '22:00',
    end: '07:00',
    allowUrgent: true,
  },
  notificationSettings: {
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    taskReminders: true,
    calendarReminders: true,
    locationReminders: true,
    familyMessages: true,
    proactiveNotifications: true,
  },
};

export const DEFAULT_GROUP_SETTINGS = {
  allowMemberInvites: true,
  requireApprovalForJoin: false,
  allowPolls: false,
  allowPrivateThreads: false,
  allowTaskAssignment: true,
  allowProjectManagement: false,
  messageDeletionPolicy: 'sender_only',
  taskVisibility: 'all',
};

