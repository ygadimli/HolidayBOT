const { createLogger, format, transports } = require('winston');
const path = require('path');

const logFilePath = path.join(__dirname, '..', 'xəta.log');

const logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'holiday-bot' },
  transports: [
    new transports.File({ filename: logFilePath, level: 'error' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

module.exports = logger;
