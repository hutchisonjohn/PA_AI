/**
 * Speech Recognition Service
 * 
 * Uses OpenAI Whisper API for STT (works in Expo Go)
 * - Web: Web Speech API (free, no API key)
 * - Native: OpenAI Whisper API (uses existing OPENAI_API_KEY)
 * 
 * Simple implementation - no complex transcoding needed
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import Constants from 'expo-constants';
import LoggingService from './LoggingService';

// Web Speech API support (works in Expo Go web)
let webSpeechRecognition = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    webSpeechRecognition = SpeechRecognition;
  }
}

class SpeechRecognitionService {
  constructor() {
    this.isListening = false;
    this.isContinuousListening = false; // Flag for continuous listening mode
    this.onResultCallback = null; // For single-use listening (gets overwritten in startListening)
    this.onErrorCallback = null; // For single-use listening (gets overwritten in startListening)
    this.continuousOnResultCallback = null; // For continuous listening (persistent)
    this.continuousOnErrorCallback = null; // For continuous listening (persistent)
    this.onSpeechDetectedCallback = null; // Callback when speech is first detected
    this.recognitionTimeout = null;
    this.maxRecordingDuration = 30000; // 30 seconds
    this.webRecognition = null; // Web Speech API recognition instance
    this.recording = null; // expo-av recording instance
    this.isProcessingRecording = false; // Flag to prevent duplicate processing
    this.silenceTimeout = null; // Timeout for silence detection
    this.silenceDuration = 2000; // 2 seconds of silence to stop recording
    this.isProcessingResult = false; // Flag to prevent processing multiple results simultaneously
    
    // Get OpenAI API key (same one used for LLM)
    this.openaiKey = Constants.expoConfig?.extra?.openaiKey || process.env.OPENAI_API_KEY;
  }

  /**
   * Check if speech recognition is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    // Web platform: Check for Web Speech API (works in Expo Go web)
    if (Platform.OS === 'web') {
      if (webSpeechRecognition) {
        return true;
      }
      LoggingService.debug('Web Speech API not available in this browser');
      return false;
    }
    
    // Native platforms: Check for OpenAI API key
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      if (!this.openaiKey) {
        LoggingService.debug('OpenAI API key not configured');
        return false;
      }
      
      // Check if we can use expo-av for recording
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status === 'granted') {
          return true;
        }
      } catch (error) {
        LoggingService.debug('Error checking audio permissions:', error);
      }
      
      return false;
    }
    
    return false;
  }

  /**
   * Request microphone permissions
   * @returns {Promise<boolean>}
   */
  async requestPermissions() {
    try {
      // Use expo-av for audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      LoggingService.error('Error requesting microphone permissions:', error);
      return false;
    }
  }

  /**
   * Start continuous listening for speech (always-on mode)
   * @param {Function} onSpeechDetected - Callback when speech is first detected
   * @param {Function} onResult - Callback when speech is recognized
   * @param {Function} onError - Callback on error
   * @returns {Promise<void>}
   */
  async startContinuousListening(onSpeechDetected, onResult, onError) {
    this.isContinuousListening = true;
    this.onSpeechDetectedCallback = onSpeechDetected;
    // Store the original callbacks - don't overwrite them
    this.continuousOnResultCallback = onResult;
    this.continuousOnErrorCallback = onError;
    
    // Start the first listening cycle
    await this.startListeningCycle();
  }

  /**
   * Start a single listening cycle (used for continuous mode)
   * @returns {Promise<void>}
   */
  async startListeningCycle() {
    if (!this.isContinuousListening) {
      LoggingService.debug('[SpeechRecognition] Not in continuous mode, skipping cycle start');
      return;
    }

    // If already listening, we don't need to start a new cycle
    if (this.isListening) {
      LoggingService.debug('[SpeechRecognition] Already listening, skipping cycle start');
      return;
    }

    // If still processing, wait a bit and try again
    if (this.isProcessingRecording) {
      LoggingService.debug('[SpeechRecognition] Still processing recording, will retry later');
      setTimeout(() => {
        if (this.isContinuousListening && !this.isListening) {
          this.startListeningCycle();
        }
      }, 1000);
      return;
    }

    // Reset processing flag for new cycle
    this.isProcessingResult = false;

    // Wait a bit before starting next cycle to avoid immediate restart
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!this.isContinuousListening) {
      LoggingService.debug('[SpeechRecognition] Continuous mode disabled during wait, skipping');
      return;
    }

    // Final check before starting
    if (this.isListening || this.isProcessingRecording) {
      LoggingService.debug('[SpeechRecognition] State changed during wait, skipping cycle start');
      return;
    }

    LoggingService.debug('[SpeechRecognition] Starting new listening cycle');

    try {
      await this.startListening(
        (text) => {
          // Speech recognized - call the continuous callback directly
          // Don't use this.onResultCallback here as it gets overwritten
          if (this.continuousOnResultCallback) {
            this.continuousOnResultCallback(text);
          }
          // For Web Speech API continuous mode, recognition keeps running
          // For native, restart listening cycle after processing completes
          // Note: We don't restart here - the callback handler will restart when ready
        },
        (error) => {
          // Error occurred - call the continuous callback directly
          if (this.continuousOnErrorCallback) {
            this.continuousOnErrorCallback(error);
          }
          // Restart listening cycle even on error (for continuous mode)
          // Only restart if still in continuous mode and not processing
          if (this.isContinuousListening && !this.isProcessingRecording) {
            setTimeout(() => {
              if (this.isContinuousListening && !this.isListening && !this.isProcessingRecording) {
                this.startListeningCycle();
              }
            }, 1000);
          }
        }
      );
    } catch (error) {
      LoggingService.error('Error starting listening cycle:', error);
      // Restart after error if still in continuous mode
      if (this.isContinuousListening && !this.isProcessingRecording) {
        setTimeout(() => {
          if (this.isContinuousListening && !this.isListening && !this.isProcessingRecording) {
            this.startListeningCycle();
          }
        }, 2000);
      }
    }
  }

  /**
   * Start listening for speech
   * @param {Function} onResult - Callback when speech is recognized
   * @param {Function} onError - Callback on error
   * @returns {Promise<void>}
   */
  async startListening(onResult, onError) {
    if (this.isListening) {
      LoggingService.warn('Speech recognition already listening');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isListening = true;

    // Web platform: Use Web Speech API (works in Expo Go web)
    if (Platform.OS === 'web') {
      return this.startWebSpeechRecognition();
    }

    // Native platforms: Use OpenAI Whisper API
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return this.startNativeRecordingWithWhisper();
    }

    // Unsupported platform
    const error = new Error('Speech recognition not supported on this platform');
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
    this.stopListening();
  }

  /**
   * Start Web Speech API recognition (works in Expo Go web)
   * @returns {Promise<void>}
   */
  async startWebSpeechRecognition() {
    if (!webSpeechRecognition) {
      const error = new Error('Web Speech API not available in this browser. Please use Chrome, Edge, or Safari.');
      LoggingService.warn('Web Speech API not available');
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      this.stopListening();
      return;
    }

    try {
      // Create new recognition instance
      const recognition = new webSpeechRecognition();
      
      // Configure for Australian English
      recognition.lang = 'en-AU';
      recognition.continuous = this.isContinuousListening; // Continuous mode if enabled
      recognition.interimResults = this.isContinuousListening; // Show interim results in continuous mode for better UX

      // Set up event handlers
      recognition.onstart = () => {
        LoggingService.debug('Web Speech recognition started');
      };

      recognition.onspeechstart = () => {
        // Speech detected - notify callback
        if (this.onSpeechDetectedCallback) {
          this.onSpeechDetectedCallback();
        }
      };

      recognition.onresult = (event) => {
        if (event.results && event.results.length > 0) {
          // Get the last result (most recent transcription)
          const lastResult = event.results[event.results.length - 1];
          const transcript = lastResult[0].transcript;
          
          // Only process final results (not interim) and if not already processing
          if (lastResult.isFinal && !this.isProcessingResult && transcript.trim()) {
            this.isProcessingResult = true;
            LoggingService.debug('Speech recognized:', transcript);
            if (this.onResultCallback) {
              // Call callback and reset flag after a short delay to allow processing
              this.onResultCallback(transcript);
              // Reset flag after callback (caller should handle the processing)
              // The flag will be reset when the next cycle starts or when explicitly reset
            }
          }
        }
        // Don't stop listening if in continuous mode
        if (!this.isContinuousListening) {
          this.stopListening();
        }
      };

      recognition.onerror = (event) => {
        LoggingService.error('Web Speech recognition error:', event.error);
        if (this.onErrorCallback) {
          this.onErrorCallback(new Error(event.error || 'Speech recognition failed'));
        }
        // Don't stop listening if in continuous mode (will restart)
        if (!this.isContinuousListening) {
          this.stopListening();
        }
      };

      recognition.onend = () => {
        LoggingService.debug('Web Speech recognition ended');
        // Don't stop listening if in continuous mode (will restart)
        if (!this.isContinuousListening) {
          this.stopListening();
        }
      };

      // Store recognition instance for stopping
      this.webRecognition = recognition;

      // Start recognition
      recognition.start();
      LoggingService.debug('Web Speech recognition started successfully');
    } catch (error) {
      LoggingService.error('Error starting Web Speech recognition:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      this.stopListening();
    }
  }

  /**
   * Start native recording with OpenAI Whisper API (works in Expo Go)
   * Uses expo-av to record audio, then sends to OpenAI Whisper API
   * @returns {Promise<void>}
   */
  async startNativeRecordingWithWhisper() {
    // Check permissions
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      const error = new Error('Microphone permission denied');
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      this.stopListening();
      return;
    }

    // Check if OpenAI API key is configured
    if (!this.openaiKey) {
      const error = new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in .env file.');
      LoggingService.warn('OpenAI API key not configured');
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      this.stopListening();
      return;
    }

    try {
      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording instance
      // expo-av records in m4a format, which OpenAI Whisper accepts
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isProcessingRecording = false;
      this.speechDetected = false;
      LoggingService.debug('Audio recording started for Whisper API');

      // For continuous listening, we'll record for a shorter duration and check for speech
      // Start polling recording status to detect speech
      this.startRecordingStatusPoll();

      // Set timeout to stop recording after max duration
      this.recognitionTimeout = setTimeout(() => {
        // Only stop if still recording and not already processing
        if (this.recording && !this.isProcessingRecording && this.isListening) {
          LoggingService.debug('Max recording duration reached, stopping recording');
          this.stopRecordingAndTranscribe();
        }
      }, this.maxRecordingDuration);

    } catch (error) {
      LoggingService.error('Error starting audio recording:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      this.stopListening();
    }
  }

  /**
   * Start polling recording status to detect speech
   */
  startRecordingStatusPoll() {
    if (!this.recording || !this.isListening) return;

    // Clear any existing polling interval first
    if (this.recordingPollInterval) {
      clearInterval(this.recordingPollInterval);
      this.recordingPollInterval = null;
    }

    const pollInterval = setInterval(async () => {
      if (!this.recording || !this.isListening || this.isProcessingRecording) {
        clearInterval(pollInterval);
        this.recordingPollInterval = null;
        return;
      }

      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording && status.metering !== undefined && status.metering > -50) {
          // Audio detected (metering > -50 dB indicates speech)
          if (this.onSpeechDetectedCallback && !this.speechDetected) {
            this.speechDetected = true;
            this.onSpeechDetectedCallback();
          }
          // Reset silence timeout when speech is detected
          if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
          }
          // Set timeout for silence detection (stop after 2 seconds of silence)
          // Clear any existing silence timeout first
          if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
          }
          
          this.silenceTimeout = setTimeout(() => {
            // Double-check conditions before stopping
            if (!this.isListening || !this.recording || this.isProcessingRecording) {
              LoggingService.debug('Conditions changed, not stopping recording');
              return;
            }
            
            LoggingService.debug('Silence detected, stopping recording');
            
            // Clear interval BEFORE calling stopRecordingAndTranscribe
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            this.recordingPollInterval = null;
            
            // Clear silence timeout BEFORE calling stopRecordingAndTranscribe
            if (this.silenceTimeout) {
              clearTimeout(this.silenceTimeout);
              this.silenceTimeout = null;
            }
            
            // Only call if still valid
            if (this.recording && !this.isProcessingRecording) {
              this.stopRecordingAndTranscribe();
            }
          }, this.silenceDuration);
        }
      } catch (error) {
        LoggingService.debug('Error polling recording status:', error);
        clearInterval(pollInterval);
        this.recordingPollInterval = null;
      }
    }, 200); // Poll every 200ms

    // Store interval ID for cleanup
    this.recordingPollInterval = pollInterval;
  }

  /**
   * Stop recording and transcribe using OpenAI Whisper API
   */
  async stopRecordingAndTranscribe() {
    // Prevent duplicate processing - use a lock pattern
    if (this.isProcessingRecording) {
      LoggingService.debug('Already processing recording, skipping duplicate call');
      return;
    }

    if (!this.recording) {
      LoggingService.debug('No recording to process, skipping');
      return;
    }

    // Set flag IMMEDIATELY to prevent any re-entry
    this.isProcessingRecording = true;

    // Clear polling interval FIRST before processing
    if (this.recordingPollInterval) {
      clearInterval(this.recordingPollInterval);
      this.recordingPollInterval = null;
    }

    // Clear silence timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    // Clear recognition timeout
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }

    try {
      // Get URI before stopping (in case recording is already stopped)
      let recordingUri;
      try {
        recordingUri = this.recording.getURI();
      } catch (e) {
        LoggingService.debug('Error getting recording URI:', e);
      }
      
      // Check recording status before stopping
      let status;
      try {
        status = await this.recording.getStatusAsync();
      } catch (e) {
        LoggingService.debug('Error getting recording status:', e);
        status = { isRecording: false };
      }
      
      // Store reference before nulling
      const recordingRef = this.recording;
      this.recording = null;
      
      // Only stop if still recording
      if (status && status.isRecording) {
        try {
          await recordingRef.stopAndUnloadAsync();
        } catch (stopError) {
          LoggingService.debug('Error stopping recording:', stopError);
          // Try to unload anyway
          try {
            await recordingRef.unloadAsync();
          } catch (unloadError) {
            LoggingService.debug('Error unloading recording:', unloadError);
          }
        }
      } else {
        // Already stopped, just unload if needed
        try {
          await recordingRef.unloadAsync();
        } catch (unloadError) {
          // Ignore if already unloaded
          LoggingService.debug('Recording already unloaded or error unloading:', unloadError);
        }
      }

      // Get URI from the recording ref if we don't have it
      if (!recordingUri) {
        try {
          recordingUri = recordingRef.getURI();
        } catch (e) {
          LoggingService.debug('Error getting URI from recording ref:', e);
        }
      }

      if (!recordingUri) {
        this.isProcessingRecording = false;
        LoggingService.warn('No audio file recorded, skipping transcription');
        // Restart listening cycle for continuous mode (only if not already listening)
        if (this.isContinuousListening && !this.isListening) {
          setTimeout(() => {
            if (this.isContinuousListening && !this.isListening && !this.isProcessingRecording) {
              this.startListeningCycle();
            }
          }, 500);
        }
        return;
      }

      LoggingService.debug('Recording stopped, sending to OpenAI Whisper API:', recordingUri);

      // Send audio to OpenAI Whisper API and get transcript
      const transcript = await this.transcribeWithWhisper(recordingUri);
      
      // Store transcript and callback before clearing flags
      const transcriptText = transcript?.trim();
      // Use the continuous callback, not the one from startListening (which gets overwritten)
      const callback = this.isContinuousListening ? this.continuousOnResultCallback : this.onResultCallback;
      const wasContinuous = this.isContinuousListening;
      
      LoggingService.debug('[SpeechRecognition] Transcription complete:', transcriptText);
      
      // Clear the recording reference BEFORE calling callback
      // This prevents any recursive calls from accessing the recording
      this.recording = null;
      
      // Mark processing as complete BEFORE calling callback
      this.isProcessingRecording = false;

      // In continuous listening mode, process any speech (no wake word required)
      if (wasContinuous) {
        if (transcriptText) {
          LoggingService.debug('[SpeechRecognition] Calling continuous callback with transcript:', transcriptText);
          // Call callback AFTER clearing all flags, use setTimeout to prevent stack overflow
          if (callback) {
            // Use setTimeout to ensure callback runs asynchronously and doesn't cause recursion
            // Pass the transcript to callback - the ChatScreen will decide what to do with it
            setTimeout(() => {
              try {
                callback(transcriptText);
              } catch (callbackError) {
                LoggingService.error('[SpeechRecognition] Error in transcription callback:', callbackError);
              }
            }, 0);
          } else {
            LoggingService.warn('[SpeechRecognition] No callback registered for transcription result');
          }
          // Note: startListeningCycle will be called from the callback handler when ready
        } else {
          LoggingService.debug('Empty transcript, ignoring');
          // Only restart if we're still in continuous mode and not processing
          if (this.isContinuousListening && !this.isProcessingRecording && !this.isListening) {
            setTimeout(() => {
              if (this.isContinuousListening && !this.isListening && !this.isProcessingRecording) {
                this.startListeningCycle();
              }
            }, 500);
          }
        }
      } else {
        // Original wake word logic for manual mode
        // Check if wake word is in the transcript
        if (this.containsWakeWord(transcript)) {
          // Extract question (text after wake word)
          const question = this.extractQuestion(transcript);
          
          if (question) {
            LoggingService.debug('Wake word detected, question:', question);
            if (this.onResultCallback) {
              this.onResultCallback(question, true); // Pass true to indicate wake word was detected
            }
          } else {
            LoggingService.debug('Wake word detected but no question found');
            if (this.onResultCallback) {
              this.onResultCallback('Hey McCarthy', true); // Just wake word, no question
            }
          }
        } else {
          // No wake word detected - don't process
          LoggingService.debug('No wake word detected in transcript:', transcript);
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('Wake word not detected. Please say "Hey McCarthy" followed by your question.'));
          }
        }
      }

    } catch (error) {
      LoggingService.error('Error stopping recording:', error);
      
      // Clear all timeouts and intervals FIRST
      if (this.recordingPollInterval) {
        clearInterval(this.recordingPollInterval);
        this.recordingPollInterval = null;
      }
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
      if (this.recognitionTimeout) {
        clearTimeout(this.recognitionTimeout);
        this.recognitionTimeout = null;
      }
      
      // Clear recording reference
      const wasContinuous = this.isContinuousListening;
      this.recording = null;
      
      // Reset processing flag BEFORE callback
      this.isProcessingRecording = false;
      
      // Store error callback before clearing
      // Use the continuous callback if in continuous mode
      const errorCallback = this.isContinuousListening ? this.continuousOnErrorCallback : this.onErrorCallback;
      
      if (errorCallback) {
        try {
          errorCallback(error);
        } catch (callbackError) {
          LoggingService.error('Error in error callback:', callbackError);
        }
      }
      
      // For continuous mode, restart listening cycle after error (only if not already listening)
      if (wasContinuous && !this.isListening && !this.isProcessingRecording) {
        setTimeout(() => {
          if (this.isContinuousListening && !this.isListening && !this.isProcessingRecording) {
            this.startListeningCycle();
          }
        }, 1000);
      } else if (!wasContinuous) {
        this.stopListening();
      }
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   * Simple implementation - no complex transcoding needed
   * @param {string} audioUri - URI of the recorded audio file
   * @returns {Promise<string>} Transcribed text
   */
  async transcribeWithWhisper(audioUri) {
    try {
      // Create FormData for OpenAI API
      const formData = new FormData();
      
      // Get file extension from URI
      const fileExtension = audioUri.split('.').pop() || 'm4a';
      const fileName = `recording.${fileExtension}`;
      
      // Add audio file to FormData
      // For React Native, we need to send the file URI directly
      formData.append('file', {
        uri: audioUri,
        type: `audio/${fileExtension}`,
        name: fileName,
      });
      
      // Add language (Australian English)
      formData.append('language', 'en');
      
      // Add model
      formData.append('model', 'whisper-1');

      // Send to OpenAI Whisper API
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.openaiKey}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 seconds timeout for transcription
        }
      );

      // Extract transcript from response
      const transcript = response.data?.text;

      if (transcript) {
        LoggingService.debug('Speech transcribed with Whisper:', transcript);
        return transcript;
      } else {
        throw new Error('No transcript in Whisper API response');
      }
    } catch (error) {
      LoggingService.error('Error transcribing with Whisper:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to transcribe audio';
      throw new Error(`Whisper API error: ${errorMessage}`);
    }
  }

  /**
   * Check if text contains wake word "Hey, McCarthy" or "Hey McCarthy"
   * @param {string} text - Text to check
   * @returns {boolean}
   */
  containsWakeWord(text) {
    if (!text) return false;
    
    // Normalize text: lowercase, remove extra spaces, handle punctuation
    const normalizedText = text.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Remove commas, periods, and other punctuation for flexible matching
    // This handles "hey mccarthy", "hey, mccarthy", "hey. mccarthy", etc.
    const textWithoutPunctuation = normalizedText.replace(/[,.\-!?]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Check if text starts with "hey mccarthy" (most common case)
    // Also check if it appears early in the text (within first 30 characters after normalization)
    const wakeWordPattern = 'hey mccarthy';
    const wakeWordIndex = textWithoutPunctuation.indexOf(wakeWordPattern);
    
    // Wake word should be at the start or appear early in the text
    // This ensures "Hey, McCarthy, can you..." is detected but "Can you say Hey, McCarthy" is not
    return wakeWordIndex === 0 || (wakeWordIndex > 0 && wakeWordIndex < 30);
  }

  /**
   * Extract question from text after wake word
   * @param {string} text - Full transcribed text
   * @returns {string} Question text (without wake word)
   */
  extractQuestion(text) {
    if (!text) return '';
    
    const normalizedText = text.toLowerCase();
    const wakeWord = 'hey mccarthy';
    const wakeWordIndex = normalizedText.indexOf(wakeWord);
    
    if (wakeWordIndex === -1) {
      return text; // No wake word found, return original
    }
    
    // Extract text after wake word
    const afterWakeWord = text.substring(wakeWordIndex + wakeWord.length).trim();
    
    // Remove any leading punctuation or "hey" variations
    return afterWakeWord.replace(/^[,.\s]+/, '').trim();
  }

  /**
   * Process recording when done (called from status callback)
   * Note: This is a fallback - we primarily use timeout or manual stop
   */
  async processRecording() {
    // Use the main stop method to avoid duplicate processing
    await this.stopRecordingAndTranscribe();
  }

  /**
   * Stop continuous listening
   */
  async stopContinuousListening() {
    this.isContinuousListening = false;
    this.isProcessingResult = false;
    // Clear continuous callbacks
    this.continuousOnResultCallback = null;
    this.continuousOnErrorCallback = null;
    await this.stopListening();
  }

  /**
   * Reset processing flag (call this when ready to process next result)
   */
  resetProcessingFlag() {
    this.isProcessingResult = false;
  }

  /**
   * Reset all processing flags (useful when wake word is not detected and we need to restart)
   */
  resetAllProcessingFlags() {
    this.isProcessingResult = false;
    this.isProcessingRecording = false;
    this.speechDetected = false;
  }

  /**
   * Stop listening for speech
   * This also resets flags to ensure clean state for restart
   */
  async stopListening() {
    const wasListening = this.isListening;
    
    // Always reset flags, even if not currently listening
    // This ensures clean state for restart
    this.isListening = false;
    this.speechDetected = false;
    this.isProcessingResult = false;
    this.isProcessingRecording = false; // Also reset processing recording flag
    
    if (!wasListening) {
      LoggingService.debug('[SpeechRecognition] Not listening, but flags reset for clean state');
      // Still need to clean up any resources
    } else {
      LoggingService.debug('[SpeechRecognition] Stopping listening');
    }

    // Clear silence timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    // Clear recording poll interval FIRST
    if (this.recordingPollInterval) {
      clearInterval(this.recordingPollInterval);
      this.recordingPollInterval = null;
    }

    // Stop Web Speech API recognition
    if (this.webRecognition) {
      try {
        this.webRecognition.stop();
        this.webRecognition = null;
      } catch (error) {
        LoggingService.debug('Error stopping Web Speech recognition (non-critical):', error.message);
      }
    }

    // Stop native recording
    if (this.recording) {
      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          await this.recording.stopAndUnloadAsync();
        } else {
          // Already stopped, just unload
          try {
            await this.recording.unloadAsync();
          } catch (unloadError) {
            // Ignore if already unloaded
          }
        }
        this.recording = null;
        this.isProcessingRecording = false;
      } catch (error) {
        LoggingService.debug('Error stopping recording (non-critical):', error.message);
        this.recording = null;
        this.isProcessingRecording = false;
      }
    }

    // Clear timeout
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }

    // Reset audio mode (only if not in continuous mode)
    if (!this.isContinuousListening) {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
        });
      } catch (error) {
        // Ignore errors
      }
    }
  }

  /**
   * Cancel current recognition
   */
  async cancel() {
    await this.stopListening();
  }
}

export default new SpeechRecognitionService();
