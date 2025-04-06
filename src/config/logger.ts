import winston from 'winston';
import config from './config';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''
        }`;
});

// Create the logger instance
const logger = winston.createLogger({
    level: config.logging.level,
    format: config.logging.format === 'json'
        ? combine(timestamp(), json())
        : combine(colorize(), timestamp(), devFormat),
    defaultMeta: { service: 'vybe-bot' },
    transports: [
        new winston.transports.Console(),
        // Add additional transports as needed (e.g., file transport)
        new winston.transports.File({
            filename: 'error.log',
            level: 'error',
            dirname: 'logs'
        }),
        new winston.transports.File({
            filename: 'combined.log',
            dirname: 'logs'
        }),
    ],
});

// If in development mode, add pretty console output
if (config.server.environment !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp(),
            devFormat
        ),
    }));
}

export default logger;