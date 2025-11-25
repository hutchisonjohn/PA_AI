/**
 * Profile Setup Screen
 * 
 * Collects user profile information after signup:
 * - Full name (first name, last name)
 * - Phone number (optional)
 * - Timezone selection (required)
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
import { useNavigation } from '@react-navigation/native';
import { doc, setDoc } from 'firebase/firestore';

import { firestore, auth } from '../config/firebase';
import { createUser } from '../models/User';
import TimezonePicker from '../components/TimezonePicker';
import LoggingService from '../services/LoggingService';

const ProfileSetupScreen = ({ route }) => {
  const navigation = useNavigation();
  const { userCredential } = route.params || {};

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timezone, setTimezone] = useState('Australia/Sydney');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    // Validate required fields
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name');
      return;
    }

    if (!timezone) {
      Alert.alert('Error', 'Please select your timezone');
      return;
    }

    setLoading(true);

    try {
      const currentUser = auth?.currentUser || userCredential?.user;
      
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      
      // Create user document with v7 schema
      const userData = createUser({
        userId: currentUser.uid,
        email: currentUser.email,
        name: fullName,
        phoneNumber: phoneNumber.trim() || null,
        timezone: timezone,
        currency: 'AUD',
        locale: 'en-AU',
        groupIds: [],
        defaultGroupId: null,
        defaultShoppingListId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      });

      // Save to Firestore
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userDocRef, userData);

      LoggingService.debug('User profile created:', userData);

      // Navigate to main app
      // The AppNavigator will handle navigation based on auth state
      Alert.alert(
        'Success',
        'Profile created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigation will be handled by AppNavigator when auth state updates
            },
          },
        ]
      );
    } catch (error) {
      LoggingService.error('Error creating user profile:', error);
      Alert.alert(
        'Error',
        `Failed to create profile: ${error.message}`
      );
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
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Help McCarthy get to know you better
          </Text>

          <View style={styles.nameRow}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Phone Number (Optional)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

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
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Profile...' : 'Complete Setup'}
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
    padding: 20,
    justifyContent: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#8E8E93',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  nameInput: {
    width: '48%',
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
  timezonePicker: {
    marginBottom: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 20,
    textAlign: 'center',
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
});

export default ProfileSetupScreen;

