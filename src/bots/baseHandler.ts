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
            await this.bot.setMyCommands([
                { command: 'start', description: 'Initialize the bot' },
                { command: 'transfers', description: 'Retrieve a comprehensive list of token transfer transactions'},
                { command: 'holder', description: 'View Token holders\n"Example: /holder mintAddress 10"' },
                { command: 'whalealert', description: 'Set up alerts for large transfers' },
                { command: 'listwhalealerts', description: 'View your active whale alerts' },
                { command: 'removewhalealert', description: 'Remove a whale alert' },
                { command: 'checkwhales', description: 'Check recent large transfers' },
                { command: 'help', description: 'Get commands and info' },
            ]);
        } catch (error) {
            logger.error('Error setting up bot commands:', error);
            throw new Error('Failed to set up bot commands');
        }
    }
}