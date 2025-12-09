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
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppContext } from '../context/AppContext';
import DartmouthAPI from '../services/DartmouthAPIService';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import ChatHistoryModal from '../components/ChatHistoryModal';
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
  const [voiceStatus, setVoiceStatus] = useState('disabled'); // 'disabled', 'waiting', 'available', 'listening', 'thinking', 'saying'
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false); // Mic button state - voice disabled by default
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const flatListRef = useRef(null);
  const conversationHistoryRef = useRef([]);
  const sessionIdRef = useRef(null);
  const isProcessingVoiceRef = useRef(false); // Prevent multiple simultaneous voice processing
  const shouldListenRef = useRef(false); // Flag to control when to listen - starts as false (voice disabled)
  const isFirstWakeUpRef = useRef(true); // Track if this is the first wake-up (waiting → listening)
  const voiceStatusRef = useRef('disabled'); // Ref to track current voice status (avoids stale closures)

  const userTimezone = userData?.timezone || 'Australia/Sydney';

  // Initialize session ID
  useEffect(() => {
    if (user && !sessionIdRef.current) {
      sessionIdRef.current = `pa-ai-${user.uid}-${Date.now()}`;
    }
  }, [user]);

  // Messages are stored in local state only (no Firestore)
  // Dartmouth API handles conversation history via sessionId

  // Save chat history to Cloudflare database
  const saveChatHistory = async (question, answer, sessionId, metadata = {}) => {
    try {
      if (!user || !question || !answer) {
        LoggingService.warn('Cannot save chat history: missing user, question, or answer');
        return;
      }

      const response = await DartmouthAPI.saveChatHistory(question, answer, sessionId, metadata);
      
      if (response.success) {
        LoggingService.debug('Chat history saved successfully:', response.id);
      } else {
        LoggingService.warn('Chat history save returned non-success:', response);
      }
    } catch (error) {
      LoggingService.error('Error saving chat history:', error);
      // Don't throw - we don't want to break the chat flow if save fails
    }
  };

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
            onStart: async () => {
              // Save chat history when TTS starts speaking (answer is successfully generated)
              try {
                await saveChatHistory(text, mccarthyMessage.text, sessionIdRef.current, {
                  timezone: userTimezone,
                  location: userData?.homeAddress || 'Unknown',
                  timestamp: mccarthyMessage.timestamp.toISOString(),
                });
              } catch (saveError) {
                // Don't fail TTS if save fails - just log it
                LoggingService.error('Failed to save chat history:', saveError);
              }
            },
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
      } else {
        // TTS disabled - still save chat history since answer was successfully generated
        try {
          await saveChatHistory(text, mccarthyMessage.text, sessionIdRef.current, {
            timezone: userTimezone,
            location: userData?.homeAddress || 'Unknown',
            timestamp: mccarthyMessage.timestamp.toISOString(),
          });
        } catch (saveError) {
          LoggingService.error('Failed to save chat history:', saveError);
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

  // Toggle voice on/off with mic button
  const toggleVoice = async () => {
    if (isVoiceEnabled) {
      // Disable voice - stop listening
      setIsVoiceEnabled(false);
      setVoiceStatus('disabled');
      voiceStatusRef.current = 'disabled';
      shouldListenRef.current = false;
      isProcessingVoiceRef.current = false;
      
      try {
        await SpeechRecognitionService.stopContinuousListening();
        LoggingService.debug('[ChatScreen] Voice disabled - stopped continuous listening');
      } catch (error) {
        LoggingService.error('[ChatScreen] Error stopping voice:', error);
      }
    } else {
      // Enable voice - start listening
      setIsVoiceEnabled(true);
      await initializeVoiceChat();
    }
  };

  // Initialize continuous voice listening (only when voice is enabled)
  const initializeVoiceChat = async () => {
    if (!isAuthenticated) return;

    try {
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
                isFirstWakeUpRef.current = false;
                
                // IMPORTANT: Ensure we're ready to listen for the user's question
                // Set flags to allow processing the next transcription
                shouldListenRef.current = true;
                isProcessingVoiceRef.current = false;
                
                // Reset processing flags but keep listening active
                // CRITICAL: The service should have already set isListening = false after transcription
                // But we need to ensure all flags are reset so the cycle can restart
                SpeechRecognitionService.resetAllProcessingFlags();
                
                // CRITICAL: Restart listening cycle to continue listening for user's question
                // The continuous listening needs to restart after processing the wake word transcription
                // Use a delay to ensure the callback has fully completed and service state is reset
                setTimeout(async () => {
                  LoggingService.debug('[ChatScreen] Attempting to restart listening after wake word. Conditions:', {
                    isVoiceEnabled,
                    shouldListen: shouldListenRef.current,
                    status: voiceStatusRef.current,
                    isProcessing: isProcessingVoiceRef.current
                  });
                  
                  if (isVoiceEnabled && shouldListenRef.current && voiceStatusRef.current === 'available') {
                    try {
                      // CRITICAL: Force reset listening state to ensure isListening is false
                      // This is necessary because the service might still think it's listening
                      SpeechRecognitionService.forceResetListeningState();
                      
                      // Small additional delay to ensure service state is fully reset
                      await new Promise(resolve => setTimeout(resolve, 300));
                      
                      LoggingService.debug('[ChatScreen] Restarting listening cycle after wake word detection');
                      await SpeechRecognitionService.startListeningCycle();
                      LoggingService.debug('[ChatScreen] Listening cycle restarted successfully');
                    } catch (error) {
                      LoggingService.error('[ChatScreen] Error restarting listening after wake word:', error);
                      // Try again after delay with another reset
                      setTimeout(async () => {
                        if (isVoiceEnabled && shouldListenRef.current && voiceStatusRef.current === 'available') {
                          SpeechRecognitionService.forceResetListeningState();
                          await new Promise(resolve => setTimeout(resolve, 400));
                          LoggingService.debug('[ChatScreen] Retrying listening cycle restart');
                          await SpeechRecognitionService.startListeningCycle();
                        }
                      }, 1500);
                    }
                  } else {
                    LoggingService.warn('[ChatScreen] Cannot restart listening - conditions not met:', {
                      isVoiceEnabled,
                      shouldListen: shouldListenRef.current,
                      status: voiceStatusRef.current
                    });
                  }
                }, 1500); // Longer delay to ensure previous processing is fully complete and service state is reset
                
                LoggingService.debug('[ChatScreen] Wake word detected - ready to listen for user question. Status: available, shouldListen:', shouldListenRef.current);
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
                  if (isVoiceEnabled && shouldListenRef.current && voiceStatusRef.current === 'waiting') {
                    LoggingService.debug('[ChatScreen] Restarting listening cycle after wake word not detected');
                    try {
                      await SpeechRecognitionService.startListeningCycle();
                    } catch (error) {
                      LoggingService.error('[ChatScreen] Error restarting listening cycle:', error);
                      // Try again after another delay
                      setTimeout(async () => {
                        if (isVoiceEnabled && shouldListenRef.current && voiceStatusRef.current === 'waiting') {
                          await SpeechRecognitionService.startListeningCycle();
                        }
                      }, 2000);
                    }
                  }
                }, 1500); // Give it more time to fully stop and reset
                return;
              }
            }
            
            // Check if we should process (voice must be enabled)
            if (!isVoiceEnabled || !shouldListenRef.current || isProcessingVoiceRef.current) {
              LoggingService.debug('[ChatScreen] Skipping - voiceEnabled:', isVoiceEnabled, 'shouldListen:', shouldListenRef.current, 'isProcessing:', isProcessingVoiceRef.current);
              return;
            }

            // If in "available" state: available → listening (user is speaking)
            // This handles the case where user speaks after wake word is detected
            if (voiceStatusRef.current === 'available') {
              LoggingService.debug('[ChatScreen] User speaking in available state, switching to listening. Text:', recognizedText);
              setVoiceStatus('listening');
              voiceStatusRef.current = 'listening';
              setIsListening(true);
              // Continue processing this transcription
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
                  if (isVoiceEnabled && shouldListenRef.current && !isProcessingVoiceRef.current) {
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
                if (isVoiceEnabled && shouldListenRef.current && !isProcessingVoiceRef.current) {
                  LoggingService.debug('[ChatScreen] Restarting listening cycle after error');
                  SpeechRecognitionService.startListeningCycle();
                }
              }, 1000);
            }
          },
          // onError: Handle errors
          (error) => {
            LoggingService.error('Speech recognition error:', error);
            // Only update status if voice is enabled and we should be listening
            if (isVoiceEnabled && shouldListenRef.current) {
              // Go to available state on error (not listening)
              setVoiceStatus('available');
              voiceStatusRef.current = 'available';
              setIsListening(false);
            }
            isProcessingVoiceRef.current = false;
            // Restart listening cycle on error (only if voice is enabled)
            setTimeout(() => {
              if (isVoiceEnabled && shouldListenRef.current && !isProcessingVoiceRef.current) {
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
    } catch (error) {
      LoggingService.error('[ChatScreen] Error initializing voice chat:', error);
      setVoiceStatus('disabled');
      setIsVoiceEnabled(false);
    }
  };

  // Only initialize voice when enabled and authenticated
  useEffect(() => {
    if (!isAuthenticated || !isVoiceEnabled) {
      return;
    }

    initializeVoiceChat();

    return () => {
      // Cleanup: stop listening when component unmounts or voice is disabled
      if (isVoiceEnabled) {
        SpeechRecognitionService.stopContinuousListening().catch(() => {
          // Ignore errors during cleanup
        });
      }
    };
  }, [isAuthenticated, userData, isVoiceEnabled]);

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
            onStart: async () => {
              // Save chat history when TTS starts speaking (answer is successfully generated)
              try {
                await saveChatHistory(text, mccarthyMessage.text, sessionIdRef.current, {
                  timezone: userTimezone,
                  location: userData?.homeAddress || 'Unknown',
                  timestamp: mccarthyMessage.timestamp.toISOString(),
                });
              } catch (saveError) {
                // Don't fail TTS if save fails - just log it
                LoggingService.error('[ChatScreen] Failed to save chat history:', saveError);
              }
            },
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
                  if (isVoiceEnabled && shouldListenRef.current && !isProcessingVoiceRef.current) {
                    SpeechRecognitionService.startListeningCycle();
                  }
                }, 500);
              }).catch(() => {
                SpeechRecognitionService.resetProcessingFlag();
                setTimeout(() => {
                  if (isVoiceEnabled && shouldListenRef.current && !isProcessingVoiceRef.current) {
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
                if (isVoiceEnabled && shouldListenRef.current && !isProcessingVoiceRef.current) {
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
            if (isVoiceEnabled && shouldListenRef.current && !isProcessingVoiceRef.current) {
              SpeechRecognitionService.startListeningCycle();
            }
          }, 500);
        }
      } else {
        // TTS disabled: thinking → available
        // Still save chat history since answer was successfully generated
        try {
          await saveChatHistory(text, mccarthyMessage.text, sessionIdRef.current, {
            timezone: userTimezone,
            location: userData?.homeAddress || 'Unknown',
            timestamp: mccarthyMessage.timestamp.toISOString(),
          });
        } catch (saveError) {
          LoggingService.error('[ChatScreen] Failed to save chat history:', saveError);
        }
        
        // Only set to available if voice is enabled
        if (isVoiceEnabled) {
          setVoiceStatus('available');
          voiceStatusRef.current = 'available';
          isProcessingVoiceRef.current = false;
          shouldListenRef.current = true;
          SpeechRecognitionService.resetProcessingFlag();
          setTimeout(() => {
            if (isVoiceEnabled && shouldListenRef.current && !isProcessingVoiceRef.current) {
              SpeechRecognitionService.startListeningCycle();
            }
          }, 500);
        } else {
          // Voice disabled - just reset processing flags
          isProcessingVoiceRef.current = false;
          shouldListenRef.current = false;
        }
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
      
      // thinking → available (on error) - only if voice is enabled
      if (isVoiceEnabled) {
        setVoiceStatus('available');
        voiceStatusRef.current = 'available';
        isProcessingVoiceRef.current = false;
        shouldListenRef.current = true;
        SpeechRecognitionService.resetProcessingFlag();
        setTimeout(() => {
          if (isVoiceEnabled && shouldListenRef.current && !isProcessingVoiceRef.current) {
            SpeechRecognitionService.startListeningCycle();
          }
        }, 1000);
      } else {
        // Voice disabled - just reset processing flags
        isProcessingVoiceRef.current = false;
        shouldListenRef.current = false;
      }
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
      {/* Header with Mic Button and History Button */}
      <View style={styles.headerContainer}>
        <View style={styles.micButtonContainer}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isVoiceEnabled && styles.micButtonEnabled,
              (isLoading || isSpeaking) && styles.micButtonDisabled
            ]}
            onPress={toggleVoice}
            disabled={isLoading || isSpeaking}
          >
            <Ionicons
              name={isVoiceEnabled ? "mic" : "mic-off"}
              size={24}
              color={isVoiceEnabled ? "#FFFFFF" : "#8E8E93"}
            />
          </TouchableOpacity>
          <Text style={styles.micButtonLabel}>
            {isVoiceEnabled ? "Voice On" : "Voice Off"}
          </Text>
        </View>

        {/* History Button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setIsHistoryModalVisible(true)}
          disabled={isLoading || isSpeaking}
        >
          <Ionicons name="time-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

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
            {/* Only show voice status when voice is enabled */}
            {isVoiceEnabled && voiceStatus === 'waiting' && (
              <View style={styles.waitingContainer}>
                <ActivityIndicator size="small" color="#8E8E93" />
                <Text style={styles.waitingText}>Waiting for wake word...</Text>
              </View>
            )}
            {isVoiceEnabled && voiceStatus === 'available' && (
              <View style={styles.availableContainer}>
                <ActivityIndicator size="small" color="#34C759" />
                <Text style={styles.availableText}>Available - Speak now...</Text>
              </View>
            )}
            {isVoiceEnabled && voiceStatus === 'listening' && (
              <View style={styles.listeningContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.listeningText}>Listening...</Text>
              </View>
            )}
            {isVoiceEnabled && voiceStatus === 'thinking' && (
              <View style={styles.thinkingContainer}>
                <ActivityIndicator size="small" color="#FF9500" />
                <Text style={styles.thinkingText}>Thinking...</Text>
              </View>
            )}
            {isVoiceEnabled && voiceStatus === 'saying' && (
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
        placeholder={isVoiceEnabled ? "Type a message or speak..." : "Type a message..."}
      />

      {/* Chat History Modal */}
      <ChatHistoryModal
        visible={isHistoryModalVisible}
        onClose={() => setIsHistoryModalVisible(false)}
        userTimezone={userTimezone}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  micButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  micButtonEnabled: {
    backgroundColor: '#007AFF',
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  micButtonLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
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

