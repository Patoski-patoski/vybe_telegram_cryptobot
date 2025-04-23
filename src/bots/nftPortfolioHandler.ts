import TelegramBot from "node-telegram-bot-api";
import { VybeApiService } from "../services/vybeAPI";
import logger from "../config/logger";
import { isValidWalletAddress, deleteDoubleSpace } from "../utils/utils";
import { NFTPortfolio, NFTCollectionData } from "../interfaces/vybeApiInterface";
import { BaseHandler } from "./baseHandler";

export class NFTPortfolioHandler extends BaseHandler {
    private userWallets: Map<number, string[]> = new Map(); // Map chat IDs to wallet addresses

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
    }

    /**
     * Handle the /nftportfolio command
     * @param msg Telegram message object
     */
    async handleNFTPortfolio(msg: TelegramBot.Message): Promise<void> {
        const chatId = msg.chat.id;
        const commandArgs = msg.text?.split(' ').slice(1).join(' ').trim();

        if (!commandArgs) {
            // Check if user has registered wallets
            const wallets = this.userWallets.get(chatId);
            console.log("wallet", wallets)
            if (!wallets || wallets.length === 0) {
                await this.bot.sendMessage(
                    chatId,
                    "Please provide a wallet address or register one with /registernftwallet first."
                );
                return;
            }

            // Use the first registered wallet
            await this.fetchAndSendNFTPortfolio(chatId, wallets[0]);
            return;
        }

        // Use provided wallet address
        if (!isValidWalletAddress(commandArgs)) {
            await this.bot.sendMessage(
                chatId,
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

        if (!walletAddress) {
            await this.bot.sendMessage(
                chatId,
                "Please provide a wallet address to register for NFT tracking."
            );
            return;
        }

        if (!isValidWalletAddress(walletAddress)) {
            await this.bot.sendMessage(
                chatId,
                "Invalid wallet address. Please provide a valid Solana address."
            );
            return;
        }

        // Store the wallet address
        const existingWallets = this.userWallets.get(chatId) || [];

        // Check if wallet is already registered
        if (existingWallets.includes(walletAddress)) {
            await this.bot.sendMessage(
                chatId,
                "This wallet is already registered for NFT tracking."
            );
            return;
        }

        // Add the new wallet
        existingWallets.push(walletAddress);
        this.userWallets.set(chatId, existingWallets);

        await this.bot.sendMessage(
            chatId,
            `✅ Wallet registered successfully! Use /nftportfolio to view your NFT portfolio.`
        );
    }

    /**
     * Handle listing registered NFT wallets
     * @param msg Telegram message object
     */
    async handleListNFTWallets(msg: TelegramBot.Message): Promise<void> {
        const chatId = msg.chat.id;
        const wallets = this.userWallets.get(chatId) || [];

        if (wallets.length === 0) {
            await this.bot.sendMessage(
                chatId,
                "You haven't registered any wallets for NFT tracking yet. Use /registernftwallet to add one."
            );
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

        if (!walletAddress) {
            await this.bot.sendMessage(
                chatId,
                "Please provide a wallet address to remove from NFT tracking."
            );
            return;
        }

        const wallets = this.userWallets.get(chatId) || [];
        const updatedWallets = wallets.filter(w => w !== walletAddress);

        if (wallets.length === updatedWallets.length) {
            await this.bot.sendMessage(
                chatId,
                "This wallet is not currently registered for NFT tracking."
            );
            return;
        }

        this.userWallets.set(chatId, updatedWallets);
        await this.bot.sendMessage(
            chatId,
            "✅ Wallet removed from NFT tracking."
        );
    }

    /**
     * Handle showing details for a specific NFT collection
     * @param msg Telegram message object
     */
    async handleCollectionDetails(msg: TelegramBot.Message): Promise<void> {
        const chatId = msg.chat.id;
        const args = msg.text?.split(' ').slice(1).join(' ').trim();

        if (!args) {
            await this.bot.sendMessage(
                chatId,
                "Please provide a wallet address and collection name separated by a comma.\n\n " +
                "Example: `/nftcollection walletAddress, Collection Name`"
            );
            return;
        }

        const [walletAddress, collectionName] = args.split(',').map(part => part.trim());

        if (!walletAddress || !collectionName) {
            await this.bot.sendMessage(
                chatId,
                "Please provide both a wallet address and collection name separated by a comma. Example: `/nftcollection walletAddress, Collection Name`"
            );
            return;
        }

        if (!isValidWalletAddress(walletAddress)) {
            await this.bot.sendMessage(
                chatId,
                "Invalid wallet address. Please provide a valid Solana address."
            );
            return;
        }

        await this.fetchAndSendCollectionDetails(chatId, walletAddress, collectionName);
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

            const nftBalance = await this.getNFTBalance(walletAddress);

            console.log("nftBalance", nftBalance);

            if (!nftBalance) {
                await this.bot.sendMessage(chatId, "Failed to fetch NFT portfolio. Please try again later.");
                return;
            }

            if (nftBalance.data.length === 0) {
                await this.bot.sendMessage(chatId, "This wallet doesn't have any NFTs.");
                return;
            }

            // Format the portfolio summary
            const portfolioSummary = this.formatPortfolioSummary(nftBalance);
            console.log("portfolioSummary", portfolioSummary);

            // Send the summary
            await this.bot.sendMessage(chatId, portfolioSummary, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            // Create collection buttons for detailed view
            const collectionsKeyboard = this.createCollectionsKeyboard(walletAddress, nftBalance.data);

            await this.bot.sendMessage(
                chatId,
                "Select a collection to view details:",
                { reply_markup: collectionsKeyboard }
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
     * Fetch and display details for a specific collection
     * @param chatId Telegram chat ID
     * @param walletAddress Solana wallet address
     * @param collectionName Name of the NFT collection
     */
    private async fetchAndSendCollectionDetails(
        chatId: number,
        walletAddress: string,
        collectionName: string
    ): Promise<void> {
        try {
            const nftBalance = await this.getNFTBalance(walletAddress);

            if (!nftBalance || nftBalance.data.length === 0) {
                await this.bot.sendMessage(
                    chatId,
                    "Could not find any NFTs for this wallet."
                );
                return;
            }

            const collection = nftBalance.data.find(
                c => c.name.toLowerCase() === collectionName.toLowerCase()
            );

            if (!collection) {
                await this.bot.sendMessage(
                    chatId,
                    `Could not find collection "${collectionName}" in this wallet.`
                );
                return;
            }

            const detailsMessage = this.formatCollectionDetails(collection);

            await this.bot.sendMessage(chatId, detailsMessage, {
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            });
        } catch (error) {
            logger.error(`Failed to fetch collection details for ${walletAddress}, ${collectionName}`, { error });
            await this.bot.sendMessage(
                chatId,
                "An error occurred while fetching the collection details. Please try again later."
            );
        }
    }

    /**
     * Call the Vybe API to get NFT balance data
     * @param walletAddress Solana wallet address
     * @returns NFT portfolio data
     */
    private async getNFTBalance(walletAddress: string): Promise<NFTPortfolio | null> {
        try {
            const response = await this.api.getNFTBalance(walletAddress);
            return response as unknown as NFTPortfolio;
        } catch (error) {
            logger.error(`Error fetching NFT balance for ${walletAddress}`, { error });
            return null;
        }
    }

    /**
     * Format portfolio summary for display
     * @param portfolio NFT portfolio data
     * @returns Formatted message string
     */
    private formatPortfolioSummary(portfolio: NFTPortfolio): string {
        // Sort collections by value (highest first)
        const sortedCollections = [...portfolio.data].sort((a, b) =>
            parseFloat(b.valueUsd) - parseFloat(a.valueUsd)
        );

        // Take top 5 collections for summary
        const topCollections = sortedCollections.slice(0, 5);

        let message = `*NFT Portfolio Summary*\n\n`;
        message += `Total Value: ${parseFloat(portfolio.totalUsd).toFixed(2)} USD (${parseFloat(portfolio.totalSol).toFixed(3)} SOL)\n`;
        message += `Collections: ${portfolio.totalNftCollectionCount}\n`;
        message += `Total NFTs: ${portfolio.data.reduce((sum, c) => sum + c.totalItems, 0)}\n\n`;

        message += `*Top Collections by Value:*\n`;
        topCollections.forEach((collection, index) => {
            message += `${index + 1}. *${collection.name}*\n`;
            message += `   Items: ${collection.totalItems} | Value: $${parseFloat(collection.valueUsd).toFixed(2)}\n`;
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
    private formatCollectionDetails(collection: NFTCollectionData): string {
        let message = `*${collection.name}*\n\n`;
        message += `Collection Address: \`${collection.collectionAddress}\`\n`;
        message += `Items Owned: ${collection.totalItems}\n`;
        message += `Total Value: $${parseFloat(collection.valueUsd).toFixed(2)} (${parseFloat(collection.valueSol).toFixed(3)} SOL)\n`;
        message += `Floor Price: $${parseFloat(collection.priceUsd).toFixed(2)} (${parseFloat(collection.priceSol).toFixed(3)} SOL)\n`;

        if (collection.logoUrl) {
            message += `\n[Collection Logo](${collection.logoUrl})`;
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
        collections: NFTCollectionData[]
    ): TelegramBot.InlineKeyboardMarkup {
        // Sort collections by value (highest first)
        const sortedCollections = [...collections].sort((a, b) =>
            parseFloat(b.valueUsd) - parseFloat(a.valueUsd)
        );

        // Create buttons (limit to 10 to avoid message size limits)
        const buttons = sortedCollections.slice(0, 10).map((collection, index) => [{
            text: `${collection.name} (${collection.totalItems} items)`,
            callback_data: `nft_${index}_${walletAddress}`
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
        if (!callbackQuery.data?.startsWith('nft_')) return;

        const chatId = callbackQuery.message?.chat.id;
        if (!chatId) return;

        const parts = callbackQuery.data.split('_');
        if (parts.length < 3) return;

        const index = parseInt(parts[1]);
        const walletAddress = parts[2];

        // Get the collection name from the button text
        const buttonText = callbackQuery.message?.reply_markup?.inline_keyboard[index][0].text;
        if (!buttonText) return;

        // Extract collection name from button text (remove the items count)
        const collectionName = buttonText.split(' (')[0];

        await this.fetchAndSendCollectionDetails(chatId, walletAddress, collectionName);
        await this.bot.answerCallbackQuery(callbackQuery.id);
    }
}