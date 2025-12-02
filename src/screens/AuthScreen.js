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

// Import Dartmouth API Service
import DartmouthAPI from '../services/DartmouthAPIService';
import { useAppContext } from '../context/AppContext';

const AuthScreen = () => {
  const { t } = useTranslation();
  const { setUser, setUserData, setIsAuthenticated } = useAppContext();
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

    try {
      let result;
      
      if (isLogin) {
        // Login
        console.log('Attempting to login via Dartmouth API...');
        result = await DartmouthAPI.login(email, password);
      } else {
        // Register
        console.log('Attempting to register via Dartmouth API...');
        const name = email.split('@')[0]; // Default name from email
        result = await DartmouthAPI.register(email, password, name, null, 'Australia/Sydney');
      }

      // Set user in context
      if (result.user && result.token) {
        // Set user for auth state
        setUser({
          uid: result.user.id,
          email: result.user.email,
        });
        
        // Set user data
        setUserData(result.user);
        
        // Set authenticated state
        setIsAuthenticated(true);
        
        console.log('Authentication successful');
      }
    } catch (error) {
      let errorMessage = error.message || 'Authentication failed';
      
      // Provide more helpful error messages
      if (errorMessage.includes('already registered') || errorMessage.includes('Email already')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (errorMessage.includes('Password must be')) {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (errorMessage.includes('Invalid email')) {
        errorMessage = 'Invalid email address.';
      } else if (errorMessage.includes('Invalid credentials') || errorMessage.includes('user-not-found')) {
        errorMessage = 'No account found with this email.';
      } else if (errorMessage.includes('wrong-password') || errorMessage.includes('Invalid credentials')) {
        errorMessage = 'Incorrect password.';
      }
      
      Alert.alert(t('common.error'), errorMessage);
      console.error('Auth error:', error.message);
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

