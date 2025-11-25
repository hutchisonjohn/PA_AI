/**
 * LLM Service - Abstraction Layer
 * 
 * Uses OpenAI GPT-4o-mini for MVP (Week 2)
 * Provider is controlled via LLM_PROVIDER environment variable
 */

import axios from 'axios';
import Constants from 'expo-constants';

class LLMService {
  constructor() {
    // Default to OpenAI GPT-4o-mini for Week 2
    this.provider = Constants.expoConfig?.extra?.llmProvider || 
                    process.env.LLM_PROVIDER || 
                    'openai';
    this.replicateToken = Constants.expoConfig?.extra?.replicateToken || 
                          process.env.REPLICATE_API_TOKEN;
    this.openaiKey = Constants.expoConfig?.extra?.openaiKey || 
                     process.env.OPENAI_API_KEY;
  }

  /**
   * Process user message and return response + function calls
   * @param {string} message - User's message (voice or text)
   * @param {Object} context - User context (userId, timezone, location, etc.)
   * @param {Array} conversationHistory - Previous messages for context
   * @returns {Promise<Object>} { response, functionCalls }
   */
  async processMessage(message, context = {}, conversationHistory = []) {
    switch (this.provider) {
      case 'llama':
        return await this.processWithLlama(message, context);
      case 'openai':
      case 'gpt4':
        return await this.processWithOpenAI(message, context, conversationHistory);
      default:
        throw new Error(`Unknown LLM provider: ${this.provider}`);
    }
  }

  /**
   * Process with Llama 3.1 via Replicate (MVP default)
   */
  async processWithLlama(message, context) {
    if (!this.replicateToken) {
      throw new Error('REPLICATE_API_TOKEN not configured');
    }

    try {
      // Llama 3.1 model via Replicate
      const model = 'meta/llama-3.1-70b-instruct';
      
      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: 'latest',
          input: {
            prompt: this.buildPrompt(message, context),
            max_tokens: 500,
            temperature: 0.7,
          },
        },
        {
          headers: {
            Authorization: `Token ${this.replicateToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Poll for result (Replicate is async)
      const predictionId = response.data.id;
      let result = await this.pollReplicateResult(predictionId);

      // Parse response and extract function calls
      return this.parseLlamaResponse(result, context);
    } catch (error) {
      console.error('Llama API error:', error);
      throw new Error(`LLM processing failed: ${error.message}`);
    }
  }

  /**
   * Process with OpenAI GPT-4o-mini (Week 2 default)
   */
  async processWithOpenAI(message, context, conversationHistory = []) {
    if (!this.openaiKey) {
      throw new Error('OPENAI_API_KEY not configured. Please add OPENAI_API_KEY to your .env file.');
    }

    try {
      // Build messages array with conversation history
      const messages = [
        {
          role: 'system',
          content: this.buildSystemPrompt(context),
        },
        // Add conversation history (last 10 messages for context)
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.role || 'user',
          content: msg.content || msg.message,
        })),
        {
          role: 'user',
          content: message,
        },
      ];

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: messages,
          tools: this.getAvailableTools(),
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return this.parseOpenAIResponse(response.data, context);
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error(`LLM processing failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Poll Replicate prediction result
   */
  async pollReplicateResult(predictionId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            Authorization: `Token ${this.replicateToken}`,
          },
        }
      );

      const status = response.data.status;

      if (status === 'succeeded') {
        return response.data.output;
      } else if (status === 'failed' || status === 'canceled') {
        throw new Error(`Replicate prediction ${status}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Replicate prediction timeout');
  }

  /**
   * Build prompt for Llama
   */
  buildPrompt(message, context) {
    const systemPrompt = this.buildSystemPrompt(context);
    return `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;
  }

  /**
   * Build system prompt
   */
  buildSystemPrompt(context) {
    return `You are McCarthy, a helpful AI assistant for Australian families.

Your capabilities:
- Create tasks and reminders
- Manage calendar events
- Add items to shopping lists
- Send messages to family members
- Answer questions about tasks, calendar, and family coordination

User context:
- Timezone: ${context.timezone || 'Australia/Sydney'}
- Location: ${context.location || 'Unknown'}
- Current time: ${context.currentTime || 'Unknown'}

Always be friendly, proactive, and helpful. When user requests an action, extract the intent and return structured function calls.`;
  }

  /**
   * Get available tools (functions) for OpenAI function calling
   * Uses OpenAI's new tools format (replaces functions)
   */
  getAvailableTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'create_task',
          description: 'Create a new task or reminder for the user',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Task title' },
              description: { type: 'string', description: 'Task description' },
              dueDate: { type: 'string', description: 'Due date (ISO format)' },
              dueTime: { type: 'string', description: 'Due time (HH:mm format)' },
              category: { type: 'string', enum: ['personal', 'work', 'family', 'errands', 'health', 'other'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['title'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_calendar_event',
          description: 'Create a calendar event',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              startTime: { type: 'string', description: 'Start time (ISO format)' },
              endTime: { type: 'string', description: 'End time (ISO format)' },
              location: { type: 'string' },
              allDay: { type: 'boolean' },
            },
            required: ['title', 'startTime'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'add_to_shopping_list',
          description: 'Add item to shopping list',
          parameters: {
            type: 'object',
            properties: {
              item: { type: 'string', description: 'Item name' },
              quantity: { type: 'string', description: 'Quantity' },
              notes: { type: 'string' },
            },
            required: ['item'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'send_family_message',
          description: 'Send message to family group',
          parameters: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              groupId: { type: 'string' },
            },
            required: ['message'],
          },
        },
      },
    ];
  }

  /**
   * Parse Llama response (basic implementation)
   */
  parseLlamaResponse(output, context) {
    // Basic parsing - in production, would use proper function calling
    const response = Array.isArray(output) ? output.join('') : output;
    
    // Extract function calls from response (simplified)
    const functionCalls = this.extractFunctionCalls(response);

    return {
      response: response,
      functionCalls: functionCalls,
    };
  }

  /**
   * Parse OpenAI response (GPT-4o-mini)
   */
  parseOpenAIResponse(data, context) {
    const message = data.choices[0].message;
    const toolCalls = message.tool_calls || [];
    
    // Extract function calls from tool calls
    const functionCalls = toolCalls.map(tc => ({
      function: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}'),
      id: tc.id,
    }));

    return {
      response: message.content || '',
      functionCalls: functionCalls,
    };
  }

  /**
   * Extract function calls from text response (basic implementation)
   */
  extractFunctionCalls(text) {
    // Simplified extraction - in production would use proper NLP
    const functionCalls = [];
    
    // Look for patterns like "create task", "add to shopping list", etc.
    if (text.toLowerCase().includes('create task') || text.toLowerCase().includes('remind')) {
      // Extract task details (simplified)
      const taskMatch = text.match(/(?:remind|task|todo).*?['"](.*?)['"]/i);
      if (taskMatch) {
        functionCalls.push({
          function: 'create_task',
          arguments: {
            title: taskMatch[1],
          },
        });
      }
    }

    return functionCalls;
  }
}

export default new LLMService();

