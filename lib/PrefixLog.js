class PrefixLog {
  constructor(name, logger) {
    this.prefix = `[${name}]`;
    this.logger = logger;
  }

  info(...args) {
    this.logger.info(this.prefix, ...args);
  }

  log(...args) {
    this.logger.info(this.prefix, ...args);
  }

  error(...args) {
    this.logger.error(this.prefix, ...args);
  }

  warn(...args) {
    this.logger.warn(this.prefix, ...args);
  }

  debug(...args) {
    this.logger.debug(this.prefix, ...args);
  }
}

module.exports = PrefixLog;
