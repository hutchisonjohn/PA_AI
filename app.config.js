/**
 * Expo App Configuration
 */

import 'dotenv/config';

export default {
  expo: {
    name: 'McCarthy',
    slug: 'mccarthy-app',
    version: '1.0.0',
    orientation: 'portrait',
    // Temporarily disabled images to fix prebuild error
    // icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    // splash: {
    //   image: './assets/splash.png',
    //   resizeMode: 'contain',
    //   backgroundColor: '#ffffff',
    // },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mccarthy.app',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'McCarthy needs your location to provide location-based reminders and notifications.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'McCarthy needs your location to provide location-based reminders and notifications.',
        NSMicrophoneUsageDescription: 'McCarthy needs microphone access for voice interaction.',
        NSSpeechRecognitionUsageDescription: 'McCarthy needs speech recognition for voice commands.',
        NSCalendarsUsageDescription: 'McCarthy needs calendar access to manage your events.',
        NSRemindersUsageDescription: 'McCarthy needs reminders access to manage your tasks.',
      },
      ...(process.env.IOS_GOOGLE_SERVICES_FILE ? { googleServicesFile: process.env.IOS_GOOGLE_SERVICES_FILE } : {}),
    },
    android: {
      // Note: adaptiveIcon disabled due to image processing error with adaptive-icon.png
      // The app will work fine without it - Android will use the default icon
      package: 'com.mccarthy.app',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'RECORD_AUDIO',
        'READ_CALENDAR',
        'WRITE_CALENDAR',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'INTERNET',
      ],
      ...(process.env.ANDROID_GOOGLE_SERVICES_FILE ? { googleServicesFile: process.env.ANDROID_GOOGLE_SERVICES_FILE } : {}),
    },
    web: {
      // Temporarily disabled favicon to fix prebuild error
      // favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow McCarthy to use your location for location-based reminders.',
        },
      ],
      [
        'expo-calendar',
        {
          calendarPermission: 'Allow McCarthy to access your calendar for event management.',
        },
      ],
      [
        'expo-av',
        {
          microphonePermission: 'Allow McCarthy to use your microphone for voice interaction.',
        },
      ],
      './plugins/withNetworkSecurityConfig.js',
    ],
    extra: {
      // Firebase config
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      // LLM config
      llmProvider: process.env.LLM_PROVIDER,
      replicateToken: process.env.REPLICATE_API_TOKEN,
      openaiKey: process.env.OPENAI_API_KEY,
      // Messaging config
      externalMsgProvider: process.env.EXTERNAL_MSG_PROVIDER,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
      // Maps config
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      // App config
      appEnv: process.env.APP_ENV,
      apiBaseUrl: process.env.API_BASE_URL,
      // Dartmouth API config
      dartmouthApiUrl: process.env.DARTMOUTH_API_URL || 'https://dartmouth-os-worker.lucy-hunter-9411.workers.dev',
      // Feature flags
      featureMultipleGroups: process.env.FEATURE_MULTIPLE_GROUPS,
      featurePolls: process.env.FEATURE_POLLS,
      featurePrivateThreads: process.env.FEATURE_PRIVATE_THREADS,
      featureAutomatedMessaging: process.env.FEATURE_AUTOMATED_MESSAGING,
      featureTranslation: process.env.FEATURE_TRANSLATION,
      eas: {
        ...(process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : {}),
      },
    },
  },
};

