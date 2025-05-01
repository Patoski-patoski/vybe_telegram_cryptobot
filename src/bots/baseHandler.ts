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


    /**
     * Set up bot commands with Telegram
     * @throws if Telegram API returns an error
     * @returns {Promise<void>}
     */
    protected async setupBotCommands() {
        try {
            const commands = [
                // Wallets and Tokens users comands
                { command: 'start', description: 'Start the bot' },
                { command: 'transfers', description: 'View the transaction history of a token' },
                { command: 'top_holders', description: 'View a token top holders' },
                { command: 'set_whale_alert', description: 'Set whale alerts for a token' },
                { command: 'list_whale_alerts', description: 'View setup whale alerts' },
                { command: 'remove_whale_alert', description: 'Remove whale alert' },
                { command: 'check_whales', description: 'Check whale transfers' },
                { command: 'holder_distribution', description: 'View a token holder distribution' },
                { command: 'series', description: 'View a token time series' },
                { command: 'analyze', description: 'Comprehensive token analysis' },
                { command: 'track_wallet', description: 'Track a wallet activity' },
                { command: 'list_tracked_wallets', description: 'List tracked wallets' },
                { command: 'remove_tracked_wallet', description: 'Remove a tracked wallet' },
                { command: 'wallet_status', description: 'View a wallet status' },
              
                // Program active users commands
                { command: 'top_users', description: 'View top active users for a program' },
                { command: 'program_info', description: 'View a program info' },
                { command: 'explore', description: 'Explore a program' },
                { command: 'users_insights', description: 'Get insights about program users' },
                { command: 'activity_change', description: 'Track changes in program activity' },
                { command: 'check_program_whale_users', description: 'Check whale users for a program' },
                // Price commands
                { command: 'check_price', description: 'Get current price information for a token' },
                { command: 'set_price_alert', description: 'Set price alerts for a token' },
                { command: 'remove_price_alert', description: 'Remove price alerts for a token' },
                { command: 'list_price_alert', description: 'A List of all set price alerts' },
                // NFT commands
                { command: 'nft_portfolio', description: 'View NFT portfolio for a wallet' },
                { command: 'register_nft_wallet', description: 'Register wallet for NFT tracking' },
                { command: 'list_nft_wallets', description: 'List registered NFT wallets' },
                { command: 'remove_nft_wallet', description: 'Remove wallet from NFT tracking' },
                { command: 'nft_collection', description: 'View details of a specific NFT collection' },
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