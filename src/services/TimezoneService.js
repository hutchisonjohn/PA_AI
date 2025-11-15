/**
 * Timezone Service
 * 
 * Handles all timezone conversions using Luxon library
 * Never hardcode Australian timezone checks - use library for all conversions
 */

import { DateTime } from 'luxon';

class TimezoneService {
  /**
   * Get current time in user's timezone
   * @param {string} timezone - IANA timezone (e.g., 'Australia/Sydney')
   * @returns {DateTime}
   */
  getUserLocalTime(timezone) {
    return DateTime.now().setZone(timezone);
  }

  /**
   * Convert UTC time to user's local time
   * @param {string|Date} utcTime - UTC time (ISO string or Date)
   * @param {string} userTimezone - User's timezone
   * @returns {DateTime}
   */
  toUserLocalTime(utcTime, userTimezone) {
    const dt = typeof utcTime === 'string' 
      ? DateTime.fromISO(utcTime, { zone: 'utc' })
      : DateTime.fromJSDate(utcTime);
    
    return dt.setZone(userTimezone);
  }

  /**
   * Convert user's local time to UTC
   * @param {string|Date} localTime - Local time
   * @param {string} userTimezone - User's timezone
   * @returns {DateTime}
   */
  toUTC(localTime, userTimezone) {
    const dt = typeof localTime === 'string'
      ? DateTime.fromISO(localTime, { zone: userTimezone })
      : DateTime.fromJSDate(localTime, { zone: userTimezone });
    
    return dt.toUTC();
  }

  /**
   * Format time for display in user's timezone
   * @param {string|Date} time - Time to format
   * @param {string} userTimezone - User's timezone
   * @param {string} format - Luxon format string
   * @returns {string}
   */
  formatTime(time, userTimezone, format = 'HH:mm') {
    const localTime = this.toUserLocalTime(time, userTimezone);
    return localTime.toFormat(format);
  }

  /**
   * Format date for display in user's timezone
   * @param {string|Date} date - Date to format
   * @param {string} userTimezone - User's timezone
   * @param {string} format - Luxon format string
   * @returns {string}
   */
  formatDate(date, userTimezone, format = 'dd/MM/yyyy') {
    const localTime = this.toUserLocalTime(date, userTimezone);
    return localTime.toFormat(format);
  }

  /**
   * Format datetime for display
   * @param {string|Date} datetime - Datetime to format
   * @param {string} userTimezone - User's timezone
   * @param {string} format - Luxon format string
   * @returns {string}
   */
  formatDateTime(datetime, userTimezone, format = 'dd/MM/yyyy HH:mm') {
    const localTime = this.toUserLocalTime(datetime, userTimezone);
    return localTime.toFormat(format);
  }

  /**
   * Check if time is within safe hours
   * @param {string|Date} time - Time to check
   * @param {string} userTimezone - User's timezone
   * @param {Object} safeTimes - { enabled, start, end } (HH:mm format)
   * @returns {boolean}
   */
  isSafeTime(time, userTimezone, safeTimes) {
    if (!safeTimes || !safeTimes.enabled) {
      return true; // No restrictions
    }

    const localTime = this.toUserLocalTime(time, userTimezone);
    const currentHour = localTime.hour;
    const currentMinute = localTime.minute;
    const currentMinutes = currentHour * 60 + currentMinute;

    // Parse safe time start/end
    const [startHour, startMinute] = safeTimes.start.split(':').map(Number);
    const [endHour, endMinute] = safeTimes.end.split(':').map(Number);
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
   * Get next safe time (when notifications can be sent)
   * @param {string} userTimezone - User's timezone
   * @param {Object} safeTimes - Safe times configuration
   * @returns {DateTime}
   */
  getNextSafeTime(userTimezone, safeTimes) {
    if (!safeTimes || !safeTimes.enabled) {
      return DateTime.now().setZone(userTimezone);
    }

    const now = DateTime.now().setZone(userTimezone);
    const [startHour, startMinute] = safeTimes.start.split(':').map(Number);

    let nextSafeTime = now.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });

    // If we're already past today's safe time start, use tomorrow
    if (nextSafeTime <= now) {
      nextSafeTime = nextSafeTime.plus({ days: 1 });
    }

    return nextSafeTime;
  }

  /**
   * Get Australian timezones
   * @returns {Array<Object>} List of Australian timezones
   */
  getAustralianTimezones() {
    return [
      { value: 'Australia/Sydney', label: 'AEDT/AEST (Sydney, Melbourne)', offset: '+10/+11' },
      { value: 'Australia/Adelaide', label: 'ACDT/ACST (Adelaide)', offset: '+9:30/+10:30' },
      { value: 'Australia/Perth', label: 'AWST (Perth)', offset: '+8' },
      { value: 'Australia/Darwin', label: 'ACST (Darwin)', offset: '+9:30' },
      { value: 'Australia/Brisbane', label: 'AEST (Brisbane)', offset: '+10' },
      { value: 'Australia/Hobart', label: 'AEDT/AEST (Hobart)', offset: '+10/+11' },
    ];
  }

  /**
   * Get time difference between two timezones
   * @param {string} timezone1 - First timezone
   * @param {string} timezone2 - Second timezone
   * @returns {Object} { hours, minutes, formatted }
   */
  getTimezoneDifference(timezone1, timezone2) {
    const now = DateTime.now();
    const t1 = now.setZone(timezone1);
    const t2 = now.setZone(timezone2);
    
    const offset1 = t1.offset;
    const offset2 = t2.offset;
    const diffMinutes = offset2 - offset1;
    
    const hours = Math.floor(Math.abs(diffMinutes) / 60);
    const minutes = Math.abs(diffMinutes) % 60;
    
    return {
      hours,
      minutes,
      totalMinutes: diffMinutes,
      formatted: `${diffMinutes >= 0 ? '+' : '-'}${hours}:${String(minutes).padStart(2, '0')}`,
    };
  }
}

export default new TimezoneService();

