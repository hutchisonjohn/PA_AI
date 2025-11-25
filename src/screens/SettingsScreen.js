/**
 * Settings Screen
 * 
 * Allows users to edit their profile:
 * - Full name (first name, last name)
 * - Phone number
 * - Timezone
 * All changes are saved to Firestore
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc } from 'firebase/firestore';

import { firestore, auth } from '../config/firebase';
import { useAppContext } from '../context/AppContext';
import TimezonePicker from '../components/TimezonePicker';
import LoggingService from '../services/LoggingService';

const SettingsScreen = () => {
  const { t } = useTranslation();
  const { userData, user } = useAppContext();

  // Parse name into first and last name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timezone, setTimezone] = useState('Australia/Sydney');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load user data when component mounts or userData changes
  useEffect(() => {
    if (userData) {
      // Parse full name into first and last name
      if (userData.name) {
        const nameParts = userData.name.trim().split(' ');
        if (nameParts.length >= 2) {
          setFirstName(nameParts.slice(0, -1).join(' '));
          setLastName(nameParts[nameParts.length - 1]);
        } else {
          setFirstName(userData.name);
          setLastName('');
        }
      }
      
      setPhoneNumber(userData.phoneNumber || '');
      setTimezone(userData.timezone || 'Australia/Sydney');
    }
  }, [userData]);

  const handleSave = async () => {
    if (!auth?.currentUser || !firestore) {
      Alert.alert('Error', 'Not authenticated or Firestore not available');
      return;
    }

    // Validate required fields
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }

    if (!timezone) {
      Alert.alert('Error', 'Please select your timezone');
      return;
    }

    setSaving(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      
      const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
      
      await updateDoc(userDocRef, {
        name: fullName,
        phoneNumber: phoneNumber.trim() || null,
        timezone: timezone,
        updatedAt: new Date().toISOString(),
      });

      LoggingService.debug('Profile updated successfully');

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      LoggingService.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        `Failed to update profile: ${error.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) {
      Alert.alert('Error', 'Firebase is not configured');
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const { signOut } = await import('firebase/auth');
              await signOut(auth);
            } catch (error) {
              LoggingService.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Settings</Text>

          {/* Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email || ''}
              editable={false}
              placeholder="Email"
            />
            <Text style={styles.helpText}>Email cannot be changed</Text>

            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone Number (Optional)"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            <Text style={styles.label}>Timezone *</Text>
            <TimezonePicker
              selectedTimezone={timezone}
              onTimezoneChange={setTimezone}
              showCurrentTime={true}
              style={styles.timezonePicker}
            />
            <Text style={styles.helpText}>
              Your timezone helps McCarthy schedule reminders and notifications at the right time.
            </Text>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  content: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    color: '#8E8E93',
  },
  title: {
    fontSize: 28,
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
    marginBottom: 20,
    color: '#000000',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#8E8E93',
  },
  helpText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: -10,
    marginBottom: 15,
  },
  timezonePicker: {
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
