/**
 * Text-to-Speech Service
 * 
 * Uses native device TTS APIs
 * iOS: AVSpeechSynthesizer
 * Android: TextToSpeech
 * 
 * For Expo, uses expo-speech
 */

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import LoggingService from './LoggingService';

class TextToSpeechService {
  constructor() {
    this.isSpeaking = false;
    this.currentUtteranceId = null;
  }

  /**
   * Check if TTS is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    // expo-speech is available on iOS and Android
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Speak text using native TTS
   * @param {string} text - Text to speak
   * @param {Object} options - TTS options
   * @returns {Promise<void>}
   */
  async speak(text, options = {}) {
    if (!text || !text.trim()) {
      LoggingService.warn('Empty text provided to TTS');
      return;
    }

    try {
      // Stop any current speech
      await this.stop();

      const {
        language = 'en-AU', // Australian English
        pitch = 1.0,
        rate = 1.0,
        volume = 1.0,
        onStart,
        onDone,
        onError,
      } = options;

      this.isSpeaking = true;

      // Use expo-speech for TTS
      Speech.speak(text, {
        language: language,
        pitch: pitch,
        rate: rate,
        volume: volume,
        onStart: () => {
          LoggingService.debug('TTS started speaking');
          if (onStart) onStart();
        },
        onDone: () => {
          LoggingService.debug('TTS finished speaking');
          this.isSpeaking = false;
          if (onDone) onDone();
        },
        onError: (error) => {
          LoggingService.error('TTS error:', error);
          this.isSpeaking = false;
          if (onError) onError(error);
        },
        onStopped: () => {
          LoggingService.debug('TTS stopped');
          this.isSpeaking = false;
        },
      });

      this.currentUtteranceId = text; // expo-speech doesn't return an ID, use text as identifier
    } catch (error) {
      LoggingService.error('Error speaking text:', error);
      this.isSpeaking = false;
      if (options.onError) {
        options.onError(error);
      }
    }
  }

  /**
   * Stop current speech
   */
  async stop() {
    if (!this.isSpeaking) return;

    try {
      Speech.stop();
      this.isSpeaking = false;
      this.currentUtteranceId = null;
      LoggingService.debug('TTS stopped');
    } catch (error) {
      LoggingService.error('Error stopping TTS:', error);
    }
  }

  /**
   * Pause current speech (if supported)
   */
  async pause() {
    // expo-speech doesn't support pause, so we stop instead
    await this.stop();
  }

  /**
   * Resume paused speech (if supported)
   */
  async resume() {
    // expo-speech doesn't support resume
    LoggingService.warn('Resume not supported by expo-speech');
  }

  /**
   * Check if currently speaking
   * @returns {boolean}
   */
  isCurrentlySpeaking() {
    return this.isSpeaking;
  }

  /**
   * Get available voices (if supported)
   * @returns {Promise<Array>}
   */
  async getAvailableVoices() {
    // expo-speech doesn't provide voice list API
    // Return default Australian English voice
    return [
      {
        identifier: 'en-AU',
        name: 'Australian English',
        language: 'en-AU',
      },
    ];
  }
}

export default new TextToSpeechService();

