/**
 * Firebase Configuration and Initialization (Expo)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache, memoryLocalCache, collection } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { FIREBASE_CONFIG } from '../constants/config';

// Validate Firebase config
const isFirebaseConfigValid = () => {
  if (!FIREBASE_CONFIG) {
    console.warn('FIREBASE_CONFIG is undefined');
    return false;
  }

  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !FIREBASE_CONFIG[field] || FIREBASE_CONFIG[field] === `your_${field}`);

  if (missingFields.length > 0) {
    console.warn('Firebase config missing required fields:', missingFields);
    console.warn('Current config:', {
      apiKey: FIREBASE_CONFIG.apiKey ? '***' + FIREBASE_CONFIG.apiKey.slice(-4) : 'missing',
      authDomain: FIREBASE_CONFIG.authDomain || 'missing',
      projectId: FIREBASE_CONFIG.projectId || 'missing',
      storageBucket: FIREBASE_CONFIG.storageBucket || 'missing',
      messagingSenderId: FIREBASE_CONFIG.messagingSenderId || 'missing',
      appId: FIREBASE_CONFIG.appId || 'missing',
    });
    return false;
  }

  return true;
};

// Initialize Firebase if not already initialized
let firebaseApp;
try {
  if (getApps().length === 0) {
    // Check if Firebase config is valid
    if (isFirebaseConfigValid()) {
      firebaseApp = initializeApp(FIREBASE_CONFIG);
      console.log('Firebase initialized successfully');
    } else {
      console.warn('Firebase config not set or invalid. App will work but Firebase features will be disabled.');
      firebaseApp = null;
    }
  } else {
    firebaseApp = getApp();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  firebaseApp = null;
}

// Initialize Auth with persistence for React Native
// IMPORTANT: We must use initializeAuth with persistence FIRST, before getAuth()
// If we call getAuth() first, it initializes Auth without persistence
let firebaseAuth = null;
if (firebaseApp) {
  try {
    // For React Native (iOS/Android), use initializeAuth with persistence
    if (Constants.platform?.ios || Constants.platform?.android) {
      try {
        // Try to initialize with persistence first
        firebaseAuth = initializeAuth(firebaseApp, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
        console.log('Firebase Auth initialized successfully (with React Native persistence)');
      } catch (initError) {
        // If Auth is already initialized, get the existing instance
        if (initError.code === 'auth/already-initialized') {
          firebaseAuth = getAuth(firebaseApp);
          console.log('Firebase Auth already initialized, using existing instance');
        } else {
          throw initError;
        }
      }
    } else {
      // For web, use getAuth directly (web has its own persistence)
      firebaseAuth = getAuth(firebaseApp);
      console.log('Firebase Auth initialized successfully (web)');
    }
    
    // Verify auth is properly configured
    if (firebaseAuth) {
      console.log('Auth app project ID:', firebaseAuth.app.options.projectId);
      console.log('Auth domain:', firebaseAuth.app.options.authDomain);
      
      // Set up token refresh listener to track session activity
      firebaseAuth.onIdTokenChanged((user) => {
        if (user) {
          // Token refreshed - user is still authenticated
          user.getIdTokenResult().then((tokenResult) => {
            const expirationTime = new Date(tokenResult.expirationTime);
            const now = new Date();
            const expiresIn = Math.floor((expirationTime - now) / 1000 / 60); // minutes
            console.log(`Auth token expires in ${expiresIn} minutes (at ${expirationTime.toLocaleString()})`);
          });
        }
      });
    }
  } catch (error) {
    console.error('Firebase Auth initialization error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    firebaseAuth = null;
  }
} else {
  console.warn('Firebase App not initialized, Auth cannot be initialized');
}

// Initialize Firestore with appropriate cache for platform
// For React Native: use memoryLocalCache (IndexedDB not available)
// For Web: use persistentLocalCache (IndexedDB available)
let firestore = null;
if (firebaseApp) {
  try {
    // Check if we're on web or React Native
    if (Constants.platform?.web) {
      // Web platform: use persistent cache with IndexedDB
      try {
        firestore = initializeFirestore(firebaseApp, {
          localCache: persistentLocalCache(),
        });
        console.log('Firestore initialized with persistent cache (web)');
      } catch (error) {
        // If already initialized, get existing instance
        if (error.code === 'failed-precondition') {
          firestore = getFirestore(firebaseApp);
          console.log('Firestore already initialized, using existing instance');
        } else {
          throw error;
        }
      }
    } else {
      // React Native (iOS/Android): use memory cache
      // IndexedDB is not available in React Native, so persistent cache won't work
      try {
        firestore = initializeFirestore(firebaseApp, {
          localCache: memoryLocalCache(),
        });
        console.log('Firestore initialized with memory cache (React Native)');
      } catch (error) {
        // If already initialized, get existing instance
        if (error.code === 'failed-precondition') {
          firestore = getFirestore(firebaseApp);
          console.log('Firestore already initialized, using existing instance');
        } else {
          // Fallback to default (which will use memory cache)
          firestore = getFirestore(firebaseApp);
          console.log('Firestore initialized with default cache');
        }
      }
    }
  } catch (error) {
    console.warn('Firestore initialization error:', error);
    // Fallback to default initialization
    try {
      firestore = getFirestore(firebaseApp);
      console.log('Firestore initialized with default settings');
    } catch (err) {
      console.error('Failed to initialize Firestore:', err);
    }
  }
}

// Initialize Storage
let storage = null;
if (firebaseApp) {
  try {
    storage = getStorage(firebaseApp);
  } catch (error) {
    console.warn('Firebase Storage initialization error:', error);
  }
}

// Initialize Messaging (for web only in Expo, use expo-notifications for native)
let firebaseMessaging = null;
if (Constants.platform?.web) {
  try {
    firebaseMessaging = getMessaging(firebaseApp);
  } catch (error) {
    console.warn('Firebase Messaging not available:', error);
  }
}

// Initialize Analytics (web only)
let firebaseAnalytics = null;
if (Constants.platform?.web) {
  try {
    firebaseAnalytics = getAnalytics(firebaseApp);
  } catch (error) {
    console.warn('Firebase Analytics not available:', error);
  }
}

// Firestore collections helper (using Firestore v9+ syntax)
export const collections = {
  users: () => firestore ? collection(firestore, 'users') : null,
  groups: () => firestore ? collection(firestore, 'groups') : null,
  messages: () => firestore ? collection(firestore, 'messages') : null,
  tasks: () => firestore ? collection(firestore, 'tasks') : null,
  shoppingLists: () => firestore ? collection(firestore, 'shoppingLists') : null,
  calendarEvents: () => firestore ? collection(firestore, 'calendarEvents') : null,
  notifications: () => firestore ? collection(firestore, 'notifications') : null,
};

// Export Firebase services
export const app = firebaseApp;
export const auth = firebaseAuth;
export const messaging = firebaseMessaging;
export const analytics = firebaseAnalytics;
export { firestore, storage };
export default firebaseApp;

