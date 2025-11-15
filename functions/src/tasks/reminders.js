/**
 * Task Reminder Service
 */

const admin = require('firebase-admin');
const { DateTime } = require('luxon');

const db = admin.firestore();
const { sendNotification } = require('../notifications/notifications');

/**
 * Schedule task reminders
 */
async function scheduleTaskReminders() {
  try {
    const now = admin.firestore.Timestamp.now();
    const fiveMinutesFromNow = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 5 * 60 * 1000
    );

    // Find tasks due in the next 5 minutes
    const tasksSnapshot = await db
      .collection('tasks')
      .where('status', '==', 'pending')
      .where('dueDate', '<=', fiveMinutesFromNow)
      .where('dueDate', '>', now)
      .get();

    for (const taskDoc of tasksSnapshot.docs) {
      const task = taskDoc.data();
      await checkAndSendTaskReminder(task);
    }

    return { processed: tasksSnapshot.size };
  } catch (error) {
    console.error('Error scheduling task reminders:', error);
    throw error;
  }
}

/**
 * Check and send task reminder
 */
async function checkAndSendTaskReminder(task) {
  try {
    // Get user
    const userDoc = await db.collection('users').doc(task.userId).get();
    if (!userDoc.exists) {
      return;
    }

    const user = userDoc.data();
    const timezone = user.timezone || 'Australia/Sydney';

    // Check if it's a safe time
    const now = DateTime.now().setZone(timezone);
    const taskDueTime = DateTime.fromISO(task.dueDate.toDate().toISOString()).setZone(timezone);

    // Check if reminder should be sent (within 5 minutes of due time)
    const timeDiff = taskDueTime.diff(now, 'minutes').minutes;
    if (timeDiff < 0 || timeDiff > 5) {
      return; // Too early or too late
    }

    // Check safe times (DND mode)
    if (!isSafeTime(user, now)) {
      // Queue notification for later
      await queueNotification(user.userId, task, now);
      return;
    }

    // Send notification
    await sendNotification(
      task.userId,
      'Task Reminder',
      `It's time to ${task.title}`,
      {
        type: 'task_reminder',
        taskId: task.taskId,
        taskTitle: task.title,
      }
    );

    // Mark reminder as sent
    await db.collection('tasks').doc(task.taskId).update({
      'reminders.0.sent': true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error checking task reminder:', error);
  }
}

/**
 * Check if current time is safe for notifications
 */
function isSafeTime(user, currentTime) {
  const safeTimes = user.safeTimes || {};

  if (!safeTimes.enabled) {
    return true;
  }

  const currentHour = currentTime.hour;
  const currentMinute = currentTime.minute;
  const currentMinutes = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = safeTimes.defaultStart.split(':').map(Number);
  const [endHour, endMinute] = safeTimes.defaultEnd.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Handle overnight safe times (e.g., 22:00 - 07:00)
  if (startMinutes > endMinutes) {
    // Overnight case
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Same day case
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

/**
 * Queue notification for later (when safe time starts)
 */
async function queueNotification(userId, task, currentTime) {
  // Implementation would store notification in queue
  // and send when safe time starts
  console.log(`Queueing notification for user ${userId}, task ${task.taskId}`);
}

module.exports = { scheduleTaskReminders };

