/**
 * LLM Service - Abstraction Layer
 * 
 * Allows swapping between Llama 3.1 (MVP) and GPT-4 (V2) without code changes
 * Provider is controlled via LLM_PROVIDER environment variable
 */

import axios from 'axios';

class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'llama';
    this.replicateToken = process.env.REPLICATE_API_TOKEN;
    this.openaiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * Process user message and return response + function calls
   * @param {string} message - User's message (voice or text)
   * @param {Object} context - User context (userId, timezone, location, etc.)
   * @returns {Promise<Object>} { response, functionCalls }
   */
  async processMessage(message, context = {}) {
    switch (this.provider) {
      case 'llama':
        return await this.processWithLlama(message, context);
      case 'gpt4':
        return await this.processWithGPT4(message, context);
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
   * Process with GPT-4 Turbo (V2 upgrade path)
   */
  async processWithGPT4(message, context) {
    if (!this.openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: this.buildSystemPrompt(context),
            },
            {
              role: 'user',
              content: message,
            },
          ],
          functions: this.getAvailableFunctions(),
          function_call: 'auto',
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return this.parseGPT4Response(response.data, context);
    } catch (error) {
      console.error('GPT-4 API error:', error);
      throw new Error(`LLM processing failed: ${error.message}`);
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
   * Get available functions for function calling
   */
  getAvailableFunctions() {
    return [
      {
        name: 'create_task',
        description: 'Create a new task or reminder',
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
      {
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
      {
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
      {
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
   * Parse GPT-4 response
   */
  parseGPT4Response(data, context) {
    const message = data.choices[0].message;
    const functionCalls = message.function_calls || [];

    return {
      response: message.content || '',
      functionCalls: functionCalls.map(fc => ({
        function: fc.name,
        arguments: JSON.parse(fc.arguments || '{}'),
      })),
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

