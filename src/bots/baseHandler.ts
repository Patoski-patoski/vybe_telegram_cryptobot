// Base handler for Telegram bot commands and API interactions
// /src/bots/baseHandler.ts

import TelegramBot from "node-telegram-bot-api";
import { VybeApiService } from "../services/vybeAPI";
import logger from "../config/logger";

export class BaseHandler {
    protected readonly bot: TelegramBot;
    protected readonly api: VybeApiService;

    constructor(bot: TelegramBot, api: VybeApiService) {
        this.bot = bot;
        this.api = api;
        this.setupBotCommands(); // Initialize bot commands
    }

    protected async setupBotCommands() {
        try {
            const commands = [
                { command: 'start', description: 'Start the bot' },
                { command: 'transfers', description: 'View token transfers' },
                { command: 'top_holders', description: 'View top token holders' },
                { command: 'whalealert', description: 'Set whale alerts' },
                { command: 'listwhalealerts', description: 'List whale alerts' },
                { command: 'removewhalealert', description: 'Remove whale alert' },
                { command: 'checkwhales', description: 'Check whale transfers' },
                { command: 'holder_distribution', description: 'View holder distribution' },
                { command: 'series', description: 'View token time series' },
                { command: 'analyze', description: 'Comprehensive token analysis' },
                { command: 'trackwallet', description: 'Track wallet activity' },
                { command: 'listtrackedwallets', description: 'List tracked wallets' },
                { command: 'removetrackedwallet', description: 'Remove tracked wallet' },
                { command: 'walletstatus', description: 'View wallet status' },
                { command: 'help', description: 'Get help' },
            ];

            // Set commands with retry logic
            let retries = 3;
            while (retries > 0) {
                try {
                    await this.bot.setMyCommands(commands);
                    logger.info('Bot commands set up successfully');
                    return;
                } catch (error) {
                    retries--;
                    if (retries === 0) {
                        throw error;
                    }
                    logger.warn(`Failed to set commands, retrying... (${retries} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                }
            }
        } catch (error) {
            logger.error('Error setting up bot commands:', error);
            // Don't throw the error to prevent bot from crashing
            // The bot can still function without commands being set
        }
    }
}