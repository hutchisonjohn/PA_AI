/**
 * Cloud Functions for McCarthy App
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const { processUserMessage } = require('./src/llm/processMessage');
const { sendNotification } = require('./src/notifications/notifications');
const { checkLocationTriggers } = require('./src/location/geofencing');
const { scheduleTaskReminders } = require('./src/tasks/reminders');

// Process user message (voice or text)
exports.processUserMessage = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { message, context: userContext } = data;
  const userId = context.auth.uid;

  try {
    const result = await processUserMessage(userId, message, userContext);
    return result;
  } catch (error) {
    console.error('Error processing message:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Scheduled function to check task reminders
exports.checkTaskReminders = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      await scheduleTaskReminders();
      return null;
    } catch (error) {
      console.error('Error checking task reminders:', error);
      return null;
    }
  });

// Scheduled function to check location triggers
exports.checkLocationTriggers = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async (context) => {
    try {
      await checkLocationTriggers();
      return null;
    } catch (error) {
      console.error('Error checking location triggers:', error);
      return null;
    }
  });

// Send push notification
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, title, body, data: notificationData } = data;

  try {
    const result = await sendNotification(userId, title, body, notificationData);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

