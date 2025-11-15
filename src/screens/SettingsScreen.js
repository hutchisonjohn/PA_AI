/**
 * Settings Screen
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
// Import Firebase auth with error handling
let auth = null;
try {
  const firebase = require('../config/firebase');
  auth = firebase.auth;
} catch (error) {
  console.warn('Firebase Auth not available:', error);
}

const SettingsScreen = () => {
  const { t } = useTranslation();

  const handleLogout = async () => {
    if (!auth) {
      Alert.alert('Error', 'Firebase is not configured');
      return;
    }
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.settings')}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
        <Text style={styles.sectionItem}>{t('settings.timezone')}</Text>
        <Text style={styles.sectionItem}>{t('settings.safe_times')}</Text>
        <Text style={styles.sectionItem}>{t('settings.notifications')}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{t('settings.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000000',
  },
  sectionItem: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 10,
    paddingVertical: 5,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;

