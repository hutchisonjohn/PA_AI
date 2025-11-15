/**
 * Logging Service
 * Centralized logging with different log levels
 * Can be extended to send logs to external services (Firebase Analytics, Sentry, etc.)
 */

import { Platform } from 'react-native';

class LoggingService {
  constructor() {
    this.logLevel = __DEV__ ? 'debug' : 'error'; // In production, only log errors
    this.enableConsole = __DEV__;
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message, ...args) {
    if (this.logLevel === 'debug' && this.enableConsole) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log info messages
   */
  info(message, ...args) {
    if (['debug', 'info'].includes(this.logLevel) && this.enableConsole) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warning messages
   */
  warn(message, ...args) {
    if (['debug', 'info', 'warn'].includes(this.logLevel) && this.enableConsole) {
      console.warn(`[WARN] ${message}`, ...args);
    }
    
    // In production, you might want to send warnings to analytics
    // this.sendToAnalytics('warn', message, args);
  }

  /**
   * Log error messages
   */
  error(message, error, ...args) {
    // Always log errors
    console.error(`[ERROR] ${message}`, error, ...args);
    
    // In production, send errors to error tracking service
    // this.sendToErrorTracking(message, error, args);
    
    // Optionally send to Firebase Analytics
    if (!__DEV__) {
      // import('firebase/analytics').then(({ logEvent, getAnalytics }) => {
      //   const analytics = getAnalytics();
      //   logEvent(analytics, 'error', {
      //     error_message: message,
      //     error_stack: error?.stack,
      //     platform: Platform.OS,
      //   });
      // });
    }
  }

  /**
   * Log user actions (for analytics)
   */
  logEvent(eventName, params = {}) {
    this.debug(`Event: ${eventName}`, params);
    
    // In production, send to Firebase Analytics
    // import('firebase/analytics').then(({ logEvent, getAnalytics }) => {
    //   const analytics = getAnalytics();
    //   logEvent(analytics, eventName, { ...params, platform: Platform.OS });
    // });
  }

  /**
   * Set log level
   */
  setLogLevel(level) {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (validLevels.includes(level)) {
      this.logLevel = level;
    }
  }

  /**
   * Enable/disable console logging
   */
  setConsoleEnabled(enabled) {
    this.enableConsole = enabled;
  }
}

// Export singleton instance
export default new LoggingService();

