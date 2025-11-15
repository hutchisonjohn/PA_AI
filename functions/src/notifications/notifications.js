/**
 * Notification Service
 */

const admin = require('firebase-admin');

const messaging = admin.messaging();
const db = admin.firestore();

/**
 * Send push notification to user
 */
async function sendNotification(userId, title, body, data = {}) {
  try {
    // Get user's FCM tokens
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const user = userDoc.data();
    const tokens = user.fcmTokens || [];

    if (tokens.length === 0) {
      console.log(`No FCM tokens for user ${userId}`);
      return { success: false, reason: 'No tokens' };
    }

    // Build notification payload
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        type: data.type || 'general',
      },
      tokens, // Send to all user's devices
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
    };

    // Send notification
    const response = await messaging.sendEachForMulticast(message);

    // Store notification in database
    await db.collection('notifications').add({
      userId,
      title,
      body,
      data,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Send notification to group members
 */
async function sendGroupNotification(groupId, title, body, data = {}) {
  try {
    // Get group members
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }

    const group = groupDoc.data();
    const memberIds = group.memberIds || [];

    // Send notification to each member
    const results = await Promise.all(
      memberIds.map(userId => sendNotification(userId, title, body, data))
    );

    return {
      success: true,
      sentCount: results.filter(r => r.success).length,
      totalCount: memberIds.length,
    };
  } catch (error) {
    console.error('Error sending group notification:', error);
    throw error;
  }
}

module.exports = { sendNotification, sendGroupNotification };

