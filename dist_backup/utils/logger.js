// utils/logger.js
export class Logger {
  static formatMessage(level, moduleName, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${moduleName}] ${message}`;
  }

  static info(moduleName, message) {
    console.log('\x1b[36m%s\x1b[0m', this.formatMessage('INFO', moduleName, message));
  }

  static success(moduleName, message) {
    console.log('\x1b[32m%s\x1b[0m', this.formatMessage('SUCCESS', moduleName, message));
  }

  static warning(moduleName, message) {
    console.warn('\x1b[33m%s\x1b[0m', this.formatMessage('WARNING', moduleName, message));
  }

  static error(moduleName, message, error = null) {
    console.error('\x1b[31m%s\x1b[0m', this.formatMessage('ERROR', moduleName, message));
    if (error) {
      console.error(error.stack || error);
    }
  }
}
