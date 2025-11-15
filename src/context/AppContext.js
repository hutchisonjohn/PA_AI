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
import FeatureFlagService from '../services/FeatureFlagService';
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
    const flags = FeatureFlagService.getAllFlags();
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
      const { doc, getDoc, setDoc } = await import('firebase/firestore');
      const userDocRef = doc(firestore, 'users', userId);

      // Try to check if document exists (handle offline gracefully)
      let docSnapshot = null;
      let documentExists = false;
      
      try {
        docSnapshot = await getDoc(userDocRef);
        documentExists = docSnapshot.exists();
      } catch (getDocError) {
        // Handle offline errors gracefully
        if (getDocError.code === 'unavailable' || getDocError.message?.includes('offline')) {
          LoggingService.debug('Firestore is offline, will try to create document when online');
          // Continue to set up listener - it will work when online
        } else {
          // Other errors - log but continue
          LoggingService.warn('Error checking if user document exists:', getDocError.message);
        }
      }
      
      // If document doesn't exist and we're online, create it
      if (!documentExists && docSnapshot !== null) {
        try {
          // Get user info from auth
          const { createUser } = await import('../models/User');
          const currentUser = auth?.currentUser;
          
          if (currentUser && currentUser.uid === userId) {
            const userData = createUser({
              userId: currentUser.uid,
              email: currentUser.email,
              name: currentUser.email?.split('@')[0] || 'User',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
            });
            
            try {
              await setDoc(userDocRef, userData);
              LoggingService.debug('User document created in Firestore (auto-created on login)');
            } catch (setDocError) {
              if (setDocError.code === 'unavailable' || setDocError.message?.includes('offline')) {
                LoggingService.debug('Firestore is offline, document will be created when online');
              } else {
                throw setDocError;
              }
            }
          } else {
            LoggingService.warn('Cannot create user document: auth user not available');
          }
        } catch (createError) {
          LoggingService.error('Error creating user document:', createError);
        }
      }

      // Set up real-time listener for user data
      // This will work even when offline and sync when online
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
            // Document doesn't exist - try to create it if we have auth user
            if (auth?.currentUser && auth.currentUser.uid === userId) {
              Promise.all([
                import('../models/User'),
                import('firebase/firestore')
              ]).then(([{ createUser }, { setDoc: setDocFn }]) => {
                const userData = createUser({
                  userId: auth.currentUser.uid,
                  email: auth.currentUser.email,
                  name: auth.currentUser.email?.split('@')[0] || 'User',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  lastActiveAt: new Date().toISOString(),
                });
                
                setDocFn(userDocRef, userData).catch((error) => {
                  if (error.code !== 'unavailable' && !error.message?.includes('offline')) {
                    LoggingService.error('Error creating user document from snapshot:', error);
                  }
                });
              });
            }
            setUserData(null);
          }
        },
        (error) => {
          // Handle offline errors gracefully
          if (error.code === 'unavailable' || error.message?.includes('offline')) {
            LoggingService.debug('Firestore listener offline, will sync when connection is restored');
          } else {
            LoggingService.error('Error in user data listener:', error);
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      // Handle offline errors gracefully
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        LoggingService.debug('Firestore is offline, user data will load when connection is restored');
      } else {
        LoggingService.error('Error setting up user data listener:', error);
      }
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
    const flags = FeatureFlagService.getAllFlags();
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

