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
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '../context/AppContext';
import TimezonePicker from '../components/TimezonePicker';
import LoggingService from '../services/LoggingService';
import DartmouthAPI from '../services/DartmouthAPIService';

const SettingsScreen = () => {
  const { t } = useTranslation();
  const { userData, user, setUser, setUserData, setIsAuthenticated } = useAppContext();

  // Parse name into first and last name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timezone, setTimezone] = useState('Australia/Sydney');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
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
      setWakeWordEnabled(userData.voiceSettings?.wakeWordEnabled !== false); // Default to true if not set
    }
  }, [userData]);

  const handleSave = async () => {
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
      
      // Update profile via Dartmouth API
      // Note: wakeWordEnabled is NOT saved here - it's handled separately when toggle changes
      const updatedProfile = await DartmouthAPI.updateProfile({
        name: fullName,
        phoneNumber: phoneNumber.trim() || null,
        timezone: timezone,
      });

      // Verify voiceSettings were saved correctly
      if (updatedProfile?.voiceSettings) {
        LoggingService.debug('Profile updated with voiceSettings:', updatedProfile.voiceSettings);
      } else {
        LoggingService.warn('Profile updated but voiceSettings not found in response');
      }

      // Update context with new profile data
      setUserData(updatedProfile);

      LoggingService.debug('Profile updated successfully');

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      LoggingService.error('Error updating profile:', error);
      
      // Check if it's an auth error
      if (error.message?.includes('session has expired') || error.message?.includes('Unauthorized')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Don't automatically logout - let the user decide
                // The error message is clear enough
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          `Failed to update profile: ${error.message}`
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleWakeWordToggleChange = (newValue) => {
    // Show alert asking for relogin
    Alert.alert(
      'Relogin Required',
      'Changing the wake word setting requires you to relogin for the changes to take effect. Do you want to save this change and relogin?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Revert the toggle to previous value
            setWakeWordEnabled(!newValue);
          },
        },
        {
          text: 'Relogin',
          style: 'default',
          onPress: async () => {
            // Save the setting and logout
            await handleWakeWordSaveAndLogout(newValue);
          },
        },
      ]
    );
  };

  const handleWakeWordSaveAndLogout = async (newWakeWordValue) => {
    setSaving(true);
    
    try {
      // Merge voiceSettings to preserve existing settings (ttsEnabled, ttsSpeed, etc.)
      const currentVoiceSettings = userData?.voiceSettings || {};
      const voiceSettingsUpdate = {
        ...currentVoiceSettings,
        wakeWordEnabled: newWakeWordValue,
      };
      
      LoggingService.debug('Saving wake word setting before logout:', voiceSettingsUpdate);
      
      // Save only the voiceSettings
      const updatedProfile = await DartmouthAPI.updateProfile({
        voiceSettings: voiceSettingsUpdate,
      });

      // Verify voiceSettings were saved correctly
      if (updatedProfile?.voiceSettings) {
        LoggingService.debug('Wake word setting saved:', updatedProfile.voiceSettings);
      } else {
        LoggingService.warn('Wake word setting saved but not found in response');
      }

      // Update context with new profile data
      setUserData(updatedProfile);

      LoggingService.debug('Wake word setting saved successfully, logging out...');

      // Logout via Dartmouth API
      await DartmouthAPI.logout();
      
      // Clear user state
      setUser(null);
      setUserData(null);
      setIsAuthenticated(false);
      
      LoggingService.debug('Logout successful after wake word change');
    } catch (error) {
      LoggingService.error('Error saving wake word setting:', error);
      
      // Revert the toggle on error
      setWakeWordEnabled(!newWakeWordValue);
      
      Alert.alert(
        'Error',
        `Failed to save wake word setting: ${error.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
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
              // Logout via Dartmouth API
              await DartmouthAPI.logout();
              
              // Clear user state
              setUser(null);
              setUserData(null);
              setIsAuthenticated(false);
              
              LoggingService.debug('Logout successful');
            } catch (error) {
              LoggingService.error('Logout error:', error);
              // Clear state even if API call fails
              setUser(null);
              setUserData(null);
              setIsAuthenticated(false);
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
          </View>

          {/* Voice Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Settings</Text>
            
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelContainer}>
                <Text style={styles.label}>Wake Word Required</Text>
                <Text style={styles.helpText}>
                  When enabled, you must say "Hey, McCarthy" to activate voice chat. When disabled, voice chat starts immediately.
                </Text>
              </View>
              <Switch
                value={wakeWordEnabled}
                onValueChange={handleWakeWordToggleChange}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E5EA"
                disabled={saving}
              />
            </View>

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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 15,
  },
});

export default SettingsScreen;
