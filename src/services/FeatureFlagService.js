/**
 * Feature Flag Service
 * 
 * Centralized feature flag management for enabling/disabling features
 * without code deployments. Supports MVP and V2/V3 features.
 */

class FeatureFlagService {
  constructor() {
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
      multipleGroups: process.env.FEATURE_MULTIPLE_GROUPS === 'true',
      polls: process.env.FEATURE_POLLS === 'true',
      privateThreads: process.env.FEATURE_PRIVATE_THREADS === 'true',
      automatedMessaging: process.env.FEATURE_AUTOMATED_MESSAGING === 'true',
      projectManagement: false,

      // V3 features (disabled in MVP)
      translation: process.env.FEATURE_TRANSLATION === 'true',
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
      const EncryptedStorage = require('react-native-encrypted-storage').default;
      const storedFlags = await EncryptedStorage.getItem('featureFlags');
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
      const EncryptedStorage = require('react-native-encrypted-storage').default;
      await EncryptedStorage.setItem('featureFlags', JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  /**
   * Sync flags to backend (Firestore)
   */
  async syncToBackend() {
    try {
      const firestore = require('@react-native-firebase/firestore').default();
      // In production, would sync to Firestore admin settings collection
      // For MVP, flags are primarily client-side
      // await firestore.collection('settings').doc('featureFlags').set(this.flags);
    } catch (error) {
      console.warn('Failed to sync feature flags to backend:', error);
    }
  }

  /**
   * Load flags from backend (for admin control)
   */
  async loadFromBackend() {
    try {
      const firestore = require('@react-native-firebase/firestore').default();
      // In production, would load from Firestore
      // const doc = await firestore.collection('settings').doc('featureFlags').get();
      // if (doc.exists) {
      //   this.flags = { ...this.flags, ...doc.data() };
      // }
    } catch (error) {
      console.warn('Failed to load feature flags from backend:', error);
    }
  }
}

export default new FeatureFlagService();

