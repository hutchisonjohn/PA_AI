/**
 * Home Screen - Main dashboard with chat interface
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ChatScreen from './ChatScreen';

const HomeScreen = () => {
  const { t } = useTranslation();

  // For Week 2, HomeScreen is the chat interface
  return <ChatScreen />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 30,
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
    marginBottom: 10,
    color: '#000000',
  },
  sectionText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
});

export default HomeScreen;

