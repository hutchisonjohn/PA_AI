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

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { auth, firestore } from '../config/firebase';
import FeatureFlagService from '../services/FeatureFlagService';
import LoggingService from '../services/LoggingService';
import DartmouthAPI from '../services/DartmouthAPIService';

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

  // Store Firestore listener unsubscribe function
  const firestoreUnsubscribeRef = useRef(null);

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

  // Track if we're using Dartmouth API auth (manual auth) vs Firebase auth
  const isDartmouthAuthRef = React.useRef(false);

  // Check for existing Dartmouth API token on app startup
  useEffect(() => {
    const checkDartmouthAuth = async () => {
      try {
        const token = await DartmouthAPI.getToken();
        if (token) {
          LoggingService.debug('Found existing Dartmouth token, verifying...');
          
          // Try to get profile to verify token is still valid
          try {
            const profile = await DartmouthAPI.getProfile();
            
            if (profile && profile.id) {
              LoggingService.debug('Dartmouth token is valid, restoring session');
              
              // Mark that we're using Dartmouth API auth
              isDartmouthAuthRef.current = true;
              
              // Restore user state
              setUser({
                uid: profile.id,
                email: profile.email,
              });
              
              // Restore user data
              setUserData(profile);
              
              // Set authenticated state
              setIsAuthenticated(true);
              
              // Set current group ID if available
              if (profile.defaultGroupId) {
                setCurrentGroupId(profile.defaultGroupId);
              } else if (profile.groupIds && profile.groupIds.length > 0) {
                setCurrentGroupId(profile.groupIds[0]);
              }
              
              // Update settings from user data
              if (profile.timezone) setSettings(prev => ({ ...prev, timezone: profile.timezone }));
              if (profile.currency) setSettings(prev => ({ ...prev, currency: profile.currency }));
              if (profile.locale) setSettings(prev => ({ ...prev, locale: profile.locale }));
              
              LoggingService.debug('Session restored successfully');
              setIsLoading(false);
              return; // Exit early since we restored the session
            } else {
              LoggingService.debug('Profile data invalid, clearing token');
              await DartmouthAPI.clearToken();
            }
          } catch (error) {
            // Token is invalid or expired
            LoggingService.debug('Dartmouth token verification failed:', error.message);
            await DartmouthAPI.clearToken();
          }
        }
      } catch (error) {
        LoggingService.error('Error checking Dartmouth auth:', error);
      } finally {
        // Only set loading to false if we didn't restore a session
        // If we restored a session, loading was already set to false above
        if (!isDartmouthAuthRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Always check Dartmouth auth on startup (runs in parallel with Firebase auth check)
    checkDartmouthAuth();
  }, []);

  // Listen to authentication state changes (only for Firebase auth)
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // Only handle Firebase auth changes if we're NOT using Dartmouth API auth
        // This prevents Firebase from clearing Dartmouth API auth state
        if (isDartmouthAuthRef.current && !firebaseUser) {
          // We're using Dartmouth API and Firebase has no user - don't clear state
          setIsLoading(false);
          return;
        }

        // Clean up previous Firestore listener if it exists
        if (firestoreUnsubscribeRef.current) {
          firestoreUnsubscribeRef.current();
          firestoreUnsubscribeRef.current = null;
        }

        if (firebaseUser) {
          // Firebase user logged in - clear Dartmouth API flag
          isDartmouthAuthRef.current = false;
          setUser(firebaseUser);
          setIsAuthenticated(true);
          
          // Load user data from Firestore
          const firestoreUnsubscribe = await loadUserData(firebaseUser.uid);
          if (firestoreUnsubscribe) {
            firestoreUnsubscribeRef.current = firestoreUnsubscribe;
          }
        } else if (!isDartmouthAuthRef.current) {
          // Only clear state if we're using Firebase auth (not Dartmouth API)
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

    return () => {
      unsubscribe();
      // Clean up Firestore listener on unmount
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
        firestoreUnsubscribeRef.current = null;
      }
    };
  }, [loadUserData]);

  // Load user data from Firestore
  const loadUserData = useCallback(async (userId) => {
    if (!firestore || !auth) {
      LoggingService.warn('Firestore or Auth not available, skipping user data load');
      return;
    }

    // Ensure user is authenticated and token is available
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      LoggingService.warn('User not authenticated or userId mismatch, skipping user data load');
      return;
    }

    // Wait for auth token to be available
    try {
      await currentUser.getIdToken(true); // Force token refresh to ensure it's valid
    } catch (tokenError) {
      LoggingService.error('Error getting auth token:', tokenError);
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
        // Handle permission errors specifically
        if (getDocError.code === 'permission-denied') {
          LoggingService.error('Permission denied accessing user document. Check Firestore rules.');
          return;
        }
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
              if (setDocError.code === 'permission-denied') {
                LoggingService.error('Permission denied creating user document. Check Firestore rules.');
                return;
              }
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
                  if (error.code === 'permission-denied') {
                    LoggingService.error('Permission denied creating user document. Check Firestore rules.');
                  } else if (error.code !== 'unavailable' && !error.message?.includes('offline')) {
                    LoggingService.error('Error creating user document from snapshot:', error);
                  }
                });
              });
            }
            setUserData(null);
          }
        },
        (error) => {
          // Handle permission errors specifically
          if (error.code === 'permission-denied') {
            LoggingService.error('Permission denied in user data listener. Check Firestore rules and ensure user is authenticated.');
            // Don't set up listener if permissions are denied
            return;
          }
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
      // Handle permission errors specifically
      if (error.code === 'permission-denied') {
        LoggingService.error('Permission denied setting up user data listener. Check Firestore rules.');
        return;
      }
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

  // Wrapper for setUser that marks we're using Dartmouth API
  const setUserDartmouth = React.useCallback((userData) => {
    isDartmouthAuthRef.current = true;
    setUser(userData);
  }, []);

  // Wrapper for setIsAuthenticated that marks we're using Dartmouth API
  const setIsAuthenticatedDartmouth = React.useCallback((authState) => {
    isDartmouthAuthRef.current = true;
    setIsAuthenticated(authState);
  }, []);

  const value = {
    // Auth state
    user,
    setUser: setUserDartmouth, // Use wrapper that marks Dartmouth API usage
    isAuthenticated,
    setIsAuthenticated: setIsAuthenticatedDartmouth, // Use wrapper that marks Dartmouth API usage
    isLoading,

    // User data
    userData,
    setUserData, // Expose setUserData for manual auth (Dartmouth API)
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

