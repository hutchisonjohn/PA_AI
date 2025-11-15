/**
 * App Context - Global State Management
 * 
 * Manages global app state including:
 * - User authentication state
 * - Current user data
 * - Selected group
 * - Feature flags
 * - App settings
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { auth, firestore } from '../config/firebase';
import { FeatureFlagService } from '../services/FeatureFlagService';
import LoggingService from '../services/LoggingService';

const AppContext = createContext(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // User data
  const [userData, setUserData] = useState(null);
  const [currentGroupId, setCurrentGroupId] = useState(null);

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState({});

  // App settings
  const [settings, setSettings] = useState({
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    locale: 'en-AU',
  });

  // Initialize feature flags
  useEffect(() => {
    const flags = FeatureFlagService.getFeatureFlags();
    setFeatureFlags(flags);
    LoggingService.debug('Feature flags loaded:', flags);
  }, []);

  // Listen to authentication state changes
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsAuthenticated(true);
          
          // Load user data from Firestore
          await loadUserData(firebaseUser.uid);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setUserData(null);
          setCurrentGroupId(null);
        }
      } catch (error) {
        LoggingService.error('Error in auth state change:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load user data from Firestore
  const loadUserData = useCallback(async (userId) => {
    if (!firestore) {
      LoggingService.warn('Firestore not available, skipping user data load');
      return;
    }

    try {
      const { doc: firestoreDoc } = await import('firebase/firestore');
      const userDocRef = firestoreDoc(firestore, 'users', userId);

      // Set up real-time listener for user data
      const unsubscribe = onSnapshot(
        userDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserData(data);
            
            // Set current group ID (default or first group)
            if (data.defaultGroupId) {
              setCurrentGroupId(data.defaultGroupId);
            } else if (data.groupIds && data.groupIds.length > 0) {
              setCurrentGroupId(data.groupIds[0]);
            }

            // Update settings from user data
            if (data.timezone) setSettings(prev => ({ ...prev, timezone: data.timezone }));
            if (data.currency) setSettings(prev => ({ ...prev, currency: data.currency }));
            if (data.locale) setSettings(prev => ({ ...prev, locale: data.locale }));

            LoggingService.debug('User data loaded:', data);
          } else {
            LoggingService.warn('User document does not exist');
            setUserData(null);
          }
        },
        (error) => {
          LoggingService.error('Error loading user data:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      LoggingService.error('Error setting up user data listener:', error);
    }
  }, []);

  // Update current group
  const updateCurrentGroup = useCallback((groupId) => {
    setCurrentGroupId(groupId);
    LoggingService.debug('Current group updated:', groupId);
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    LoggingService.debug('Settings updated:', newSettings);
  }, []);

  // Refresh feature flags
  const refreshFeatureFlags = useCallback(() => {
    const flags = FeatureFlagService.getFeatureFlags();
    setFeatureFlags(flags);
    LoggingService.debug('Feature flags refreshed:', flags);
  }, []);

  const value = {
    // Auth state
    user,
    isAuthenticated,
    isLoading,

    // User data
    userData,
    currentGroupId,
    updateCurrentGroup,

    // Feature flags
    featureFlags,
    refreshFeatureFlags,

    // Settings
    settings,
    updateSettings,

    // Helper methods
    isFeatureEnabled: (featureName) => featureFlags[featureName] || false,
    getCurrentGroup: () => {
      // This would typically fetch from Firestore
      // For now, return the groupId
      return currentGroupId;
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

