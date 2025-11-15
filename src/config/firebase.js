/**
 * Firebase Configuration and Initialization (Expo)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, collection } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { FIREBASE_CONFIG } from '../constants/config';

// Initialize Firebase if not already initialized
let firebaseApp;
try {
  if (getApps().length === 0) {
    // Check if Firebase config is valid
    if (FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'your_firebase_api_key') {
      firebaseApp = initializeApp(FIREBASE_CONFIG);
    } else {
      console.warn('Firebase config not set. App will work but Firebase features will be disabled.');
      firebaseApp = null;
    }
  } else {
    firebaseApp = getApp();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  firebaseApp = null;
}

// Initialize Auth with AsyncStorage persistence
let firebaseAuth = null;
if (firebaseApp) {
  try {
    firebaseAuth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Auth already initialized
    try {
      firebaseAuth = getAuth(firebaseApp);
    } catch (err) {
      console.warn('Firebase Auth initialization error:', err);
    }
  }
}

// Initialize Firestore
let firestore = null;
if (firebaseApp) {
  try {
    firestore = getFirestore(firebaseApp);
    
    // Enable persistence for Firestore (offline support)
    enableIndexedDbPersistence(firestore).catch(err => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required
        console.warn('Firestore persistence not supported');
      }
    });
  } catch (error) {
    console.warn('Firestore initialization error:', error);
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

