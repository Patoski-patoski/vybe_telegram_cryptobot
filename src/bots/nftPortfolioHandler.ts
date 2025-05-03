// src/bots/nftPortfolioHandler.ts

import TelegramBot from "node-telegram-bot-api";
import { VybeApiService } from "../services/vybeAPI";
import logger from "../config/logger";
import {
    isValidWalletAddress,
    deleteDoubleSpace,
    formatUsdValue,
    sendAndDeleteMessage
} from "../utils/utils";
import { BOT_MESSAGES } from "../utils/messageTemplates";
import { NftCollection, NftBalanceResponse } from "../interfaces/vybeApiInterface";
import { BaseHandler } from "./baseHandler";
import { RedisService } from "../services/redisService"; // Import RedisService

export class NFTPortfolioHandler extends BaseHandler {
    private redisService!: RedisService; // Add RedisService property

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
        // Initialize RedisService asynchronously
        this.initRedisService();
    }

    /**
     * Initialize the Redis service
     */
    private async initRedisService(): Promise<void> {
        try {
            this.redisService = await RedisService.getInstance();
        } catch (error) {
            logger.error("Failed to initialize Redis service", { error });
        }
    }

    /**
     * Handle the /nftportfolio command
     * @param msg Telegram message object
     */
    async handleNFTPortfolio(msg: TelegramBot.Message): Promise<void> {
        const chatId = msg.chat.id;
        const commandArgs = msg.text?.split(' ').slice(1).join(' ').trim();

        if (commandArgs === "help") {
            await this.bot.sendMessage(chatId,
                BOT_MESSAGES.NFT_PORTFOLIO_HELP,
                {parse_mode: "Markdown"}
            );
            return
        }

        if (!commandArgs) {
            // Check if user has registered wallets
            const wallets = await this.redisService.getNFTWallets(chatId);
            if (!wallets || wallets.length === 0) {
                sendAndDeleteMessage(this.bot,
                    msg,
                    "Please provide a wallet address or register one with /register_nft_wallet first."
                )
                return;
            }

            // Use the first registered wallet
            await this.fetchAndSendNFTPortfolio(chatId, wallets[0]);
            return;
        }

        // Use provided wallet address
        if (!isValidWalletAddress(commandArgs)) {
            sendAndDeleteMessage(this.bot,
                msg,
                "Invalid wallet address. Please provide a valid Solana address."
            );
            return;
        }

        await this.fetchAndSendNFTPortfolio(chatId, commandArgs);
    }

    /**
     * Handle registering a wallet for NFT tracking
     * @param msg Telegram message object
     */
    async handleRegisterNFTWallet(msg: TelegramBot.Message): Promise<void> {
        const chatId = msg.chat.id;
        const walletAddress = msg.text?.split(' ').slice(1).join(' ').trim();

        if (walletAddress === 'help') {
            await this.bot.sendMessage(chatId,
                BOT_MESSAGES.NFT_REGISTER_HELP,
                { parse_mode: "Markdown" }
            );
            return;
        }

        if (!walletAddress || !isValidWalletAddress(walletAddress)) {
            sendAndDeleteMessage(this.bot, msg,
                BOT_MESSAGES.NFT_REGISTER_USAGE, 10
            )
            return;
        }

        // Add wallet to Redis
        const added = await this.redisService.addNFTWallet(chatId, walletAddress);

        if (!added) {
            sendAndDeleteMessage(this.bot, msg,
                "This wallet is already registered for NFT tracking."
            )
            return;
        }

        await this.bot.sendMessage(
            chatId,
            `✅ Wallet registered successfully!\n\n Use /nft_portfolio to view your NFT portfolio.`
        );
    }

    /**
     * Handle listing registered NFT wallets
     * @param msg Telegram message object
     */
    async handleListNFTWallets(msg: TelegramBot.Message): Promise<void> {
        const chatId = msg.chat.id;
        const parts = msg.text?.split(' ') || [];
        const wallets = await this.redisService.getNFTWallets(chatId);

        if (parts[1] === 'help') {
            await this.bot.sendMessage(chatId,
                BOT_MESSAGES.NFT_LIST_HELP,
                { parse_mode: "Markdown" }
            );
            return;
        }

        if (wallets.length === 0) {
            sendAndDeleteMessage(this.bot, msg,
                "You haven't registered any wallets for NFT tracking yet. Use /register_nft_wallet to add one."
            )
            return;
        }

        const walletsList = wallets.map((w, i) => `${i + 1}. \`${w}\``).join('\n');
        await this.bot.sendMessage(
            chatId,
            `*Your registered NFT wallets:*\n${walletsList}`,
            { parse_mode: 'Markdown' }
        );
    }

    /**
     * Handle removing a registered NFT wallet
     * @param msg Telegram message object
     */
    async handleRemoveNFTWallet(msg: TelegramBot.Message): Promise<void> {
        const chatId = msg.chat.id;
        const walletAddress = msg.text?.split(' ').slice(1).join(' ').trim();

        if (walletAddress === 'help') {
            await this.bot.sendMessage(chatId,
                BOT_MESSAGES.NFT_REMOVE_HELP,
                { parse_mode: "Markdown" }
            );
            return;
        }

        if (!walletAddress) {
            sendAndDeleteMessage(this.bot, msg,
                "Please provide a wallet address to remove from NFT tracking."
            );
            return;
        }

        const removed = await this.redisService.removeNFTWallet(chatId, walletAddress);

        if (!removed) {
            sendAndDeleteMessage(this.bot, msg,
                "This wallet is not currently registered for NFT tracking."
            )
            return;
        }

        await this.bot.sendMessage(
            chatId,
            "✅ Wallet removed from NFT tracking."
        );
    }

   

    /**
     * Fetch and display the NFT portfolio for a wallet
     * @param chatId Telegram chat ID
     * @param walletAddress Solana wallet address
     */
    private async fetchAndSendNFTPortfolio(chatId: number, walletAddress: string): Promise<void> {
        try {
            await this.bot.sendMessage(
                chatId,
                `Fetching NFT portfolio for wallet \`${walletAddress}\`...`,
                { parse_mode: 'Markdown' }
            );

            // Check if we have a cached result in Redis
            const cachedPortfolio = await this.redisService.getNFTPortfolio(chatId);
            let nftBalance: NftBalanceResponse | null = null;

            if (cachedPortfolio && cachedPortfolio.walletAddress === walletAddress) {
                // Use cached data
                nftBalance = {
                    data: cachedPortfolio.collections,
                    totalUsd: cachedPortfolio.collections.reduce((sum, c) => sum + parseFloat(c.valueUsd), 0).toString(),
                    totalSol: cachedPortfolio.collections.reduce((sum, c) => sum + parseFloat(c.valueSol), 0).toString(),
                    totalNftCollectionCount: cachedPortfolio.collections.length,
                    date: Date.now(), // Add current timestamp
                    ownerAddress: walletAddress // Add wallet address
                };
            } else {
                // Fetch fresh data
                nftBalance = await this.api.getNFTBalance(walletAddress);

                // Cache the result if valid
                if (nftBalance && nftBalance.data.length > 0) {
                    await this.redisService.setNFTPortfolio(chatId, {
                        walletAddress,
                        collections: nftBalance.data
                    });
                }
            }

            if (!nftBalance) {
                await this.bot.sendMessage(
                    chatId,
                    "Failed to fetch NFT portfolio. Please try again later."
                );

                return;
            }

            if (nftBalance.data.length === 0) {
                await this.bot.sendMessage(chatId, "This wallet doesn't have any NFTs.");
                return;
            }

            // Format the portfolio summary
            const portfolioSummary = this.formatPortfolioSummary(nftBalance);

            // Send the summary
            await this.bot.sendMessage(chatId, portfolioSummary, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            // Create collection buttons for detailed view
            const collectionsKeyboard = this.createCollectionsKeyboard(walletAddress, nftBalance.data);

            await this.bot.sendMessage(
                chatId,
                `Select a collection to view details for wallet \`${walletAddress}\`:`,
                {
                    reply_markup: collectionsKeyboard,
                    parse_mode: 'Markdown'
                }
            );
        } catch (error) {
            logger.error(`Failed to fetch NFT portfolio for ${walletAddress}`, { error });
            await this.bot.sendMessage(
                chatId,
                "An error occurred while fetching the NFT portfolio. Please try again later."
            );
        }
    }

   
    /**
     * Format portfolio summary for display
     * @param portfolio NFT portfolio data
     * @returns Formatted message string
     */
    private formatPortfolioSummary(portfolio: NftBalanceResponse): string {
        // Sort collections by value (highest first)
        const sortedCollections = [...portfolio.data].sort((a, b) =>
            parseFloat(b.valueUsd) - parseFloat(a.valueUsd)
        );

        // Take top 5 collections for summary
        const topCollections = sortedCollections.slice(0, 5);

        let message = `*NFT Portfolio Summary*\n\n`;
        message += `*Total Value in USD:* \`${formatUsdValue(portfolio.totalUsd)}\` \n`;
        message += `*Value in SOL:* ${parseFloat(portfolio.totalSol).toFixed(3)} SOL\n\n`;
        message += `*Collections:* ${portfolio.totalNftCollectionCount}\n\n`;
        message += `*Total NFTs:* ${portfolio.data.reduce((sum, c) => sum + c.totalItems, 0)}\n`;

        message += `*🔝 Top Collections by Value:*\n\n`;
        topCollections.forEach((collection, index) => {
            message += `${index + 1}. *${collection.name} → *`;
            message += `  Items: ${collection.totalItems} | Value: ${formatUsdValue(collection.valueUsd)}\n`;
        });

        if (portfolio.data.length > 5) {
            message += `\n_...and ${portfolio.data.length - 5} more collections_\n`;
        }

        return message;
    }

    /**
     * Format collection details for display
     * @param collection NFT collection data
     * @returns Formatted message string
     */
    private formatCollectionDetails(collection: NftCollection): string {
        let message = `*${collection.name}*\n\n`;
        message += `*Collection Address:* \`${collection.collectionAddress}\`\n\n`;
        message += `*Items Owned:* ${collection.totalItems}\n`;
        message += `*Total Value*: ${formatUsdValue(collection.valueUsd)}\n`;
        message += `*Value in SOL:* ${parseFloat(collection.valueSol).toFixed(3)} SOL\n`;
        message += `*Floor Price:* ${formatUsdValue(collection.priceUsd)} (${parseFloat(collection.priceSol).toFixed(3)} SOL)\n`;

        if (collection.logoUrl) {
            message += `\n[Logo](${collection.logoUrl})`;
        }

        return message;
    }

    /**
     * Create inline keyboard for collection selection
     * @param walletAddress Wallet address
     * @param collections NFT collections data
     * @returns Telegram inline keyboard markup
     */
    private createCollectionsKeyboard(
        walletAddress: string,
        collections: NftCollection[]
    ): TelegramBot.InlineKeyboardMarkup {
        // Sort collections by value (highest first)
        const sortedCollections = [...collections].sort((a, b) =>
            parseFloat(b.valueUsd) - parseFloat(a.valueUsd)
        );

        // Create buttons (limit to 10 to avoid message size limits)
        const buttons = sortedCollections.slice(0, 10).map((collection) => [{
            text: `${collection.name} (${collection.totalItems} items)`,
            callback_data: `nft_collection_${collection.name}`
        }]);

        return {
            inline_keyboard: buttons
        };
    }

    /**
     * Handle callback queries for NFT collection details
     * @param callbackQuery Telegram callback query
     */
    async handleCollectionCallback(callbackQuery: TelegramBot.CallbackQuery): Promise<void> {
        if (!callbackQuery.data?.startsWith('nft_collection_')) {
            return;
        }

        const chatId = callbackQuery.message?.chat.id;
        if (!chatId) return;

        // Extract collection name from callback data
        const collectionName = callbackQuery.data.replace('nft_collection_', '');

        // Get the active portfolio from Redis
        const portfolioData = await this.redisService.getNFTPortfolio(chatId);

        if (!portfolioData) {
            await this.bot.sendMessage(
                chatId,
                "Portfolio data not found. Please try viewing your portfolio again with /nft_portfolio."
            );
            await this.bot.answerCallbackQuery(callbackQuery.id);
            return;
        }

        const { walletAddress, collections } = portfolioData;

        // Find the collection in the stored data
        const collection = collections.find(c => c.name === collectionName);

        if (collection) {
            const detailsMessage = this.formatCollectionDetails(collection);
            await this.bot.sendMessage(chatId, detailsMessage, {
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            });
        } else {
            await this.bot.sendMessage(
                chatId,
                `Could not find collection "${collectionName}" in this portfolio.`
            );
        }

        await this.bot.answerCallbackQuery(callbackQuery.id);
    }
}