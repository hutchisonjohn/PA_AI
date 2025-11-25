/**
 * Message Bubble Component
 * 
 * Displays individual messages in the chat interface
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DateTime } from 'luxon';
import TimezoneService from '../services/TimezoneService';

const MessageBubble = ({ message, userTimezone = 'Australia/Sydney' }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      let dt;
      
      // Handle Firestore Timestamp objects
      if (timestamp && typeof timestamp.toDate === 'function') {
        dt = DateTime.fromJSDate(timestamp.toDate());
      } else if (timestamp && timestamp.seconds) {
        // Firestore Timestamp with seconds property
        dt = DateTime.fromSeconds(timestamp.seconds);
      } else if (typeof timestamp === 'string') {
        dt = DateTime.fromISO(timestamp);
      } else if (timestamp instanceof Date) {
        dt = DateTime.fromJSDate(timestamp);
      } else {
        // Try to parse as ISO string or return empty
        dt = DateTime.fromISO(String(timestamp));
      }
      
      // Check if valid
      if (!dt || !dt.isValid) {
        return '';
      }
      
      const localTime = dt.setZone(userTimezone);
      const now = DateTime.now().setZone(userTimezone);
      
      // If same day, show time only
      if (localTime.hasSame(now, 'day')) {
        return localTime.toFormat('HH:mm');
      }
      
      // Otherwise show date and time
      return localTime.toFormat('dd/MM HH:mm');
    } catch (error) {
      // Return empty string on any error
      return '';
    }
  };

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.mccarthyContainer,
    ]}>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.mccarthyBubble,
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.mccarthyText,
        ]}>
          {message.text}
        </Text>
        {message.timestamp && (
          <Text style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.mccarthyTimestamp,
          ]}>
            {formatTimestamp(message.timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  mccarthyContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  mccarthyBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  mccarthyText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  mccarthyTimestamp: {
    color: '#8E8E93',
    textAlign: 'left',
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
});

export default MessageBubble;

