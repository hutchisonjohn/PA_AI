/**
 * Wake Word Service
 * 
 * Detects wake word "Hey McCarthy" using openWakeWord library
 * Falls back to alternative if openWakeWord is not available
 */

import { Platform, AppState } from 'react-native';
import { Audio } from 'expo-av';
import LoggingService from './LoggingService';

class WakeWordService {
  constructor() {
    this.isEnabled = false;
    this.isListening = false;
    this.wakeWordCallback = null;
    this.wakeWord = 'Hey McCarthy';
    this.wakeWordLibrary = null;
    this.appStateSubscription = null;
    this.initialized = false; // Track if we've already logged the initialization message
  }

  /**
   * Initialize wake word detection
   * @param {Function} onWakeWordDetected - Callback when wake word is detected
   * @returns {Promise<boolean>}
   */
  async initialize(onWakeWordDetected) {
    if (!onWakeWordDetected) {
      throw new Error('Wake word callback is required');
    }

    this.wakeWordCallback = onWakeWordDetected;

    try {
      // Try to load openWakeWord library
      // Note: openWakeWord may need to be installed separately
      // For now, we'll provide a structure that can be extended
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Check if openWakeWord is available
        try {
          // This would be: const openWakeWord = require('openWakeWord');
          // For now, we'll create a placeholder that can be extended
          // Only log once to avoid spam
          if (!this.initialized) {
            LoggingService.info('Wake word service initialized (placeholder - openWakeWord library not installed)');
            LoggingService.debug('To enable wake word detection, install openWakeWord library. See WEEK_2_TASKS.md for instructions.');
            this.initialized = true;
          }
          
          // Return true to indicate service is "ready" (even if not fully functional)
          // In production, this would actually initialize the library
          return true;
        } catch (error) {
          LoggingService.warn('openWakeWord not available, using fallback:', error);
          // Fallback: Manual activation button (for testing)
          return true;
        }
      } else {
        LoggingService.warn('Wake word detection only available on iOS and Android');
        return false;
      }
    } catch (error) {
      LoggingService.error('Error initializing wake word service:', error);
      return false;
    }
  }

  /**
   * Start listening for wake word
   * @returns {Promise<boolean>}
   */
  async startListening() {
    if (this.isListening) {
      LoggingService.debug('Wake word service already listening');
      return true;
    }

    try {
      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        LoggingService.error('Microphone permission denied for wake word');
        return false;
      }

      this.isListening = true;
      LoggingService.debug('Wake word service started listening');

      // Set up app state listener to pause/resume
      this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          // Pause wake word detection when app goes to background
          // (Some libraries support background, but for MVP we'll pause)
          LoggingService.debug('App backgrounded, wake word paused');
        } else if (nextAppState === 'active') {
          // Resume when app comes to foreground
          LoggingService.debug('App foregrounded, wake word resumed');
        }
      });

      // In production, this would start the actual wake word detection
      // For now, this is a placeholder
      // TODO: Integrate openWakeWord library when installed
      
      return true;
    } catch (error) {
      LoggingService.error('Error starting wake word detection:', error);
      this.isListening = false;
      return false;
    }
  }

  /**
   * Stop listening for wake word
   */
  async stopListening() {
    if (!this.isListening) return;

    this.isListening = false;
    LoggingService.debug('Wake word service stopped listening');

    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Stop wake word detection library
    // TODO: Implement when library is integrated
  }

  /**
   * Enable/disable wake word detection
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    if (enabled && !this.isListening) {
      this.startListening();
    } else if (!enabled && this.isListening) {
      this.stopListening();
    }
  }

  /**
   * Check if wake word detection is enabled
   * @returns {boolean}
   */
  isWakeWordEnabled() {
    return this.isEnabled && this.isListening;
  }

  /**
   * Manually trigger wake word (for testing)
   */
  triggerWakeWord() {
    if (this.wakeWordCallback) {
      LoggingService.debug('Wake word manually triggered');
      this.wakeWordCallback();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopListening();
    this.wakeWordCallback = null;
  }
}

export default new WakeWordService();

