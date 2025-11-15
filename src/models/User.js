/**
 * User Model (v7 Schema)
 * 
 * v7 Changes:
 * - Removed: familyGroupId
 * - Added: groupIds[], defaultGroupId, currency, locale, defaultShoppingListId
 */

export const createUser = (userData) => {
  return {
    // Identity
    userId: userData.userId,
    email: userData.email,
    name: userData.name,
    phoneNumber: userData.phoneNumber || null,
    profilePhotoUrl: userData.profilePhotoUrl || null,

    // v7: Group membership (supports multiple groups)
    groupIds: userData.groupIds || [],
    defaultGroupId: userData.defaultGroupId || null,

    // Location & timezone
    timezone: userData.timezone || 'Australia/Sydney',
    homeAddress: userData.homeAddress || null,
    workAddress: userData.workAddress || null,

    // v7: Internationalization (for V3)
    currency: userData.currency || 'AUD',
    locale: userData.locale || 'en-AU',
    defaultShoppingListId: userData.defaultShoppingListId || null,

    // Safe times (Do Not Disturb)
    safeTimes: userData.safeTimes || {
      enabled: true,
      defaultStart: '22:00',
      defaultEnd: '07:00',
      allowUrgent: true,
      customSchedule: {},
    },

    // Notification preferences
    notificationSettings: userData.notificationSettings || {
      pushEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      taskReminders: true,
      calendarReminders: true,
      locationReminders: true,
      familyMessages: true,
      proactiveNotifications: true,
    },

    // Voice preferences
    voiceSettings: userData.voiceSettings || {
      wakeWordEnabled: true,
      wakeWord: 'Hey McCarthy',
      voiceRecognitionLanguage: 'en-AU',
      ttsVoice: 'en-AU-Wavenet-A',
      ttsSpeed: 1.0,
    },

    // Privacy settings
    privacy: userData.privacy || {
      locationSharingEnabled: true,
      activitySharingEnabled: true,
      readReceiptsEnabled: true,
      typingIndicatorEnabled: true,
    },

    // Calendar integration
    calendarIntegration: userData.calendarIntegration || {
      provider: 'google',
      connected: false,
      lastSync: null,
      syncFrequency: 15,
    },

    // Preferred stores
    preferredStores: userData.preferredStores || [],

    // AI preferences
    llmProvider: userData.llmProvider || 'llama',
    conversationStyle: userData.conversationStyle || 'friendly',

    // App settings
    theme: userData.theme || 'light',

    // Metadata
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: userData.updatedAt || new Date().toISOString(),
    lastActiveAt: userData.lastActiveAt || new Date().toISOString(),
    appVersion: userData.appVersion || '1.0.0',
  };
};

export const updateUser = (existingUser, updates) => {
  return {
    ...existingUser,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
};

