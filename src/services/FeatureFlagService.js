/**
 * Feature Flag Service
 * 
 * Centralized feature flag management for enabling/disabling features
 * without code deployments. Supports MVP and V2/V3 features.
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

class FeatureFlagService {
  constructor() {
    // Get feature flags from environment (via Constants.expoConfig.extra or process.env)
    const extra = Constants.expoConfig?.extra || {};
    
    // Default flags (MVP configuration)
    this.flags = {
      // MVP features (always enabled)
      voiceInput: true,
      textChat: true,
      personalTasks: true,
      familyMessaging: true,
      calendarIntegration: true,
      shoppingLists: true,
      locationAwareness: true,
      timezoneSupport: true,
      safeTimes: true,
      pushNotifications: true,

      // V2 features (disabled in MVP)
      multipleGroups: extra.featureMultipleGroups === 'true' || process.env.FEATURE_MULTIPLE_GROUPS === 'true',
      polls: extra.featurePolls === 'true' || process.env.FEATURE_POLLS === 'true',
      privateThreads: extra.featurePrivateThreads === 'true' || process.env.FEATURE_PRIVATE_THREADS === 'true',
      automatedMessaging: extra.featureAutomatedMessaging === 'true' || process.env.FEATURE_AUTOMATED_MESSAGING === 'true',
      projectManagement: false,

      // V3 features (disabled in MVP)
      translation: extra.featureTranslation === 'true' || process.env.FEATURE_TRANSLATION === 'true',
      currencyConversion: false,
      multiCountrySupport: false,
    };

    // Load flags from storage/database if available
    this.loadFlags();
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Feature name
   * @returns {boolean}
   */
  isEnabled(featureName) {
    return this.flags[featureName] === true;
  }

  /**
   * Enable a feature
   * @param {string} featureName - Feature name
   */
  async enableFeature(featureName) {
    this.flags[featureName] = true;
    await this.saveFlags();
    await this.syncToBackend();
  }

  /**
   * Disable a feature
   * @param {string} featureName - Feature name
   */
  async disableFeature(featureName) {
    this.flags[featureName] = false;
    await this.saveFlags();
    await this.syncToBackend();
  }

  /**
   * Get all flags
   * @returns {Object}
   */
  getAllFlags() {
    return { ...this.flags };
  }

  /**
   * Update multiple flags at once
   * @param {Object} flagUpdates - Object with feature names as keys
   */
  async updateFlags(flagUpdates) {
    Object.assign(this.flags, flagUpdates);
    await this.saveFlags();
    await this.syncToBackend();
  }

  /**
   * Load flags from storage
   */
  async loadFlags() {
    try {
      const storedFlags = await SecureStore.getItemAsync('featureFlags');
      if (storedFlags) {
        const parsed = JSON.parse(storedFlags);
        this.flags = { ...this.flags, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
      // Continue with default flags
    }
  }

  /**
   * Save flags to storage
   */
  async saveFlags() {
    try {
      await SecureStore.setItemAsync('featureFlags', JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  /**
   * Sync flags to backend (Firestore)
   */
  async syncToBackend() {
    try {
      // In production, would sync to Firestore admin settings collection
      // For MVP, flags are primarily client-side
      // const { firestore } = await import('../config/firebase');
      // const { doc, setDoc } = await import('firebase/firestore');
      // if (firestore) {
      //   await setDoc(doc(firestore, 'settings', 'featureFlags'), this.flags);
      // }
    } catch (error) {
      console.warn('Failed to sync feature flags to backend:', error);
    }
  }

  /**
   * Load flags from backend (for admin control)
   */
  async loadFromBackend() {
    try {
      // In production, would load from Firestore
      // const { firestore } = await import('../config/firebase');
      // const { doc, getDoc } = await import('firebase/firestore');
      // if (firestore) {
      //   const docRef = doc(firestore, 'settings', 'featureFlags');
      //   const docSnap = await getDoc(docRef);
      //   if (docSnap.exists()) {
      //     this.flags = { ...this.flags, ...docSnap.data() };
      //   }
      // }
    } catch (error) {
      console.warn('Failed to load feature flags from backend:', error);
    }
  }
}

export default new FeatureFlagService();

