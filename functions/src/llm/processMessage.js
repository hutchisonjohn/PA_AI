/**
 * Process user message with LLM
 */

const admin = require('firebase-admin');
const axios = require('axios');

const db = admin.firestore();

/**
 * Process user message and extract intent
 */
async function processUserMessage(userId, message, userContext = {}) {
  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    const user = userDoc.data();

    // Call LLM service (Replicate Llama 3.1)
    const llmResponse = await callLLM(message, {
      ...userContext,
      userId,
      timezone: user.timezone || 'Australia/Sydney',
      locale: user.locale || 'en-AU',
    });

    // Execute function calls
    const executionResults = await executeFunctionCalls(
      userId,
      llmResponse.functionCalls,
      user
    );

    return {
      response: llmResponse.response,
      functionCalls: llmResponse.functionCalls,
      executionResults,
    };
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}

/**
 * Call LLM API (Replicate Llama 3.1)
 */
async function callLLM(message, context) {
  const replicateToken = process.env.REPLICATE_API_TOKEN;

  if (!replicateToken) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }

  // Create prediction
  const predictionResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: 'meta/llama-3.1-70b-instruct',
      input: {
        prompt: buildPrompt(message, context),
        max_tokens: 500,
        temperature: 0.7,
      },
    },
    {
      headers: {
        Authorization: `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const predictionId = predictionResponse.data.id;

  // Poll for result
  let result = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Token ${replicateToken}`,
        },
      }
    );

    if (statusResponse.data.status === 'succeeded') {
      result = statusResponse.data.output;
      break;
    } else if (statusResponse.data.status === 'failed') {
      throw new Error('LLM prediction failed');
    }
  }

  if (!result) {
    throw new Error('LLM prediction timeout');
  }

  // Parse response and extract function calls
  const responseText = Array.isArray(result) ? result.join('') : result;
  const functionCalls = extractFunctionCalls(responseText);

  return {
    response: responseText,
    functionCalls,
  };
}

/**
 * Build prompt for LLM
 */
function buildPrompt(message, context) {
  const systemPrompt = `You are McCarthy, a helpful AI assistant for Australian families.

Your capabilities:
- Create tasks and reminders
- Manage calendar events
- Add items to shopping lists
- Send messages to family members
- Answer questions about tasks, calendar, and family coordination

User context:
- Timezone: ${context.timezone || 'Australia/Sydney'}
- Current time: ${new Date().toISOString()}

Always be friendly, proactive, and helpful. When user requests an action, extract the intent.`;

  return `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;
}

/**
 * Extract function calls from LLM response (simplified)
 */
function extractFunctionCalls(responseText) {
  const functionCalls = [];
  const lowerText = responseText.toLowerCase();

  // Extract task creation
  if (lowerText.includes('create task') || lowerText.includes('remind')) {
    const taskMatch = responseText.match(/(?:remind|task|todo).*?['"](.*?)['"]/i);
    if (taskMatch) {
      functionCalls.push({
        function: 'create_task',
        arguments: {
          title: taskMatch[1],
        },
      });
    }
  }

  // Add more extraction logic here

  return functionCalls;
}

/**
 * Execute function calls
 */
async function executeFunctionCalls(userId, functionCalls, user) {
  const results = [];

  for (const call of functionCalls) {
    try {
      switch (call.function) {
        case 'create_task':
          await createTask(userId, call.arguments, user);
          results.push({ success: true, function: 'create_task' });
          break;
        case 'create_calendar_event':
          await createCalendarEvent(userId, call.arguments, user);
          results.push({ success: true, function: 'create_calendar_event' });
          break;
        case 'add_to_shopping_list':
          await addToShoppingList(userId, call.arguments, user);
          results.push({ success: true, function: 'add_to_shopping_list' });
          break;
        default:
          results.push({ success: false, function: call.function, error: 'Unknown function' });
      }
    } catch (error) {
      console.error(`Error executing ${call.function}:`, error);
      results.push({ success: false, function: call.function, error: error.message });
    }
  }

  return results;
}

/**
 * Create task
 */
async function createTask(userId, args, user) {
  const taskData = {
    taskId: `task_${Date.now()}`,
    userId,
    groupId: null, // Personal task
    title: args.title,
    description: args.description || '',
    category: args.category || 'personal',
    priority: args.priority || 'medium',
    status: 'pending',
    dueDate: args.dueDate || null,
    dueTime: args.dueTime || null,
    dueTimezone: user.timezone || 'Australia/Sydney',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('tasks').doc(taskData.taskId).set(taskData);
}

/**
 * Create calendar event
 */
async function createCalendarEvent(userId, args, user) {
  const eventData = {
    eventId: `event_${Date.now()}`,
    userId,
    title: args.title,
    description: args.description || '',
    startTime: args.startTime,
    endTime: args.endTime,
    location: args.location || '',
    allDay: args.allDay || false,
    timezone: user.timezone || 'Australia/Sydney',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('calendarEvents').doc(eventData.eventId).set(eventData);
}

/**
 * Add to shopping list
 */
async function addToShoppingList(userId, args, user) {
  // Get user's default shopping list
  const defaultListId = user.defaultShoppingListId;
  
  if (!defaultListId) {
    throw new Error('No default shopping list found');
  }

  const listRef = db.collection('shoppingLists').doc(defaultListId);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    throw new Error('Shopping list not found');
  }

  const list = listDoc.data();
  const newItem = {
    itemId: `item_${Date.now()}`,
    name: args.item,
    quantity: args.quantity || '1',
    category: 'other',
    purchased: false,
    addedBy: userId,
    addedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await listRef.update({
    items: admin.firestore.FieldValue.arrayUnion(newItem),
    itemCount: (list.itemCount || 0) + 1,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

module.exports = { processUserMessage };

