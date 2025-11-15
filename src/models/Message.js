/**
 * Message Model (v7 Schema)
 * 
 * v7 Changes:
 * - Added: parentGroupId, threadId (null for MVP, populated in V2 for private threads)
 */

export const createMessage = (messageData) => {
  return {
    // Identity
    messageId: messageData.messageId,
    groupId: messageData.groupId,

    // v7: Thread support (for V2 private threads)
    parentGroupId: null, // null = main group, groupId = private thread
    threadId: null, // null = main chat, threadId = specific thread

    // Sender
    senderId: messageData.senderId,
    senderName: messageData.senderName,
    senderPhotoUrl: messageData.senderPhotoUrl || null,

    // Content
    messageType: messageData.messageType || 'text', // "text" | "image" | "voice" | "location" | "system"
    content: messageData.content || '',

    // Attachments (for images, voice notes, locations)
    attachments: messageData.attachments || [],

    // Mentions
    mentions: messageData.mentions || [],
    mentionsAll: messageData.mentionsAll || false,

    // Reactions
    reactions: messageData.reactions || {},

    // Delivery tracking
    sentAt: messageData.sentAt || new Date().toISOString(),
    deliveredTo: messageData.deliveredTo || [],
    readBy: messageData.readBy || [],

    // Metadata
    editedAt: messageData.editedAt || null,
    deletedAt: messageData.deletedAt || null,
    deleted: messageData.deleted || false,

    // Reply tracking
    replyToMessageId: messageData.replyToMessageId || null,

    createdAt: messageData.createdAt || new Date().toISOString(),
    updatedAt: messageData.updatedAt || new Date().toISOString(),
  };
};

export const updateMessage = (existingMessage, updates) => {
  return {
    ...existingMessage,
    ...updates,
    updatedAt: new Date().toISOString(),
    editedAt: updates.content && updates.content !== existingMessage.content ? new Date().toISOString() : existingMessage.editedAt,
  };
};

