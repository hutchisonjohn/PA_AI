/**
 * External Messaging Service - Abstraction Layer
 * 
 * Allows swapping between native intents (MVP) and Twilio automation (V2)
 * Provider is controlled via EXTERNAL_MSG_PROVIDER environment variable
 */

import { Linking, Platform } from 'react-native';

class ExternalMessagingService {
  constructor() {
    this.provider = process.env.EXTERNAL_MSG_PROVIDER || 'native';
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Send SMS message
   * @param {Object} recipient - { phoneNumber, name }
   * @param {string} message - Message content
   * @param {string} userId - User ID (for approval tracking)
   * @returns {Promise<Object>} { success, method, status, messageId? }
   */
  async sendSMS(recipient, message, userId) {
    // Get user approval (required for both providers)
    const approval = await this.getApproval(recipient, message, userId);
    if (!approval) {
      return { cancelled: true };
    }

    // Route to appropriate provider
    switch (this.provider) {
      case 'native':
        return await this.sendViaNativeIntent(recipient.phoneNumber, message);
      case 'twilio':
        return await this.sendViaTwilio(recipient.phoneNumber, message);
      default:
        throw new Error(`Unknown messaging provider: ${this.provider}`);
    }
  }

  /**
   * Send email message
   * @param {Object} recipient - { email, name }
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async sendEmail(recipient, subject, body, userId) {
    const approval = await this.getApproval(recipient, body, userId);
    if (!approval) {
      return { cancelled: true };
    }

    switch (this.provider) {
      case 'native':
        return await this.sendEmailViaNativeIntent(recipient.email, subject, body);
      case 'sendgrid':
        return await this.sendViaSendGrid(recipient.email, subject, body);
      default:
        throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  /**
   * Send via native SMS intent (MVP implementation)
   */
  async sendViaNativeIntent(phoneNumber, message) {
    try {
      const encodedMessage = encodeURIComponent(message);
      const smsUrl = `sms:${phoneNumber}?body=${encodedMessage}`;
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (!canOpen) {
        throw new Error('Cannot open SMS app');
      }

      await Linking.openURL(smsUrl);
      
      return {
        success: true,
        method: 'native',
        status: 'opened',
        note: 'User must manually send the message',
      };
    } catch (error) {
      console.error('Native SMS intent error:', error);
      return {
        success: false,
        method: 'native',
        error: error.message,
      };
    }
  }

  /**
   * Send via native email intent (MVP implementation)
   */
  async sendEmailViaNativeIntent(email, subject, body) {
    try {
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
      
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (!canOpen) {
        throw new Error('Cannot open email app');
      }

      await Linking.openURL(mailtoUrl);
      
      return {
        success: true,
        method: 'native',
        status: 'opened',
        note: 'User must manually send the email',
      };
    } catch (error) {
      console.error('Native email intent error:', error);
      return {
        success: false,
        method: 'native',
        error: error.message,
      };
    }
  }

  /**
   * Send via Twilio (V2 implementation stub)
   */
  async sendViaTwilio(phoneNumber, message) {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured');
    }

    // V2 implementation would go here
    // For MVP, this is a stub that throws an error
    throw new Error('Twilio provider not implemented yet. This will be added in V2.');
    
    /* V2 Implementation would be:
    try {
      const axios = require('axios');
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        new URLSearchParams({
          From: this.twilioPhoneNumber,
          To: phoneNumber,
          Body: message,
        }),
        {
          auth: {
            username: this.twilioAccountSid,
            password: this.twilioAuthToken,
          },
        }
      );

      return {
        success: true,
        method: 'twilio',
        status: 'sent',
        messageId: response.data.sid,
        cost: 0.0079, // $0.0079 per SMS
      };
    } catch (error) {
      console.error('Twilio API error:', error);
      return {
        success: false,
        method: 'twilio',
        error: error.message,
      };
    }
    */
  }

  /**
   * Send via SendGrid (V2 implementation stub)
   */
  async sendViaSendGrid(email, subject, body) {
    throw new Error('SendGrid provider not implemented yet. This will be added in V2.');
  }

  /**
   * Get user approval before sending message
   * This would show a modal/alert to user
   */
  async getApproval(recipient, message, userId) {
    // In MVP, this would show a confirmation dialog
    // For now, return true (auto-approve for MVP)
    // In production, would use Alert.alert() or custom modal
    
    // Example implementation:
    /*
    return new Promise((resolve) => {
      Alert.alert(
        'Send Message?',
        `Send to ${recipient.name || recipient.phoneNumber || recipient.email}?\n\n${message}`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Send', onPress: () => resolve(true) },
        ]
      );
    });
    */
    
    return true; // Auto-approve for MVP
  }
}

export default new ExternalMessagingService();

