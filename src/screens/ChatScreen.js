/**
 * Chat Screen
 * 
 * Main chat interface for interacting with McCarthy
 * Supports both text and voice input
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

import { firestore, auth } from '../config/firebase';
import { useAppContext } from '../context/AppContext';
import LLMService from '../services/LLMService';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import LoggingService from '../services/LoggingService';
import TimezoneService from '../services/TimezoneService';
import SpeechRecognitionService from '../services/SpeechRecognitionService';
import TextToSpeechService from '../services/TextToSpeechService';
import WakeWordService from '../services/WakeWordService';

const ChatScreen = () => {
  const { user, userData, isAuthenticated } = useAppContext();
  const voiceErrorShownRef = useRef(false); // Track if we've shown the voice error
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flatListRef = useRef(null);
  const conversationHistoryRef = useRef([]);

  const userTimezone = userData?.timezone || 'Australia/Sydney';

  // Load conversation history from Firestore
  useEffect(() => {
    if (!firestore || !user) return;

    const conversationsRef = collection(firestore, 'conversations');
    // Filter by userId in the query itself (required for Firestore security rules)
    const q = query(
      conversationsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedMessages = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Filter out voice-related error messages (they're just UI feedback, not real messages)
          const isVoiceError = data.type === 'system' && (
            data.text?.includes('Voice input requires') ||
            data.text?.includes('voice input') ||
            data.text?.includes('development build') ||
            data.text?.includes('Expo Go does not support')
          );
          
          // Skip voice error messages - they're temporary UI feedback
          if (isVoiceError) {
            return;
          }
          
          // All messages in snapshot are already filtered by userId
          loadedMessages.push({
            id: doc.id,
            ...data,
          });
        });

        // Sort by timestamp ascending for display
        loadedMessages.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
          const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
          return timeA - timeB;
        });

        setMessages(loadedMessages);

        // Update conversation history for LLM context
        conversationHistoryRef.current = loadedMessages.slice(-10).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (error) => {
        LoggingService.error('Error loading conversation history:', error);
      }
    );

    return () => unsubscribe();
  }, [user, firestore]);

  const saveMessage = async (text, type, metadata = {}) => {
    if (!firestore || !user) return;

    try {
      const conversationsRef = collection(firestore, 'conversations');
      await addDoc(conversationsRef, {
        userId: user.uid,
        text: text,
        type: type, // 'user', 'mccarthy', or 'system'
        timestamp: new Date(),
        ...metadata,
      });
    } catch (error) {
      LoggingService.error('Error saving message:', error);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    // Add user message to UI immediately
    const userMessage = {
      id: `temp-${Date.now()}`,
      text: text,
      type: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Save to Firestore
    await saveMessage(text, 'user');

    setIsLoading(true);
    setIsTyping(true);

    try {
      // Get user context
      const context = {
        userId: user.uid,
        timezone: userTimezone,
        currentTime: TimezoneService.getUserLocalTime(userTimezone).toISO(),
        location: userData?.homeAddress || 'Unknown',
      };

      // Get conversation history
      const conversationHistory = conversationHistoryRef.current;

      // Call LLM service
      const result = await LLMService.processMessage(text, context, conversationHistory);

      // Add McCarthy's response
      const mccarthyMessage = {
        id: `temp-${Date.now()}-response`,
        text: result.response,
        type: 'mccarthy',
        timestamp: new Date(),
        functionCalls: result.functionCalls,
      };
      setMessages(prev => [...prev, mccarthyMessage]);

      // Save to Firestore
      await saveMessage(result.response, 'mccarthy', {
        functionCalls: result.functionCalls,
      });

      // Speak McCarthy's response if voice output is enabled
      if (userData?.voiceSettings?.ttsEnabled !== false) {
        try {
          setIsSpeaking(true);
          await TextToSpeechService.speak(result.response, {
            language: 'en-AU',
            rate: userData?.voiceSettings?.ttsSpeed || 1.0,
            onDone: () => {
              setIsSpeaking(false);
            },
            onError: (error) => {
              LoggingService.error('TTS error:', error);
              setIsSpeaking(false);
            },
          });
        } catch (error) {
          LoggingService.error('Error speaking response:', error);
          setIsSpeaking(false);
        }
      }

      // TODO: Execute function calls if any
      if (result.functionCalls && result.functionCalls.length > 0) {
        LoggingService.debug('Function calls received:', result.functionCalls);
        // Function execution will be implemented in later tasks
      }
    } catch (error) {
      LoggingService.error('Error processing message:', error);
      
      // Show error message
      const errorMessage = {
        id: `temp-${Date.now()}-error`,
        text: `Sorry, I encountered an error: ${error.message}`,
        type: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage.text, 'system');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Initialize wake word service
  useEffect(() => {
    if (!isAuthenticated) return;

    const initializeVoiceServices = async () => {
      try {
        // Initialize wake word detection
        await WakeWordService.initialize(() => {
          LoggingService.debug('Wake word detected!');
          handleWakeWordDetected();
        });

        // Start listening for wake word if enabled in user settings
        if (userData?.voiceSettings?.wakeWordEnabled !== false) {
          await WakeWordService.startListening();
          WakeWordService.setEnabled(true);
        }
      } catch (error) {
        LoggingService.error('Error initializing voice services:', error);
      }
    };

    initializeVoiceServices();

    return () => {
      WakeWordService.cleanup();
    };
  }, [isAuthenticated, userData]);

  const handleWakeWordDetected = async () => {
    // Show visual feedback
    setIsListening(true);
    
    // Start speech recognition
    try {
      await SpeechRecognitionService.startListening(
        (recognizedText) => {
          // Speech recognized, send to chat
          LoggingService.debug('Speech recognized:', recognizedText);
          setIsListening(false);
          handleSendMessage(recognizedText);
        },
        (error) => {
          LoggingService.error('Speech recognition error:', error);
          setIsListening(false);
          
          // Show error message
          const errorMessage = {
            id: `temp-${Date.now()}-error`,
            text: `Sorry, I couldn't understand that. Please try again.`,
            type: 'system',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      );
    } catch (error) {
      LoggingService.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  };

  const handleVoicePress = async () => {
    if (isListening) {
      // Stop listening
      await SpeechRecognitionService.stopListening();
      setIsListening(false);
      return;
    }

    // Check if speech recognition is available
    const isAvailable = await SpeechRecognitionService.isAvailable();
    if (!isAvailable) {
      // Only show error once per session to avoid spam
      if (voiceErrorShownRef.current) {
        LoggingService.debug('Voice input not available - error already shown');
        return;
      }
      
      voiceErrorShownRef.current = true;
      
      // Show user-friendly message based on platform (don't save to Firestore)
      let errorText;
      if (Platform.OS === 'web') {
        errorText = 'Voice input is not available. Please use Chrome, Edge, or Safari browser for Web Speech API support.';
      } else {
        errorText = 'Voice input requires OpenAI API key. Please set OPENAI_API_KEY in .env file (same key used for LLM).';
      }
      
      // Show as temporary message (not saved to Firestore)
      const errorMessage = {
        id: `temp-voice-error-${Date.now()}`,
        text: errorText,
        type: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Don't save to Firestore - this is just UI feedback
      LoggingService.debug('Voice input not available:', errorText);
      return;
    }

    // Start manual voice input
    // Flow: Record → Stop → Check for wake word → Process if found
    try {
      setIsListening(true);
      await SpeechRecognitionService.startListening(
        (recognizedText, wakeWordDetected) => {
          LoggingService.debug('Speech recognized:', recognizedText, 'Wake word detected:', wakeWordDetected);
          setIsListening(false);
          
          // Only process if wake word was detected
          if (wakeWordDetected) {
            if (recognizedText && recognizedText !== 'Hey McCarthy') {
              // Has question after wake word - send to LLM
              handleSendMessage(recognizedText);
            } else {
              // Just wake word, no question - show prompt
              const promptMessage = {
                id: `temp-${Date.now()}-prompt`,
                text: 'Hey McCarthy! How can I help you?',
                type: 'system',
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, promptMessage]);
            }
          } else {
            // Wake word not detected - show message
            const noWakeWordMessage = {
              id: `temp-${Date.now()}-no-wake`,
              text: 'Wake word not detected. Please say "Hey McCarthy" followed by your question.',
              type: 'system',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, noWakeWordMessage]);
          }
        },
        (error) => {
          LoggingService.error('Speech recognition error:', error);
          setIsListening(false);
          
          // Show user-friendly error message (don't save to Firestore)
          const errorMessage = {
            id: `temp-speech-error-${Date.now()}`,
            text: error.message || 'Sorry, I couldn\'t understand that. Please try again or type your message.',
            type: 'system',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          // Don't save to Firestore - this is just UI feedback
        }
      );
    } catch (error) {
      LoggingService.error('Error starting voice input:', error);
      setIsListening(false);
      
      // Show user-friendly error message (don't save to Firestore)
      const errorMessage = {
        id: `temp-voice-start-error-${Date.now()}`,
        text: 'Error starting voice input. Please try again or type your message.',
        type: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      // Don't save to Firestore - this is just UI feedback
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to use chat</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} userTimezone={userTimezone} />
        )}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        ListFooterComponent={
          <>
            {isTyping && (
              <View style={styles.typingContainer}>
                <ActivityIndicator size="small" color="#8E8E93" />
                <Text style={styles.typingText}>McCarthy is typing...</Text>
              </View>
            )}
            {isListening && (
              <View style={styles.listeningContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.listeningText}>Listening...</Text>
              </View>
            )}
            {isSpeaking && (
              <View style={styles.speakingContainer}>
                <ActivityIndicator size="small" color="#34C759" />
                <Text style={styles.speakingText}>McCarthy is speaking...</Text>
              </View>
            )}
          </>
        }
      />
      
      <MessageInput
        onSend={handleSendMessage}
        onVoicePress={handleVoicePress}
        disabled={isLoading || isSpeaking}
        placeholder={isListening ? "Listening..." : "Ask McCarthy anything..."}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesList: {
    paddingVertical: 16,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  listeningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listeningText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  speakingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  speakingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#34C759',
    fontStyle: 'italic',
  },
  errorText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 20,
  },
});

export default ChatScreen;

