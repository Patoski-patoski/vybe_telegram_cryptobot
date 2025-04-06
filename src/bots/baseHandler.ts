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
                { command: 'wallets', description: 'List all wallets' },
                { command: 'balance', description: 'Check wallet balance' },
                { command: 'default', description: 'View default wallet' },
                {command: 'holder', description: 'View Token holders\n"Example: /holder mintAddress 10"' },
                { command: 'help', description: 'Get commands and info' },
            ]);
        } catch (error) {
            logger.error('Error setting up bot commands:', error);
            throw new Error('Failed to set up bot commands');
        }
    }
}