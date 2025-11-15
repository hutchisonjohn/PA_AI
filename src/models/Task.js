/**
 * Task Model (v7 Schema)
 * 
 * v7 Changes:
 * - Added: groupId field (null = personal task, groupId = shared task)
 */

export const createTask = (taskData) => {
  return {
    // Identity
    taskId: taskData.taskId,
    userId: taskData.userId, // Task owner

    // v7: Group assignment (supports shared tasks in V2)
    groupId: taskData.groupId || null, // null = personal, groupId = shared task
    assignedTo: taskData.assignedTo || null, // V2: Assign to other users

    // Content
    title: taskData.title,
    description: taskData.description || '',

    // Classification
    category: taskData.category || 'personal', // "personal" | "work" | "family" | "errands" | "health" | "other"
    priority: taskData.priority || 'medium', // "high" | "medium" | "low"
    status: taskData.status || 'pending', // "pending" | "in_progress" | "completed" | "cancelled"

    // Timing
    dueDate: taskData.dueDate || null,
    dueTime: taskData.dueTime || null,
    dueTimezone: taskData.dueTimezone || 'Australia/Sydney',
    completedAt: taskData.completedAt || null,

    // Reminders
    reminders: taskData.reminders || [],

    // Recurrence
    recurring: taskData.recurring || false,
    recurrence: taskData.recurrence || null,

    // Location-based
    locationBased: taskData.locationBased || false,
    locationTrigger: taskData.locationTrigger || null,

    // Context
    linkedCalendarEventId: taskData.linkedCalendarEventId || null,
    linkedShoppingListId: taskData.linkedShoppingListId || null,
    linkedVoiceNoteId: taskData.linkedVoiceNoteId || null,

    // AI context
    aiSuggestion: taskData.aiSuggestion || false,
    aiContext: taskData.aiContext || null,

    // Metadata
    createdAt: taskData.createdAt || new Date().toISOString(),
    updatedAt: taskData.updatedAt || new Date().toISOString(),
    createdBy: taskData.createdBy || 'text', // "voice" | "text" | "ai_suggestion"
  };
};

export const updateTask = (existingTask, updates) => {
  return {
    ...existingTask,
    ...updates,
    updatedAt: new Date().toISOString(),
    completedAt: updates.status === 'completed' && existingTask.status !== 'completed' 
      ? new Date().toISOString() 
      : existingTask.completedAt,
  };
};

