/**
 * McCarthy App - Main Entry Point (Expo)
 */

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, Platform, View, Text, StyleSheet } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AppNavigator from './navigation/AppNavigator';
import ErrorBoundary from './utils/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import LoggingService from './services/LoggingService';

// Import i18n configuration with error handling
let i18nLoaded = false;
try {
  require('./i18n/config');
  i18nLoaded = true;
} catch (error) {
  LoggingService.warn('i18n initialization error:', error);
}

// Import Firebase (with error handling)
let analytics = null;
try {
  const firebase = require('./config/firebase');
  analytics = firebase.analytics;
} catch (error) {
  LoggingService.warn('Firebase initialization error:', error);
  // App will work without Firebase for now
}

const App = () => {
  useEffect(() => {
    // Log app launch with Firebase Analytics (web only in Expo)
    if (analytics) {
      import('firebase/analytics')
        .then(({ logEvent }) => {
          logEvent(analytics, 'app_launched', {
            platform: Platform.OS,
            timestamp: new Date().toISOString(),
          });
        })
        .catch(error => {
          LoggingService.warn('Analytics error:', error);
        });
    }
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <ExpoStatusBar style="auto" />
            <StatusBar
              barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
              backgroundColor={Platform.OS === 'android' ? '#000000' : undefined}
            />
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </AppProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default App;
