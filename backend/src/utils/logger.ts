import fs from "fs";
import path from "path";
import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;
const logsDir = path.resolve(process.cwd(), "logs");

// Checking if the logs directory exists, and if not, creating it to ensure that log files can be written without errors.
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Formatting the Logs
const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "development" ? "debug" : "info"),
  format: combine(timestamp(), myFormat),
  transports: [
    // Log to the console with colorized output for better readability during development.
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), myFormat),
    }),
    // Log error-level messages to a separate file for easier debugging and monitoring of issues.
    new winston.transports.File({ filename: path.join(logsDir, "error.log"), level: "error" }),
    // Log all messages (including info and debug) to a combined log file for comprehensive logging of application activity.
    new winston.transports.File({ filename: path.join(logsDir, "combined.log") }),
  ],
});
