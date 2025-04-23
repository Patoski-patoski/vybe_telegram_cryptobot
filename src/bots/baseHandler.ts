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
                { command: 'transfers', description: 'View the transaction history of a token' },
                { command: 'top_holders', description: 'View a token top holders' },
                { command: 'whalealert', description: 'Set whale alerts for a token' },
                { command: 'listwhalealerts', description: 'View setup whale alerts' },
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
                // Program active users commands
                { command: 'topusers', description: 'View top active users for a program' },
                { command: 'usersinsights', description: 'Get insights about program users' },
                { command: 'activitychange', description: 'Track changes in program activity' },
                { command: 'checkprogramwhaleusers', description: 'Check whale users for a program' },
                // Price commands
                { command: 'price', description: 'Get current price information for a token' },
                { command: 'pricealert', description: 'Set price alerts for a token' },
                { command: 'pricechange', description: 'Get hourly price changes for a token' },
                // NFT commands
                { command: 'nftportfolio', description: 'View NFT portfolio for a wallet' },
                { command: 'registernftwallet', description: 'Register wallet for NFT tracking' },
                { command: 'listnftwallets', description: 'List registered NFT wallets' },
                { command: 'removenftwallet', description: 'Remove wallet from NFT tracking' },
                { command: 'nftcollection', description: 'View details of a specific NFT collection' },
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
                    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
                }
            }
        } catch (error) {
            logger.error('Error setting up bot commands:', error);
            // Didn't throw the error to prevent bot from crashing
            // The bot can still function without commands being set
        }
    }
}