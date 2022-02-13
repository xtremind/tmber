const { createLogger, format, transports } = require("winston");
const { combine, splat, timestamp, printf, errors, colorize } = format;

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message} `;
  if (metadata) {
    if (metadata.stack) {
      msg += metadata.stack;
    } else {
      msg += JSON.stringify(metadata);
    }
  }
  return msg;
});

const logger = createLogger({
  level: "debug",
  //level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    errors({ stack: true }),
    colorize(),
    splat(),
    timestamp(),
    myFormat
  ),
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
  logger.add(new transports.Console({ level: "debug" }));
} else {
  logger.add(new transports.Console({ level: "info" }));
  logger.add(new transports.File({ filename: "error.log", level: "error" }));
  logger.add(new transports.File({ filename: "combined.log" }));
}

module.exports = logger;
