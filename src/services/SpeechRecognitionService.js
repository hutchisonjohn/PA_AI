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
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.recognitionTimeout = null;
    this.maxRecordingDuration = 30000; // 30 seconds
    this.webRecognition = null; // Web Speech API recognition instance
    this.recording = null; // expo-av recording instance
    this.isProcessingRecording = false; // Flag to prevent duplicate processing
    
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
      recognition.continuous = false; // Stop after first result
      recognition.interimResults = false; // Only final results

      // Set up event handlers
      recognition.onstart = () => {
        LoggingService.debug('Web Speech recognition started');
      };

      recognition.onresult = (event) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          LoggingService.debug('Speech recognized:', transcript);
          if (this.onResultCallback) {
            this.onResultCallback(transcript);
          }
        }
        this.stopListening();
      };

      recognition.onerror = (event) => {
        LoggingService.error('Web Speech recognition error:', event.error);
        if (this.onErrorCallback) {
          this.onErrorCallback(new Error(event.error || 'Speech recognition failed'));
        }
        this.stopListening();
      };

      recognition.onend = () => {
        LoggingService.debug('Web Speech recognition ended');
        this.stopListening();
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
      LoggingService.debug('Audio recording started for Whisper API');

      // Set timeout to stop recording after max duration
      this.recognitionTimeout = setTimeout(() => {
        this.stopRecordingAndTranscribe();
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
   * Stop recording and transcribe using OpenAI Whisper API
   */
  async stopRecordingAndTranscribe() {
    // Prevent duplicate processing
    if (this.isProcessingRecording || !this.recording) {
      return;
    }

    this.isProcessingRecording = true;

    try {
      // Get URI before stopping (in case recording is already stopped)
      const uri = this.recording.getURI();
      
      // Check recording status before stopping
      const status = await this.recording.getStatusAsync();
      
      // Only stop if still recording
      if (status.isRecording) {
        await this.recording.stopAndUnloadAsync();
      } else {
        // Already stopped, just unload if needed
        try {
          await this.recording.unloadAsync();
        } catch (unloadError) {
          // Ignore if already unloaded
          LoggingService.debug('Recording already unloaded');
        }
      }

      const recordingUri = uri || this.recording.getURI();
      this.recording = null;

      if (!recordingUri) {
        throw new Error('No audio file recorded');
      }

      LoggingService.debug('Recording stopped, sending to OpenAI Whisper API:', recordingUri);

      // Send audio to OpenAI Whisper API and get transcript
      const transcript = await this.transcribeWithWhisper(recordingUri);
      
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

    } catch (error) {
      LoggingService.error('Error stopping recording:', error);
      this.isProcessingRecording = false;
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      this.stopListening();
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
   * Check if text contains wake word "Hey McCarthy"
   * @param {string} text - Text to check
   * @returns {boolean}
   */
  containsWakeWord(text) {
    if (!text) return false;
    
    const normalizedText = text.toLowerCase().trim();
    const wakeWord = 'hey mccarthy';
    
    // Check if wake word is in the text
    return normalizedText.includes(wakeWord);
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
   * Stop listening for speech
   */
  async stopListening() {
    if (!this.isListening) return;

    this.isListening = false;

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

    // Reset audio mode
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
    } catch (error) {
      // Ignore errors
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
