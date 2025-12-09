/**
 * Dartmouth API Service
 * 
 * Handles all API calls to Dartmouth backend
 * Replaces Firebase Auth and direct OpenAI calls
 * 
 * Uses axios for better React Native/Expo Go compatibility
 */

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { MCCARTHY_SYSTEM_PROMPT } from '../prompts/mccarthyPrompt';

const API_BASE_URL = Constants.expoConfig?.extra?.dartmouthApiUrl || 
                     process.env.DARTMOUTH_API_URL || 
                     'https://dartmouth-os-worker.lucy-hunter-9411.workers.dev';

// Create axios instance with React Native compatible configuration
// Note: In React Native/Expo Go, axios uses the fetch adapter by default
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Ensure validateStatus allows all status codes (we handle errors manually)
  validateStatus: function (status) {
    return status >= 200 && status < 600; // Accept all status codes
  },
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('[Dartmouth API] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    return config;
  },
  (error) => {
    console.error('[Dartmouth API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('[Dartmouth API] Response:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    console.error('[Dartmouth API] Response error:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'No response',
      request: error.request ? 'Request was made' : 'No request',
    });
    return Promise.reject(error);
  }
);

class DartmouthAPIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.axios = axiosInstance;
    console.log('[Dartmouth API] Initialized with baseURL:', this.baseURL);
  }

  /**
   * Test API connection
   * GET /health
   */
  async testConnection() {
    try {
      const response = await this.axios.get('/health', {
        timeout: 10000,
      });
      
      console.log('[Dartmouth API] Connection test successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[Dartmouth API] Connection test failed:', error.message, error.code);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get authorization header
   */
  async getAuthHeaders() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('dartmouth_token');
    }
    
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
    };
  }

  /**
   * Set authentication token
   */
  async setToken(token) {
    this.token = token;
    await AsyncStorage.setItem('dartmouth_token', token);
  }

  /**
   * Clear authentication token
   */
  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('dartmouth_token');
  }

  /**
   * Register new user
   * POST /api/pa-ai/auth/register
   */
  async register(email, password, name, phoneNumber = null, timezone = 'Australia/Sydney') {
    try {
      console.log('[Dartmouth API] Registering user:', { email, name, baseURL: this.baseURL });
      
      const response = await this.axios.post(
        '/api/pa-ai/auth/register',
        {
          email,
          password,
          name,
          phoneNumber,
          timezone,
        },
        {
          timeout: 30000,
        }
      );

      console.log('[Dartmouth API] Register response status:', response.status);
      console.log('[Dartmouth API] Register response data:', response.data);

      const data = response.data;

      if (data.token) {
        await this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('[Dartmouth API] Register error:', {
        message: error.message,
        name: error.name,
        response: error.response?.data,
        status: error.response?.status,
        baseURL: this.baseURL,
        url: `${this.baseURL}/api/pa-ai/auth/register`,
      });
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error(`Request timeout. The server took too long to respond. Please check your internet connection and try again.`);
      } else if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        throw new Error(errorData?.error || `HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response received - this is the key issue
        console.error('[Dartmouth API] Request made but no response:', {
          code: error.code,
          message: error.message,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
          },
        });
        throw new Error(`Network error. Cannot reach ${this.baseURL}. The request was sent but no response was received. This usually means:\n1. The server is not accessible from the emulator\n2. There's a firewall/network issue\n3. The API endpoint is incorrect\n\nTry accessing ${this.baseURL}/health in the emulator browser to verify connectivity.`);
      } else {
        throw new Error(error.message || 'Registration failed');
      }
    }
  }

  /**
   * Login
   * POST /api/pa-ai/auth/login
   */
  async login(email, password) {
    // First, test connection to ensure worker is reachable
    try {
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        console.warn('[Dartmouth API] Connection test failed, but proceeding with login attempt');
      }
    } catch (testError) {
      console.warn('[Dartmouth API] Connection test error:', testError.message);
      // Continue anyway - sometimes test fails but actual request works
    }

    try {
      const response = await this.axios.post(
        '/api/pa-ai/auth/login',
        {
          email,
          password,
        },
        {
          timeout: 30000,
        }
      );

      const data = response.data;

      if (data.token) {
        await this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('[Dartmouth API] Login error:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : 'No response',
        request: error.request ? 'Request was made' : 'No request',
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          timeout: error.config?.timeout,
        },
      });
      
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        // Network error - provide more helpful message
        throw new Error(`Network error: Unable to reach the server. This could be due to:\n1. Temporary network issue - please try again\n2. The server is taking too long to respond\n3. Your internet connection is unstable\n\nPlease check your connection and try again.`);
      } else if (error.response) {
        const errorData = error.response.data;
        throw new Error(errorData?.error || `HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network error. Cannot reach ${this.baseURL}. Please check your internet connection.`);
      }
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  async logout() {
    try {
      const headers = await this.getAuthHeaders();
      await this.axios.post('/api/auth/logout', {}, {
        timeout: 10000,
        headers,
      });
      await this.clearToken();
      return { success: true };
    } catch (error) {
      console.error('[Dartmouth API] Logout error:', error);
      // Clear token even if request fails
      await this.clearToken();
      return { success: true };
    }
  }

  /**
   * Get user profile
   * GET /api/pa-ai/profile
   */
  async getProfile() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.axios.get('/api/pa-ai/profile', {
        timeout: 30000,
        headers,
      });

      const user = response.data.user;
      
      // Log voiceSettings to verify they're loaded correctly
      if (user?.voiceSettings) {
        console.log('[Dartmouth API] Profile loaded with voiceSettings:', user.voiceSettings);
      } else {
        console.log('[Dartmouth API] Profile loaded but no voiceSettings found');
      }

      return user;
    } catch (error) {
      console.error('[Dartmouth API] Get profile error:', error.message);
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(errorData?.error || `HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw new Error(error.message || 'Failed to get profile');
    }
  }

  /**
   * Update user profile
   * PUT /api/pa-ai/profile
   */
  async updateProfile(updates) {
    try {
      const headers = await this.getAuthHeaders();
      
      // Log what we're sending for debugging
      console.log('[Dartmouth API] Updating profile with:', {
        ...updates,
        voiceSettings: updates.voiceSettings ? JSON.stringify(updates.voiceSettings) : undefined,
      });
      
      const response = await this.axios.put(
        '/api/pa-ai/profile',
        updates,
        {
          timeout: 30000,
          headers,
        }
      );

      // Log the response to verify voiceSettings were saved
      console.log('[Dartmouth API] Profile updated successfully:', {
        hasVoiceSettings: !!response.data?.user?.voiceSettings,
        voiceSettings: response.data?.user?.voiceSettings,
      });

      return response.data.user;
    } catch (error) {
      console.error('[Dartmouth API] Update profile error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      
      // Handle 401 (Unauthorized) - token might be expired
      if (error.response?.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }
      
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(errorData?.error || `HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Send chat message (text)
   * POST /api/pa-ai/chat
   */
  async sendChatMessage(message, sessionId = null, history = [], context = {}, systemPrompt = null) {
    try {
      const headers = await this.getAuthHeaders();
      
      // Get user profile for context if not provided
      let chatContext = context;
      if (!context.timezone || !context.location) {
        try {
          const profile = await this.getProfile();
          chatContext = {
            ...context,
            timezone: profile.timezone || 'Australia/Sydney',
            location: profile.homeAddress || 'Unknown',
            currency: profile.currency || 'AUD',
            locale: profile.locale || 'en-AU',
            currentTime: new Date().toISOString(),
          };
        } catch (error) {
          // If profile fetch fails, use defaults
          chatContext = {
            ...context,
            timezone: 'Australia/Sydney',
            location: 'Unknown',
            currency: 'AUD',
            locale: 'en-AU',
            currentTime: new Date().toISOString(),
          };
        }
      }

      // Always use McCarthy prompt for PA_AI (unless explicitly overridden)
      const finalSystemPrompt = systemPrompt || MCCARTHY_SYSTEM_PROMPT;
      
      console.log('[Dartmouth API] Sending chat message with system prompt:', {
        hasCustomPrompt: !!systemPrompt,
        promptLength: finalSystemPrompt?.length,
        promptPreview: finalSystemPrompt?.substring(0, 100),
      });

      const response = await this.axios.post(
        '/api/pa-ai/chat',
        {
          message,
          sessionId,
          history,
          context: chatContext,
          systemPrompt: finalSystemPrompt, // Always include McCarthy prompt
        },
        {
          timeout: 60000, // 60 seconds for chat (LLM can take longer)
          headers,
        }
      );

      return response.data;
    } catch (error) {
      console.error('[Dartmouth API] Chat error:', error.message);
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(errorData?.error || `HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw new Error(error.message || 'Failed to send message');
    }
  }

  /**
   * Send voice chat message (audio file)
   * POST /api/pa-ai/chat/voice
   * 
   * Note: For MVP, client should convert audio to text first
   * This endpoint is for future use with direct audio processing
   */
  async sendVoiceMessage(audioFile, sessionId = null) {
    try {
      const token = await this.getToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const formData = new FormData();
      formData.append('audio', {
        uri: audioFile.uri,
        type: audioFile.type || 'audio/m4a',
        name: audioFile.name || 'recording.m4a',
      });
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      const response = await this.axios.post(
        '/api/pa-ai/chat/voice',
        formData,
        {
          timeout: 60000, // 60 seconds for voice processing
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('[Dartmouth API] Voice chat error:', error.message);
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(errorData?.error || `HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw new Error(error.message || 'Failed to send voice message');
    }
  }

  /**
   * Get chat history for the current user
   * GET /api/pa-ai/chat/history
   * 
   * @param {number} limit - Number of records to return (default: 50)
   * @param {number} offset - Offset for pagination (default: 0)
   * @returns {Promise<Object>} Chat history with pagination info
   */
  async getChatHistory(limit = 50, offset = 0) {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await this.axios.get(
        `/api/pa-ai/chat/history?limit=${limit}&offset=${offset}`,
        {
          timeout: 15000, // 15 seconds timeout
          headers,
        }
      );

      return response.data;
    } catch (error) {
      console.error('[Dartmouth API] Get chat history error:', error.message);
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(errorData?.error || `HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw new Error(error.message || 'Failed to get chat history');
    }
  }

  /**
   * Save chat history (Q&A pair)
   * POST /api/pa-ai/chat/history
   * 
   * Called when TTS starts speaking (meaning answer is successfully generated)
   */
  async saveChatHistory(question, answer, sessionId = null, metadata = {}) {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await this.axios.post(
        '/api/pa-ai/chat/history',
        {
          question,
          answer,
          sessionId,
          metadata,
        },
        {
          timeout: 10000, // 10 seconds timeout
          headers,
        }
      );

      return response.data;
    } catch (error) {
      console.error('[Dartmouth API] Save chat history error:', error.message);
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(errorData?.error || `HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw new Error(error.message || 'Failed to save chat history');
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const token = await AsyncStorage.getItem('dartmouth_token');
    return !!token;
  }

  /**
   * Get stored token
   */
  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('dartmouth_token');
    }
    return this.token;
  }
}

export default new DartmouthAPIService();

