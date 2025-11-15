/**
 * Location/Geofencing Service
 */

const admin = require('firebase-admin');
const { sendNotification } = require('../notifications/notifications');

const db = admin.firestore();

/**
 * Check location triggers
 */
async function checkLocationTriggers() {
  try {
    // Get all active location-based tasks
    const tasksSnapshot = await db
      .collection('tasks')
      .where('locationBased', '==', true)
      .where('status', '==', 'pending')
      .get();

    for (const taskDoc of tasksSnapshot.docs) {
      const task = taskDoc.data();
      await checkLocationTrigger(task);
    }

    return { processed: tasksSnapshot.size };
  } catch (error) {
    console.error('Error checking location triggers:', error);
    throw error;
  }
}

/**
 * Check if user is near location trigger
 */
async function checkLocationTrigger(task) {
  try {
    if (!task.locationTrigger) {
      return;
    }

    // Get user's current location (would be updated by app)
    const userDoc = await db.collection('users').doc(task.userId).get();
    if (!userDoc.exists) {
      return;
    }

    const user = userDoc.data();
    const currentLocation = user.currentLocation;

    if (!currentLocation) {
      return; // Location not available
    }

    // Calculate distance between current location and trigger location
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      task.locationTrigger.coordinates.lat,
      task.locationTrigger.coordinates.lng
    );

    // Check if within radius
    if (distance <= task.locationTrigger.radius) {
      // Send notification
      await sendNotification(
        task.userId,
        'Location Reminder',
        `You're near ${task.locationTrigger.location}. Time to ${task.title}`,
        {
          type: 'location_reminder',
          taskId: task.taskId,
          taskTitle: task.title,
          location: task.locationTrigger.location,
        }
      );

      // Mark task as triggered
      await db.collection('tasks').doc(task.taskId).update({
        locationTriggered: true,
        locationTriggeredAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error checking location trigger:', error);
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters
  return distance;
}

module.exports = { checkLocationTriggers };

