/**
 * Logger Utility
 * Simple logging with levels (debug, info, warn, error)
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const LOG_LEVEL_PRIORITY = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    this.logLevel = LOG_LEVEL_PRIORITY[process.env.LOG_LEVEL || 'INFO'];
  }

  log(level, message, data = '') {
    if (LOG_LEVEL_PRIORITY[level] >= this.logLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level}]`;
      const output = data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
      console.log(output);
    }
  }

  debug(message, data) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message, data) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message, data) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message, data) {
    this.log(LOG_LEVELS.ERROR, message, data);
  }
}

module.exports = new Logger();
