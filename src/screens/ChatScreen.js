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

import { useAppContext } from '../context/AppContext';
import DartmouthAPI from '../services/DartmouthAPIService';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import LoggingService from '../services/LoggingService';
import TimezoneService from '../services/TimezoneService';
import SpeechRecognitionService from '../services/SpeechRecognitionService';
import TextToSpeechService from '../services/TextToSpeechService';

const ChatScreen = () => {
  const { user, userData, isAuthenticated } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('waiting'); // 'waiting', 'available', 'listening', 'thinking', 'saying'
  const flatListRef = useRef(null);
  const conversationHistoryRef = useRef([]);
  const sessionIdRef = useRef(null);
  const isProcessingVoiceRef = useRef(false); // Prevent multiple simultaneous voice processing
  const shouldListenRef = useRef(true); // Flag to control when to listen
  const isFirstWakeUpRef = useRef(true); // Track if this is the first wake-up (waiting → listening)
  const voiceStatusRef = useRef('waiting'); // Ref to track current voice status (avoids stale closures)

  const userTimezone = userData?.timezone || 'Australia/Sydney';

  // Initialize session ID
  useEffect(() => {
    if (user && !sessionIdRef.current) {
      sessionIdRef.current = `pa-ai-${user.uid}-${Date.now()}`;
    }
  }, [user]);

  // Messages are stored in local state only (no Firestore)
  // Dartmouth API handles conversation history via sessionId

  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading || !user) return;

    // Add user message to UI immediately
    const userMessage = {
      id: `temp-${Date.now()}`,
      text: text,
      type: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Update conversation history
    conversationHistoryRef.current.push({
      role: 'user',
      content: text,
    });

    setIsLoading(true);
    setIsTyping(true);

    try {
      // Get conversation history for context
      const history = conversationHistoryRef.current.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call Dartmouth API
      const result = await DartmouthAPI.sendChatMessage(
        text,
        sessionIdRef.current,
        history,
        {
          userId: user.uid,
          timezone: userTimezone,
          currentTime: TimezoneService.getUserLocalTime(userTimezone).toISO(),
          location: userData?.homeAddress || 'Unknown',
        }
      );

      console.log('[ChatScreen] API response:', {
        hasContent: !!result.content,
        contentLength: result.content?.length,
        hasError: !!result.error,
        sessionId: result.sessionId,
        metadata: result.metadata,
        allKeys: Object.keys(result || {}),
        fullResponse: JSON.stringify(result).substring(0, 500),
      });

      // Check for error in response
      if (result.error) {
        throw new Error(result.error);
      }

      // Validate response has content - be very defensive
      let messageContent = result.content;
      if (!messageContent || (typeof messageContent === 'string' && messageContent.trim().length === 0)) {
        console.error('[ChatScreen] Response missing or empty content:', {
          result,
          hasContent: !!result.content,
          contentType: typeof result.content,
          contentValue: result.content,
        });
        // Use a fallback message instead of throwing
        messageContent = "I apologize, but I'm having trouble processing your message right now. Please try again.";
        LoggingService.warn('Chat response missing content, using fallback message');
      } else {
        messageContent = typeof messageContent === 'string' ? messageContent.trim() : String(messageContent);
      }

      // Update session ID if returned
      if (result.sessionId) {
        sessionIdRef.current = result.sessionId;
      }

      // Add McCarthy's response (use the validated messageContent)
      const mccarthyMessage = {
        id: `temp-${Date.now()}-response`,
        text: messageContent, // Use validated content
        type: 'mccarthy',
        timestamp: new Date(result.timestamp || Date.now()),
      };
      setMessages(prev => [...prev, mccarthyMessage]);

      // Update conversation history
      conversationHistoryRef.current.push({
        role: 'assistant',
        content: mccarthyMessage.text,
      });

      // Speak McCarthy's response if voice output is enabled
      if (userData?.voiceSettings?.ttsEnabled !== false) {
        try {
          setIsSpeaking(true);
          await TextToSpeechService.speak(mccarthyMessage.text, {
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
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Initialize continuous voice listening
  useEffect(() => {
    if (!isAuthenticated) return;

    const initializeVoiceChat = async () => {
      try {
        // Check if speech recognition is available
        const isAvailable = await SpeechRecognitionService.isAvailable();
        if (!isAvailable) {
          LoggingService.warn('Speech recognition not available');
          setVoiceStatus('waiting'); // Still show waiting, but voice won't work
          return;
        }

        // Request microphone permissions
        const hasPermission = await SpeechRecognitionService.requestPermissions();
        if (!hasPermission) {
          LoggingService.warn('Microphone permission denied');
          setVoiceStatus('waiting');
          return;
        }

        // Check if wake word is enabled
        const wakeWordEnabled = userData?.voiceSettings?.wakeWordEnabled !== false; // Default to true if not set
        
        // Start continuous listening
        // If wake word is disabled, start in "available" state immediately
        // If wake word is enabled, start in "waiting" state and require wake word
        if (wakeWordEnabled) {
          setVoiceStatus('waiting');
          voiceStatusRef.current = 'waiting';
          isFirstWakeUpRef.current = true; // Reset wake-up flag
        } else {
          setVoiceStatus('available');
          voiceStatusRef.current = 'available';
          isFirstWakeUpRef.current = false; // No wake word needed
        }
        shouldListenRef.current = true;
        await SpeechRecognitionService.startContinuousListening(
          // onSpeechDetected: When user starts speaking (audio detected)
          () => {
            // Check if wake word is enabled
            const wakeWordEnabled = userData?.voiceSettings?.wakeWordEnabled !== false; // Default to true if not set
            
            // When in "waiting" state (only if wake word is enabled): Don't change status yet - wait for wake word confirmation in onResult
            if (wakeWordEnabled && shouldListenRef.current && voiceStatusRef.current === 'waiting') {
              LoggingService.debug('[ChatScreen] Speech detected in waiting state - will check for wake word');
              // Don't change status here - wait for transcription to verify wake word
            } 
            // When in "available" state and user starts speaking: available → listening
            else if (shouldListenRef.current && voiceStatusRef.current === 'available') {
              LoggingService.debug('[ChatScreen] User started speaking, switching to listening');
              setVoiceStatus('listening');
              voiceStatusRef.current = 'listening';
              setIsListening(true);
            }
          },
          // onResult: When speech is transcribed
          async (recognizedText) => {
            LoggingService.debug('[ChatScreen] Transcription received:', recognizedText, 'Current status:', voiceStatusRef.current);
            
            // Check if wake word is enabled
            const wakeWordEnabled = userData?.voiceSettings?.wakeWordEnabled !== false; // Default to true if not set
            
            // WAITING STATE: Only transition to "available" if wake word "Hey, McCarthy" is detected
            // Skip this check if wake word is disabled
            if (wakeWordEnabled && (voiceStatusRef.current === 'waiting' || isFirstWakeUpRef.current)) {
              // Check if the recognized text contains the wake word
              const hasWakeWord = SpeechRecognitionService.containsWakeWord(recognizedText);
              
              if (hasWakeWord) {
                LoggingService.debug('[ChatScreen] Wake word "Hey, McCarthy" detected, transitioning to available');
                setVoiceStatus('available');
                voiceStatusRef.current = 'available';
                setIsListening(false);
                isFirstWakeUpRef.current = false;
                SpeechRecognitionService.resetProcessingFlag();
                // Restart listening for next input (now in available state)
                setTimeout(() => {
                  if (shouldListenRef.current && !isFirstWakeUpRef.current) {
                    SpeechRecognitionService.startListeningCycle();
                  }
                }, 500);
                return;
              } else {
                // Wake word not detected - stay in waiting, ignore this transcription
                LoggingService.debug('[ChatScreen] Wake word not detected in:', recognizedText, '- staying in waiting state');
                isFirstWakeUpRef.current = false; // Reset flag so we can try again
                
                // Reset all processing flags to ensure clean state
                SpeechRecognitionService.resetAllProcessingFlags();
                
                // Stop current listening to ensure clean state before restarting
                // This ensures we can listen again even if service thinks it's still listening
                try {
                  await SpeechRecognitionService.stopListening();
                } catch (error) {
                  LoggingService.debug('[ChatScreen] Error stopping listening (non-critical):', error);
                }
                
                // Restart listening cycle to continue waiting for wake word
                // Use a longer delay to ensure service is fully stopped
                setTimeout(async () => {
                  if (shouldListenRef.current && voiceStatusRef.current === 'waiting') {
                    LoggingService.debug('[ChatScreen] Restarting listening cycle after wake word not detected');
                    try {
                      await SpeechRecognitionService.startListeningCycle();
                    } catch (error) {
                      LoggingService.error('[ChatScreen] Error restarting listening cycle:', error);
                      // Try again after another delay
                      setTimeout(async () => {
                        if (shouldListenRef.current && voiceStatusRef.current === 'waiting') {
                          await SpeechRecognitionService.startListeningCycle();
                        }
                      }, 2000);
                    }
                  }
                }, 1500); // Give it more time to fully stop and reset
                return;
              }
            }
            
            // Check if we should process
            if (!shouldListenRef.current || isProcessingVoiceRef.current) {
              LoggingService.debug('[ChatScreen] Skipping - shouldListen:', shouldListenRef.current, 'isProcessing:', isProcessingVoiceRef.current);
              return;
            }

            // If in "available" state: available → listening (user is speaking)
            if (voiceStatusRef.current === 'available') {
              LoggingService.debug('[ChatScreen] User speaking in available state, switching to listening');
              setVoiceStatus('listening');
              voiceStatusRef.current = 'listening';
              setIsListening(true);
            }
            
            // Only process if in "listening" state
            if (voiceStatusRef.current !== 'listening') {
              LoggingService.debug('[ChatScreen] Not in listening state, ignoring. Status:', voiceStatusRef.current);
              return;
            }

            // listening → thinking (processing)
            isProcessingVoiceRef.current = true;
            shouldListenRef.current = false;
            setIsListening(false);
            setVoiceStatus('thinking');
            voiceStatusRef.current = 'thinking';
            LoggingService.debug('[ChatScreen] Processing transcription:', recognizedText);

            try {
              if (recognizedText && recognizedText.trim()) {
                // Send to LLM and handle response (full STT → LLM → TTS flow)
                await handleVoiceMessage(recognizedText.trim());
              } else {
                // Empty transcription, go back to available
                LoggingService.debug('[ChatScreen] Empty transcription, going back to available');
                setVoiceStatus('available');
                voiceStatusRef.current = 'available';
                isProcessingVoiceRef.current = false;
                shouldListenRef.current = true;
                SpeechRecognitionService.resetProcessingFlag();
                // Restart listening cycle for continuous mode
                setTimeout(() => {
                  if (shouldListenRef.current && !isProcessingVoiceRef.current) {
                    LoggingService.debug('[ChatScreen] Restarting listening cycle after empty transcription');
                    SpeechRecognitionService.startListeningCycle();
                  }
                }, 500);
              }
            } catch (error) {
              LoggingService.error('[ChatScreen] Error processing voice message:', error);
              // Reset on error - go to available state
              setVoiceStatus('available');
              voiceStatusRef.current = 'available';
              isProcessingVoiceRef.current = false;
              shouldListenRef.current = true;
              SpeechRecognitionService.resetProcessingFlag();
              // Restart listening cycle
              setTimeout(() => {
                if (shouldListenRef.current && !isProcessingVoiceRef.current) {
                  LoggingService.debug('[ChatScreen] Restarting listening cycle after error');
                  SpeechRecognitionService.startListeningCycle();
                }
              }, 1000);
            }
          },
          // onError: Handle errors
          (error) => {
            LoggingService.error('Speech recognition error:', error);
            // Only update status if we should be listening
            if (shouldListenRef.current) {
              // Go to available state on error (not listening)
              setVoiceStatus('available');
              voiceStatusRef.current = 'available';
              setIsListening(false);
            }
            isProcessingVoiceRef.current = false;
            // Restart listening cycle on error
            setTimeout(() => {
              if (shouldListenRef.current && !isProcessingVoiceRef.current) {
                LoggingService.debug('[ChatScreen] Restarting listening cycle after recognition error');
                SpeechRecognitionService.startListeningCycle();
              }
            }, 1000);
            
            // Don't show error message for every error (too noisy)
            // Only show critical errors
            if (error.message && !error.message.includes('timeout') && !error.message.includes('no-speech')) {
              const errorMessage = {
                id: `temp-${Date.now()}-error`,
                text: `Sorry, I couldn't understand that. Please try again.`,
                type: 'system',
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, errorMessage]);
            }
          }
        );
      } catch (error) {
        LoggingService.error('Error initializing voice chat:', error);
        setVoiceStatus('waiting');
      }
    };

    initializeVoiceChat();

    return () => {
      SpeechRecognitionService.stopContinuousListening();
    };
  }, [isAuthenticated, userData]);

  // Handle voice message: send to LLM, get response, use TTS
  const handleVoiceMessage = async (text) => {
    try {
      // Add user message to UI immediately (this is the transcribed text)
      const userMessage = {
        id: `temp-${Date.now()}`,
        text: text,
        type: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Update conversation history
      conversationHistoryRef.current.push({
        role: 'user',
        content: text,
      });

            // Change status to "thinking"
      setVoiceStatus('thinking');
      voiceStatusRef.current = 'thinking';
      setIsLoading(true);
      setIsTyping(true);

      // Get conversation history for context
      const history = conversationHistoryRef.current.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call Dartmouth API
      const result = await DartmouthAPI.sendChatMessage(
        text,
        sessionIdRef.current,
        history,
        {
          userId: user.uid,
          timezone: userTimezone,
          currentTime: TimezoneService.getUserLocalTime(userTimezone).toISO(),
          location: userData?.homeAddress || 'Unknown',
        }
      );

      // Check for error in response
      if (result.error) {
        throw new Error(result.error);
      }

      // Validate response has content
      let messageContent = result.content;
      if (!messageContent || (typeof messageContent === 'string' && messageContent.trim().length === 0)) {
        messageContent = "I apologize, but I'm having trouble processing your message right now. Please try again.";
        LoggingService.warn('Chat response missing content, using fallback message');
      } else {
        messageContent = typeof messageContent === 'string' ? messageContent.trim() : String(messageContent);
      }

      // Update session ID if returned
      if (result.sessionId) {
        sessionIdRef.current = result.sessionId;
      }

      // Add McCarthy's response
      const mccarthyMessage = {
        id: `temp-${Date.now()}-response`,
        text: messageContent,
        type: 'mccarthy',
        timestamp: new Date(result.timestamp || Date.now()),
      };
      setMessages(prev => [...prev, mccarthyMessage]);

      // Update conversation history
      conversationHistoryRef.current.push({
        role: 'assistant',
        content: mccarthyMessage.text,
      });

      setIsLoading(false);
      setIsTyping(false);

      // Change status to "saying"
      setVoiceStatus('saying');
      voiceStatusRef.current = 'saying';

      // Speak McCarthy's response if voice output is enabled
      if (userData?.voiceSettings?.ttsEnabled !== false) {
        try {
          setIsSpeaking(true);
          await TextToSpeechService.speak(mccarthyMessage.text, {
            language: 'en-AU',
            rate: userData?.voiceSettings?.ttsSpeed || 1.0,
            onDone: () => {
              setIsSpeaking(false);
              // After TTS completes, go to "available" state first (wait 1 second)
              setVoiceStatus('available');
              voiceStatusRef.current = 'available';
              isProcessingVoiceRef.current = false;
              shouldListenRef.current = true;
              
              // saying → available (cycle complete, ready for next input)
              SpeechRecognitionService.stopListening().then(() => {
                SpeechRecognitionService.resetProcessingFlag();
                // Restart listening - will go to "listening" when user speaks (via onSpeechDetected)
                setTimeout(() => {
                  if (shouldListenRef.current && !isProcessingVoiceRef.current) {
                    SpeechRecognitionService.startListeningCycle();
                  }
                }, 500);
              }).catch(() => {
                SpeechRecognitionService.resetProcessingFlag();
                setTimeout(() => {
                  if (shouldListenRef.current && !isProcessingVoiceRef.current) {
                    SpeechRecognitionService.startListeningCycle();
                  }
                }, 500);
              });
            },
            onError: (error) => {
              LoggingService.error('[ChatScreen] TTS error:', error);
              setIsSpeaking(false);
              // saying → available (on error)
              setVoiceStatus('available');
              voiceStatusRef.current = 'available';
              isProcessingVoiceRef.current = false;
              shouldListenRef.current = true;
              SpeechRecognitionService.resetProcessingFlag();
              setTimeout(() => {
                if (shouldListenRef.current && !isProcessingVoiceRef.current) {
                  SpeechRecognitionService.startListeningCycle();
                }
              }, 500);
            },
          });
        } catch (error) {
          LoggingService.error('[ChatScreen] TTS catch error:', error);
          setIsSpeaking(false);
          // saying → available (on error)
          setVoiceStatus('available');
          voiceStatusRef.current = 'available';
          isProcessingVoiceRef.current = false;
          shouldListenRef.current = true;
          SpeechRecognitionService.resetProcessingFlag();
          setTimeout(() => {
            if (shouldListenRef.current && !isProcessingVoiceRef.current) {
              SpeechRecognitionService.startListeningCycle();
            }
          }, 500);
        }
      } else {
        // TTS disabled: thinking → available
        setVoiceStatus('available');
        voiceStatusRef.current = 'available';
        isProcessingVoiceRef.current = false;
        shouldListenRef.current = true;
        SpeechRecognitionService.resetProcessingFlag();
        setTimeout(() => {
          if (shouldListenRef.current && !isProcessingVoiceRef.current) {
            SpeechRecognitionService.startListeningCycle();
          }
        }, 500);
      }
    } catch (error) {
      LoggingService.error('Error processing voice message:', error);
      setIsLoading(false);
      setIsTyping(false);
      setIsSpeaking(false);
      
      // Show error message
      const errorMessage = {
        id: `temp-${Date.now()}-error`,
        text: `Sorry, I encountered an error: ${error.message}`,
        type: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // thinking → available (on error)
      setVoiceStatus('available');
      voiceStatusRef.current = 'available';
      isProcessingVoiceRef.current = false;
      shouldListenRef.current = true;
      SpeechRecognitionService.resetProcessingFlag();
      setTimeout(() => {
        if (shouldListenRef.current && !isProcessingVoiceRef.current) {
          SpeechRecognitionService.startListeningCycle();
        }
      }, 1000);
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
            {voiceStatus === 'waiting' && (
              <View style={styles.waitingContainer}>
                <ActivityIndicator size="small" color="#8E8E93" />
                <Text style={styles.waitingText}>Waiting...</Text>
              </View>
            )}
            {voiceStatus === 'available' && (
              <View style={styles.availableContainer}>
                <ActivityIndicator size="small" color="#34C759" />
                <Text style={styles.availableText}>Available...</Text>
              </View>
            )}
            {voiceStatus === 'listening' && (
              <View style={styles.listeningContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.listeningText}>Listening...</Text>
              </View>
            )}
            {voiceStatus === 'thinking' && (
              <View style={styles.thinkingContainer}>
                <ActivityIndicator size="small" color="#FF9500" />
                <Text style={styles.thinkingText}>Thinking...</Text>
              </View>
            )}
            {voiceStatus === 'saying' && (
              <View style={styles.sayingContainer}>
                <ActivityIndicator size="small" color="#34C759" />
                <Text style={styles.sayingText}>Saying...</Text>
              </View>
            )}
          </>
        }
      />
      
      <MessageInput
        onSend={handleSendMessage}
        onVoicePress={null}
        disabled={isLoading || isSpeaking || isListening}
        placeholder="Type a message (voice is always listening)..."
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
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  waitingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  availableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  availableText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#34C759',
    fontStyle: 'italic',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  thinkingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#FF9500',
    fontStyle: 'italic',
  },
  sayingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sayingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#34C759',
    fontStyle: 'italic',
  },
});

export default ChatScreen;

