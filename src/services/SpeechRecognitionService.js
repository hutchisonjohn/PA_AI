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
    this.silenceDuration = 800; // 0.8 seconds of silence to stop recording (optimized for speed)
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

    // If still processing, wait a bit and try again (optimized for speed)
    if (this.isProcessingRecording) {
      LoggingService.debug('[SpeechRecognition] Still processing recording, will retry later');
      setTimeout(() => {
        if (this.isContinuousListening && !this.isListening) {
          this.startListeningCycle();
        }
      }, 500);
      return;
    }

    // Reset processing flag for new cycle
    this.isProcessingResult = false;

    // Wait a bit before starting next cycle to avoid immediate restart (optimized for speed)
    await new Promise(resolve => setTimeout(resolve, 200));

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
          // Only restart if still in continuous mode and not processing (optimized for speed)
          if (this.isContinuousListening && !this.isProcessingRecording) {
            setTimeout(() => {
              if (this.isContinuousListening && !this.isListening && !this.isProcessingRecording) {
                this.startListeningCycle();
              }
            }, 500);
          }
        }
      );
    } catch (error) {
      LoggingService.error('Error starting listening cycle:', error);
      // Restart after error if still in continuous mode (optimized for speed)
      if (this.isContinuousListening && !this.isProcessingRecording) {
        setTimeout(() => {
          if (this.isContinuousListening && !this.isListening && !this.isProcessingRecording) {
            this.startListeningCycle();
          }
        }, 800);
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
          // Set timeout for silence detection (optimized for speed)
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
    }, 150); // Poll every 150ms (optimized for faster wake word detection)

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
      let transcript = '';
      try {
        transcript = await this.transcribeWithWhisper(recordingUri);
      } catch (transcribeError) {
        // Log the error but don't throw - we'll handle empty transcript below
        LoggingService.warn('[SpeechRecognition] Transcription error (will treat as empty):', transcribeError.message);
        transcript = ''; // Treat errors as empty transcript
      }
      
      // Store transcript and callback before clearing flags
      const transcriptText = transcript?.trim() || '';
      // Use the continuous callback, not the one from startListening (which gets overwritten)
      const callback = this.isContinuousListening ? this.continuousOnResultCallback : this.onResultCallback;
      const wasContinuous = this.isContinuousListening;
      
      LoggingService.debug('[SpeechRecognition] Transcription complete:', transcriptText || '(empty)');
      
      // Clear the recording reference BEFORE calling callback
      // This prevents any recursive calls from accessing the recording
      this.recording = null;
      
      // Mark processing as complete BEFORE calling callback
      this.isProcessingRecording = false;
      
      // CRITICAL: Reset isListening flag so a new cycle can start
      // The recording has stopped and transcription is complete, so we're no longer actively listening
      this.isListening = false;
      LoggingService.debug('[SpeechRecognition] Recording and transcription complete, isListening set to false');

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
          // The callback handler (ChatScreen) is responsible for restarting the cycle
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
      // Check if audio file exists and has content
      try {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists) {
          LoggingService.warn('Audio file does not exist:', audioUri);
          throw new Error('Audio file not found');
        }
        if (fileInfo.size === 0) {
          LoggingService.warn('Audio file is empty:', audioUri);
          throw new Error('Audio file is empty');
        }
        LoggingService.debug('Audio file size:', fileInfo.size, 'bytes');
      } catch (fileError) {
        LoggingService.error('Error checking audio file:', fileError);
        throw new Error(`Audio file error: ${fileError.message}`);
      }

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

      LoggingService.debug('Sending audio to Whisper API, file:', fileName);

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

      // Log response for debugging (but not the full response data)
      LoggingService.debug('Whisper API response status:', response.status);
      LoggingService.debug('Whisper API response data keys:', Object.keys(response.data || {}));

      // Extract transcript from response
      // Whisper API can return text directly or in a text field
      let transcript = response.data?.text;
      
      // If no text field, check if response.data is a string
      if (!transcript && typeof response.data === 'string') {
        transcript = response.data;
      }
      
      // If still no transcript, check for alternative response formats
      if (!transcript && response.data) {
        // Some APIs might return the transcript in different fields
        transcript = response.data.transcript || response.data.transcription || response.data.result;
      }

      // Trim whitespace
      if (transcript) {
        transcript = transcript.trim();
      }

      if (transcript && transcript.length > 0) {
        LoggingService.debug('Speech transcribed with Whisper:', transcript);
        return transcript;
      } else {
        // Empty transcript - might be silence or very short audio
        LoggingService.warn('Whisper API returned empty transcript. Response:', JSON.stringify(response.data).substring(0, 200));
        // Return empty string instead of throwing error - let the caller handle it
        return '';
      }
    } catch (error) {
      // Enhanced error logging
      if (error.response) {
        LoggingService.error('Whisper API error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      } else if (error.request) {
        LoggingService.error('Whisper API request error - no response received:', error.message);
      } else {
        LoggingService.error('Whisper API error:', error.message);
      }
      
      const errorMessage = error.response?.data?.error?.message || 
                          error.message || 
                          'Failed to transcribe audio';
      throw new Error(`Whisper API error: ${errorMessage}`);
    }
  }

  /**
   * Calculate Levenshtein distance between two strings (for fuzzy matching)
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,     // deletion
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j - 1] + 1  // substitution
          );
        }
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Check if a word is similar to "mccarthy" using fuzzy matching
   * Handles transcription errors like "MCOTC", "Kathy", "Cassie", "Epcotgy", "M Coffee", etc.
   * @param {string} word - Word to check
   * @returns {boolean}
   */
  isSimilarToMcCarthy(word) {
    if (!word) return false;
    
    const normalized = word.toLowerCase().trim();
    const target = 'mccarthy';
    
    // Exact match
    if (normalized === target) return true;
    
    // Check for "carthy" (common transcription error - missing "Mc")
    if (normalized.includes('carthy') && normalized.length >= 5) {
      return true;
    }
    
    // Phonetic variations that sound like "McCarthy"
    // "Cassie" / "Cassie" - common transcription error
    if (normalized === 'cassie' || normalized === 'cassy' || normalized === 'casi' || 
        normalized.startsWith('cass') && normalized.length <= 7) {
      return true;
    }
    
    // "Scotty" / "Scotty" - phonetically similar to "McCarthy"
    if (normalized === 'scotty' || normalized === 'scotti' || normalized === 'scotie' ||
        normalized.startsWith('scott') && normalized.length <= 7) {
      return true;
    }
    
    // "Kathy" / "Kathi" - phonetically similar
    if (normalized === 'kathy' || normalized === 'kathi' || normalized === 'kathie' ||
        normalized.startsWith('kath') && normalized.length <= 7) {
      return true;
    }
    
    // "Epcotgy" - transcription error (sounds like "McCarthy")
    if (normalized.includes('epcot') || normalized.includes('epcotgy') || 
        normalized.includes('epcot') || normalized.startsWith('epcot')) {
      return true;
    }
    
    // "Coffee" when preceded by "M" - "M Coffee" sounds like "McCarthy"
    if (normalized === 'coffee' || normalized === 'coffe' || normalized.startsWith('coff')) {
      return true;
    }
    
    // Check for "mc" followed by something similar to "carthy"
    if (normalized.startsWith('mc') && normalized.length >= 4) {
      const afterMc = normalized.substring(2);
      // Handle variations like "MCOTC" (MC + OTC)
      // Check if it's similar to "carthy" (allowing for typos)
      if (afterMc.includes('carth') || afterMc.includes('crth') || 
          afterMc.includes('carty') || afterMc.includes('otc') ||
          afterMc.includes('arth') || afterMc.includes('rth') ||
          afterMc.includes('coff') || afterMc.includes('epcot')) {
        return true;
      }
      // If it's 3-6 characters after "mc", it might be a variation
      if (afterMc.length >= 3 && afterMc.length <= 6) {
        // Check Levenshtein distance for the part after "mc"
        const mccarthyAfterMc = 'carthy';
        const distance = this.levenshteinDistance(afterMc, mccarthyAfterMc);
        if (distance <= 3) {
          return true;
        }
      }
    }
    
    // Check for words that start with "carth", "crth", "kath", "cass", "epcot" (phonetic variations)
    if (normalized.startsWith('carth') || normalized.startsWith('crth') || 
        normalized.startsWith('kath') || normalized.startsWith('carty') ||
        normalized.startsWith('cass') || normalized.startsWith('epcot')) {
      return true;
    }
    
    // Fuzzy match using Levenshtein distance
    // Allow up to 5 character differences for McCarthy (9 chars) - more lenient
    const maxDistance = Math.max(4, Math.floor(normalized.length * 0.6));
    const distance = this.levenshteinDistance(normalized, target);
    
    if (distance <= maxDistance) {
      return true;
    }
    
    // Check if word contains key parts of "mccarthy"
    // Look for "carth", "crth", "kath", "cass", "epcot", "otc", "coff" patterns (phonetic matches)
    if (normalized.includes('carth') || normalized.includes('crth') || 
        normalized.includes('carty') || normalized.includes('carthy') ||
        normalized.includes('kath') || normalized.includes('otc') ||
        normalized.includes('cass') || normalized.includes('epcot') ||
        normalized.includes('coff')) {
      return true;
    }
    
    // Special case: Short words that might be McCarthy variations
    // "MCOTC", "Cassie", "Kathy", etc.
    if (normalized.length >= 4 && normalized.length <= 8) {
      // For short words that might be McCarthy variations
      const shortDistance = this.levenshteinDistance(normalized, target);
      if (shortDistance <= 5) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if text contains wake word "Hey, McCarthy" or variations
   * Handles transcription errors like "I am Carthy", "M Crthy", "Hey MCOTC", "Hey, I'm Kathy", etc.
   * @param {string} text - Text to check
   * @returns {boolean}
   */
  containsWakeWord(text) {
    if (!text) return false;
    
    // Normalize text: lowercase, remove extra spaces, handle punctuation
    const normalizedText = text.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Remove commas, periods, and other punctuation for flexible matching
    const textWithoutPunctuation = normalizedText.replace(/[,.\-!?']/g, ' ').replace(/\s+/g, ' ').trim();
    
    // First, try exact match for "hey mccarthy" (most common case)
    const exactPattern = 'hey mccarthy';
    const exactIndex = textWithoutPunctuation.indexOf(exactPattern);
    if (exactIndex === 0 || (exactIndex > 0 && exactIndex < 30)) {
      return true;
    }
    
    // Split text into words for analysis
    const words = textWithoutPunctuation.split(/\s+/).filter(w => w.length > 0);
    
    // Look for "McCarthy" variations in the first few words (wake word should be early)
    // Check first 6 words for McCarthy-like patterns (increased from 5 to catch "Hey, I'm Kathy")
    const wordsToCheck = words.slice(0, 6);
    
    for (let i = 0; i < wordsToCheck.length; i++) {
      const word = wordsToCheck[i];
      
      // Check if this word is similar to "mccarthy"
      if (this.isSimilarToMcCarthy(word)) {
        // Found a McCarthy-like word early in the text
        // This could be the wake word even if "Hey" was transcribed incorrectly
        // Examples: "I am Carthy", "M Crthy", "How are you Carthy", "Hey MCOTC", "Hey, I'm Kathy"
        
        // If it's in the first 3 words, it's very likely the wake word
        if (i < 3) {
          return true;
        }
        
        // If it's in position 3-5, check if there's a greeting-like word before it
        // Common transcription errors for "Hey": "I", "M", "How", "Hi", "I'm", etc.
        const prevWord = i > 0 ? wordsToCheck[i - 1] : '';
        const prevPrevWord = i > 1 ? wordsToCheck[i - 2] : '';
        const greetingWords = ['hey', 'hi', 'i', 'm', 'im', 'how', 'a', 'am', 'are', 'you'];
        
        // Check if previous word is a greeting, or if we have "I'm" or "I am" pattern
        if (greetingWords.includes(prevWord) || 
            greetingWords.includes(prevPrevWord) ||
            prevWord.length <= 2 ||
            (prevWord === 'im' && prevPrevWord === 'i')) {
          return true;
        }
      }
    }
    
    // Also check for "hey" followed by something similar to "mccarthy" (even if not adjacent)
    // This handles "Hey MCOTC", "Hey, I'm Kathy", "Hey M Coffee", "Hey, I'm Cassie", etc.
    const heyIndex = textWithoutPunctuation.indexOf('hey');
    if (heyIndex >= 0 && heyIndex < 30) {
      // Found "hey" early, check if there's a McCarthy-like word nearby
      const afterHey = textWithoutPunctuation.substring(heyIndex + 3).trim();
      const wordsAfterHey = afterHey.split(/\s+/).filter(w => w.length > 0).slice(0, 5); // Check next 5 words
      
      // Check each word after "hey"
      for (const word of wordsAfterHey) {
        if (this.isSimilarToMcCarthy(word)) {
          return true;
        }
      }
      
      // Also check for patterns like "Hey, I'm Kathy" or "Hey M Coffee" where words are between "Hey" and McCarthy
      // Look for "im", "i", "am", "m" followed by a McCarthy-like word
      for (let i = 0; i < wordsAfterHey.length - 1; i++) {
        const currentWord = wordsAfterHey[i];
        const nextWord = wordsAfterHey[i + 1];
        
        // If we see "im", "i", "am", "m" followed by a McCarthy-like word
        // Examples: "Hey, I'm Cassie", "Hey M Coffee"
        if ((currentWord === 'im' || currentWord === 'i' || currentWord === 'am' || currentWord === 'm') &&
            this.isSimilarToMcCarthy(nextWord)) {
          return true;
        }
      }
      
      // Check for "Hey" followed by "M" and then "Coffee" (two words: "M Coffee")
      // This handles "Hey M Coffee" transcription
      if (wordsAfterHey.length >= 2) {
        const firstWord = wordsAfterHey[0];
        const secondWord = wordsAfterHey[1];
        if ((firstWord === 'm' || firstWord === 'im' || firstWord === 'i') &&
            this.isSimilarToMcCarthy(secondWord)) {
          return true;
        }
      }
    }
    
    // Special case: Check if text starts with a McCarthy-like word (very likely wake word)
    if (words.length > 0 && this.isSimilarToMcCarthy(words[0])) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract question from text after wake word
   * Handles transcription variations of the wake word
   * @param {string} text - Full transcribed text
   * @returns {string} Question text (without wake word)
   */
  extractQuestion(text) {
    if (!text) return '';
    
    const normalizedText = text.toLowerCase();
    const words = normalizedText.split(/\s+/);
    
    // First, try exact match for "hey mccarthy"
    const exactWakeWord = 'hey mccarthy';
    const exactIndex = normalizedText.indexOf(exactWakeWord);
    if (exactIndex !== -1) {
      const afterWakeWord = text.substring(exactIndex + exactWakeWord.length).trim();
      return afterWakeWord.replace(/^[,.\s]+/, '').trim();
    }
    
    // Find McCarthy-like word in the text
    let mccarthyIndex = -1;
    for (let i = 0; i < Math.min(words.length, 5); i++) {
      if (this.isSimilarToMcCarthy(words[i])) {
        mccarthyIndex = i;
        break;
      }
    }
    
    if (mccarthyIndex === -1) {
      // No wake word found, return original text
      return text;
    }
    
    // Extract text after the McCarthy-like word
    // Find the position in the original text
    let charIndex = 0;
    for (let i = 0; i < mccarthyIndex; i++) {
      charIndex += words[i].length + 1; // +1 for space
    }
    
    // Find the end of the McCarthy word
    const mccarthyWord = words[mccarthyIndex];
    const endOfMcCarthy = charIndex + mccarthyWord.length;
    
    // Extract everything after the McCarthy word
    const afterWakeWord = text.substring(endOfMcCarthy).trim();
    
    // Remove any leading punctuation, spaces, or common filler words
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
   * Force reset listening state - useful when restarting after wake word detection
   * This ensures isListening is false so a new cycle can start
   */
  forceResetListeningState() {
    LoggingService.debug('[SpeechRecognition] Force resetting listening state');
    this.isListening = false;
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
