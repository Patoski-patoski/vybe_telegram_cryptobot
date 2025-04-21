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
                { command: 'transfers', description: 'View a token transfers' },
                { command: 'top_holders', description: 'View a token top holders' },
                { command: 'whalealert', description: 'Set whale alerts' },
                { command: 'listwhalealerts', description: 'List whale alerts' },
                { command: 'removewhalealert', description: 'Remove whale alert' },
                { command: 'checkwhales', description: 'Check whale transfers' },
                { command: 'holder_distribution', description: 'View a token holder distribution' },
                { command: 'series', description: 'View a token time series' },
                { command: 'analyze', description: 'Comprehensive token analysis' },
                { command: 'trackwallet', description: 'Track a wallet activity' },
                { command: 'listtrackedwallets', description: 'List tracked wallets' },
                { command: 'removetrackedwallet', description: 'Remove a tracked wallet' },
                { command: 'walletstatus', description: 'View a wallet status' },
                { command: 'programinfo', description: 'View a program info' },
                { command: 'explore', description: 'Explore a program' },
                // New commands for program active users
                { command: 'topusers', description: 'View top active users for a program' },
                { command: 'usersinsights', description: 'Get insights about program users' },
                { command: 'activitychange', description: 'Track changes in program activity' },
                { command: 'checkwhaleusers', description: 'Check whale users for a program' },
                { command: 'help', description: 'Get help' },
            ];
            // Set commands with retry logic
            let retries = 5;
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
                    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 1 second before retry
                }
            }
        } catch (error) {
            logger.error('Error setting up bot commands:', error);
            // Didn't throw the error to prevent bot from crashing
            // The bot can still function without commands being set
        }
    }
}