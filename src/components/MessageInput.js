/**
 * Message Input Component
 * 
 * Text input field with send button for chat interface
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessageInput = ({ onSend, onVoicePress, disabled = false, placeholder = 'Type a message...' }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      {onVoicePress && (
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={onVoicePress}
          disabled={disabled}
        >
          <Ionicons name="mic" size={24} color="#007AFF" />
        </TouchableOpacity>
      )}
      
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        multiline
        maxLength={1000}
        editable={!disabled}
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      
      <TouchableOpacity
        style={[styles.sendButton, (!message.trim() || disabled) && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!message.trim() || disabled}
      >
        <Ionicons 
          name="send" 
          size={20} 
          color={(!message.trim() || disabled) ? '#8E8E93' : '#FFFFFF'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  voiceButton: {
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    fontSize: 16,
    color: '#000000',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
});

export default MessageInput;

