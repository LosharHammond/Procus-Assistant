/**
 * Twilio Service
 * Handles WhatsApp message sending and webhook management
 */

const twilio = require('twilio');
const logger = require('../utils/logger');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    this.client = twilio(this.accountSid, this.authToken);
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(toPhoneNumber, message) {
    try {
      logger.info(`Sending WhatsApp message to ${toPhoneNumber}`);

      const response = await this.client.messages.create({
        from: this.whatsappNumber,
        to: toPhoneNumber,
        body: message,
      });

      logger.info(`Message sent successfully: ${response.sid}`);
      return response;
    } catch (error) {
      logger.error('Twilio send error:', error);
      throw new Error('Failed to send message via Twilio');
    }
  }

  /**
   * Send message with media
   */
  async sendMessageWithMedia(toPhoneNumber, message, mediaUrl) {
    try {
      logger.info(
        `Sending WhatsApp message with media to ${toPhoneNumber}`
      );

      const response = await this.client.messages.create({
        from: this.whatsappNumber,
        to: toPhoneNumber,
        body: message,
        mediaUrl: [mediaUrl],
      });

      logger.info(`Message with media sent: ${response.sid}`);
      return response;
    } catch (error) {
      logger.error('Twilio media send error:', error);
      throw new Error('Failed to send media via Twilio');
    }
  }

  /**
   * Get message details (for debugging)
   */
  async getMessage(messageSid) {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return message;
    } catch (error) {
      logger.error('Twilio fetch error:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  isHealthy() {
    return !!(this.client && this.accountSid && this.authToken);
  }
}

module.exports = { TwilioService };
