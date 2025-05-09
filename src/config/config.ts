import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Configuration object with validation
const config = {
    // Bot settings
    bot: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        webhookUrl: process.env.WEBHOOK_URL || '',
    },

    // Vybe API settings
    vybe: {
        apiKey: process.env.VYBE_API_KEY || '',
        apiBaseUrl: process.env.VYBE_BASE_URL as string,
        timeout: parseInt(process.env.VYBE_API_TIMEOUT || '8000', 10),
    },

    // Server settings
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || '0.0.0.0',
        environment: process.env.NODE_ENV || 'development',
    },

    // Redis settings
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD || '',
        tls: process.env.REDIS_TLS === 'true',
        port: process.env.REDIS_PORT,
        reconnectStrategy: parseInt(process.env.REDIS_RECONNECT_STRATEGY || '1000', 10), // Time in ms
    },

    // Logging settings
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
    },

    // Analytics settings
    analytics: {
        enabled: process.env.ANALYTICS_ENABLED === 'true',
        trackingId: process.env.ANALYTICS_TRACKING_ID || '',
    },
};

// Validate critical configuration
function validateConfig() {
    const errors = [];

    if (!config.bot.botToken) {
        errors.push('BOT_TOKEN is required');
    }

    if (!config.vybe.apiKey) {
        errors.push('VYBE_API_KEY is required');
    }

    if (errors.length > 0) {
        throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }
}

export function getConfig() {
    validateConfig();
    return config;
}


export default config;