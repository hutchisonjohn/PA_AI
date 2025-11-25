/**
 * Authentication Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// Import Firebase auth with error handling
let auth = null;
try {
  const firebase = require('../config/firebase');
  auth = firebase.auth;
} catch (error) {
  console.warn('Firebase Auth not available:', error);
}

const AuthScreen = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), 'Please enter email and password');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return;
    }

    setLoading(true);

    if (!auth) {
      Alert.alert(
        t('common.error'),
        'Firebase Auth is not configured. Please:\n1. Check your .env file has all Firebase config values\n2. Restart the Expo server (npm start)\n3. Ensure Firebase Auth is enabled in Firebase Console'
      );
      setLoading(false);
      return;
    }

    // Debug: Log auth instance info
    console.log('Auth instance:', auth);
    console.log('Auth app:', auth?.app?.options?.projectId);

    try {
      // Use Firebase SDK v9+ syntax
      if (isLogin) {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        console.log('Attempting to sign in...');
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        console.log('Attempting to create user...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create basic user document in Firestore with minimal info
        // User can complete profile in Settings later
        try {
          const { firestore } = await import('../config/firebase');
          const { doc, setDoc } = await import('firebase/firestore');
          const { createUser } = await import('../models/User');
          
          if (firestore && userCredential.user) {
            const userData = createUser({
              userId: userCredential.user.uid,
              email: userCredential.user.email,
              name: userCredential.user.email?.split('@')[0] || 'User', // Default name from email
              phoneNumber: null,
              timezone: 'Australia/Sydney', // Default timezone
              currency: 'AUD',
              locale: 'en-AU',
              groupIds: [],
              defaultGroupId: null,
              defaultShoppingListId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
            });
            
            const userDocRef = doc(firestore, 'users', userCredential.user.uid);
            await setDoc(userDocRef, userData);
            console.log('User document created in Firestore');
          }
        } catch (firestoreError) {
          console.error('Error creating user document in Firestore:', firestoreError);
          // Don't fail the signup if Firestore creation fails
        }
      }
    } catch (error) {
      let errorMessage = error.message || 'Authentication failed';
      
      // Provide more helpful error messages
      if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase Authentication is not enabled in Firebase Console.\n\nTo fix this:\n1. Go to https://console.firebase.google.com/\n2. Select your project: mccarthy-pa-agent\n3. Click "Authentication" in the left menu\n4. Click "Get started" (if shown)\n5. Go to "Sign-in method" tab\n6. Click "Email/Password"\n7. Enable "Email/Password" (toggle ON)\n8. Click "Save"\n9. Restart the app';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      }
      
      Alert.alert(t('common.error'), errorMessage);
      console.error('Auth error:', error.code, error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.title}>McCarthy</Text>
          <Text style={styles.subtitle}>
            {isLogin ? t('auth.login') : t('auth.signup')}
          </Text>

          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder={t('auth.confirm_password')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? t('common.loading')
                : isLogin
                  ? t('auth.login')
                  : t('auth.create_account')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? t('auth.dont_have_account')
                : t('auth.already_have_account')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#000000',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#8E8E93',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default AuthScreen;

