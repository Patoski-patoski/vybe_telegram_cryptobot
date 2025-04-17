import TelegramBot from "node-telegram-bot-api";
import fs from 'fs/promises';
import path from 'path';
import { BaseHandler } from "./baseHandler";
import { timeAgo, formatUsdValue, formatPnLAlert, isValidWalletAddress } from "../utils/utils";
import logger from "../config/logger";
import { VybeApiService } from "../services/vybeAPI";
import {
    TokenBalanceResponse,
    WalletAlertSettings,
    RecentTransfer,
    TokenBalance
} from "../interfaces/vybeApiInterface";
import { BOT_MESSAGES } from "../utils/messageTemplates";
import { WalletAnalysisService } from "../services/walletAnalysisService";

// Configurable settings
const DEFAULT_CHECK_INTERVAL_MS = 1 * 60 * 1000;  // 1 minute default
const MAX_WALLETS_PER_USER = 5;  // Limit wallets per user
const SIGNIFICANT_VALUE_CHANGE_PERCENT = 5;  // Alert on 5% value change

export class EnhancedWalletTrackerHandler extends BaseHandler {
    private alerts: Map<string, Map<number, WalletAlertSettings>> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;
    private walletAnalysis: WalletAnalysisService;
    private lastErrorTime: Map<string, number> = new Map(); // Track API error times

    constructor(bot: TelegramBot, api: VybeApiService, checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS) {
        super(bot, api);
        this.walletAnalysis = new WalletAnalysisService(api);
        this.loadAlerts();
        this.startWatchingWallets(checkIntervalMs);
        this.setupGracefulShutdown();
    }

    private startWatchingWallets(checkIntervalMs: number) {
        this.checkInterval = setInterval(() => this.checkWalletBalances(), checkIntervalMs);
        logger.info(`Enhanced Wallet Tracker started. Monitoring wallets every ${checkIntervalMs / 60000} minutes.`);
    }

    private setupGracefulShutdown() {
        process.on('SIGINT', async () => {
            if (this.checkInterval) clearInterval(this.checkInterval);
            await this.saveAlerts();
            logger.info('Gracefully shutting down Enhanced Wallet Tracker...');
            process.exit(0);
        });
    }

    private async checkWalletBalances() {
        const checkPromises: Promise<void>[] = [];
        const startTime = Date.now();

        // Process wallets in parallel with rate limiting
        for (const [walletAddress, userAlerts] of this.alerts) {
            // Get current wallet balance once for all users tracking this wallet
            const balance = await this.api.getTokenBalance(walletAddress);

            // Process each user's tracking settings for this wallet
            for (const [chatId, settings] of userAlerts) {
                const checkPromise = this.checkSingleWallet(walletAddress, settings, balance)
                    .catch(error => {
                        logger.error(`Error checking wallet [${walletAddress}] for user [${chatId}]:`, error);
                        this.lastErrorTime.set(walletAddress, Date.now());
                    });
                checkPromises.push(checkPromise);
            }

            // Add a small delay between API requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        await Promise.allSettled(checkPromises);
        await this.saveAlerts();

        const endTime = Date.now();
        logger.info(`Completed wallet check cycle in ${(endTime - startTime) / 1000} seconds`);
    }

    private async checkSingleWallet(walletAddress: string, settings: WalletAlertSettings, balance: TokenBalanceResponse): Promise<void> {
        // Skip if we had an error recently with this wallet (exponential backoff)
        const lastError = this.lastErrorTime.get(walletAddress) || 0;
        const backoffTime = Math.min(30 * 60 * 1000, Math.pow(2, settings.errorCount || 0) * 1000);
        if (Date.now() - lastError < backoffTime) {
            logger.debug(`Skipping wallet ${walletAddress} due to backoff (${backoffTime / 1000}s)`);
            return;
        }

        try {
            // Get current wallet balance
            const currentTime = Math.floor(Date.now() / 1000);

            // Check for new transfers
            await this.checkForNewTransfers(walletAddress, settings);

            // Process token list changes
            await this.processTokenListChanges(walletAddress, settings, balance);

            // Process wallet value changes
            await this.processWalletValueChanges(walletAddress, settings, balance);

            // Update wallet analytics
            settings.category = await this.walletAnalysis.analyzeWalletCategory(walletAddress);
            settings.pnl = await this.walletAnalysis.calculatePnL(walletAddress);

            // Update tokens that increased/decreased significantly
            await this.checkTokenValueChanges(settings, balance);

            // Update tracking data
            settings.lastCheckedTime = currentTime;
            settings.errorCount = 0; // Reset error count on success

            logger.debug(`Successfully checked wallet: ${walletAddress}`);
        } catch (error) {
            // Increment error count for exponential backoff
            settings.errorCount = (settings.errorCount || 0) + 1;
            throw error; // Rethrow to be caught by the caller
        }
    }

    private async checkForNewTransfers(walletAddress: string, settings: WalletAlertSettings): Promise<void> {
        const recentTransfers = await this.api.getRecentTransfers(undefined, walletAddress, undefined, 1);

        if (recentTransfers && recentTransfers.transfers.length > 0) {
            const latestSignature = recentTransfers.transfers[0].signature;

            if (settings.lastKnownSignature !== latestSignature) {
                // New transaction detected
                settings.lastKnownSignature = latestSignature;
                await this.sendTransferMessage(settings.chatId, recentTransfers.transfers[0]);

                // Check if there are more recent transfers we should notify about
                const additionalTransfers = await this.api.getRecentTransfers(
                    undefined, walletAddress, undefined, 5
                );

                // Skip the first one as we already notified about it
                if (additionalTransfers.transfers.length > 1) {
                    for (let i = 1; i < additionalTransfers.transfers.length; i++) {
                        const tx = additionalTransfers.transfers[i];
                        if (tx.signature !== settings.lastKnownSignature) {
                            await this.sendTransferMessage(settings.chatId, tx);
                        } else {
                            break; // Stop once we hit a previously seen transaction
                        }
                    }
                }
            }
        }
    }

    private async sendTransferMessage(chatId: number, tx: RecentTransfer) {
        const sender = tx.senderAddress || "Unknown";
        const receiver = tx.receiverAddress || "Unknown";
        const amount = parseFloat(tx.calculatedAmount).toLocaleString(
            undefined, { maximumFractionDigits: 6 });
        const url = `https://explorer.solana.com/tx/${tx.signature}`;
        const time = timeAgo(tx.blockTime);

        const message =
            `💰 *Transfer Summary*\n\n` +
            `👤 *From:* \`${sender}\`\n\n` +
            `📥 *To:* \`${receiver}\`\n\n` +
            `💸 *Transfer Amount(SOL):* \`${amount} SOL\`\n\n` +
            `🕒 *Block Time:* _${time}_\n\n` +
            `🔗 [🔍 View on Solscan](${url})`;

        await this.bot.sendMessage(chatId, message, {
            parse_mode: "Markdown",
            disable_web_page_preview: true
        });
    }


    private async processTokenListChanges(
        walletAddress: string,
        settings: WalletAlertSettings,
        balance: TokenBalanceResponse
    ): Promise<void> {
        const newTokenList = balance.data.map(t => t.symbol);
        const oldTokenList = settings.lastTokenList || [];

        const added = newTokenList.filter(token => !oldTokenList.includes(token));
        const removed = oldTokenList.filter(token => !newTokenList.includes(token));

        if (added.length > 0 || removed.length > 0) {
            let message = `🔄 Token list changed for \`${walletAddress}\`\n\n`;

            if (added.length > 0) {
                const addedDetails = await this.getTokenDetails(added, balance.data);
                message += `➕ *Added:*\n${addedDetails}\n\n`;
            }

            if (removed.length > 0) {
                message += `➖ *Removed:* ${removed.join(", ")}\n\n`;
            }

            // Add wallet summary
            message += `💰 *Current Wallet Value:* ${formatUsdValue(balance.totalTokenValueUsd)}`;

            await this.bot.sendMessage(settings.chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });
        }

        settings.lastTokenList = newTokenList;
    }

    private async processWalletValueChanges(
        walletAddress: string,
        settings: WalletAlertSettings,
        balance: TokenBalanceResponse
    ): Promise<void> {
        const totalValue = parseFloat(balance.totalTokenValueUsd);

        // Check threshold crossing
        if (settings.lastTotalValue !== undefined) {
            // Alert on threshold crossing
            if (totalValue >= settings.minValueUsd && settings.lastTotalValue < settings.minValueUsd) {
                // Crossed UP through threshold
                await this.bot.sendMessage(
                    settings.chatId,
                    `💹 Wallet \`${walletAddress}\` value has risen above your set threshold of ${formatUsdValue(settings.minValueUsd)}!\n\nCurrent value: ${formatUsdValue(totalValue)}`,
                    { parse_mode: "Markdown" }
                );
            } else if (totalValue < settings.minValueUsd && settings.lastTotalValue >= settings.minValueUsd) {
                // Crossed DOWN through threshold
                await this.bot.sendMessage(
                    settings.chatId,
                    `⚠️ Wallet \`${walletAddress}\` value has dropped below your set threshold of ${formatUsdValue(settings.minValueUsd)}!\n\nCurrent value: ${formatUsdValue(totalValue)}`,
                    { parse_mode: "Markdown" }
                );
            }

            // Alert on significant percentage change
            const percentChange = ((totalValue - settings.lastTotalValue) / settings.lastTotalValue) * 100;
            if (Math.abs(percentChange) >= SIGNIFICANT_VALUE_CHANGE_PERCENT) {
                const direction = percentChange > 0 ? '📈 increased' : '📉 decreased';
                await this.bot.sendMessage(
                    settings.chatId,
                    `${direction === '📈 increased' ? '📈' : '📉'} Wallet \`${walletAddress}\` value has ${direction} by ${Math.abs(percentChange).toFixed(2)}%\n\nPrevious: ${formatUsdValue(settings.lastTotalValue)}\nCurrent: ${formatUsdValue(totalValue)}`,
                    { parse_mode: "Markdown" }
                );
            }
        }

        // Send full alert if value is above threshold
        if (totalValue >= settings.minValueUsd) {
            await this.sendWalletAlert(settings, balance);
            logger.info(`✅ Alert sent for wallet: ${walletAddress}`);
        }

        settings.lastTotalValue = totalValue;
    }

    private async checkTokenValueChanges(settings: WalletAlertSettings, balance: TokenBalanceResponse): Promise<void> {
        // Track significant changes in individual token values
        const tokenChanges: { symbol: string, oldValue: number, newValue: number, change: number }[] = [];

        for (const token of balance.data) {
            const oldValueKey = `${token.mintAddress}_value`;
            const oldValue = parseFloat(settings.lastBalances?.get(oldValueKey) || '0');
            const newValue = parseFloat(token.valueUsd);

            if (oldValue > 0) {
                const percentChange = ((newValue - oldValue) / oldValue) * 100;

                // Track significant token changes (>20%)
                if (Math.abs(percentChange) >= 20 && newValue >= 10) { // $10 minimum to avoid spam
                    tokenChanges.push({
                        symbol: token.symbol,
                        oldValue,
                        newValue,
                        change: percentChange
                    });
                }
            }

            // Update stored values
            if (!settings.lastBalances) settings.lastBalances = new Map();
            settings.lastBalances.set(oldValueKey, token.valueUsd);
        }

        // Notify about significant token changes
        if (tokenChanges.length > 0) {
            // Sort by absolute change percentage (descending)
            tokenChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

            let message = `📊 *Significant Token Changes* in wallet \`${settings.walletAddress}\`\n\n`;

            for (const change of tokenChanges.slice(0, 5)) { // Limit to top 5 changes
                const emoji = change.change > 0 ? '📈' : '📉';
                message += `${emoji} *${change.symbol}*: ${change.change > 0 ? '+' : ''}${change.change.toFixed(2)}%\n`;
                message += `   ${formatUsdValue(change.oldValue)} → ${formatUsdValue(change.newValue)}\n\n`;
            }

            await this.bot.sendMessage(settings.chatId, message, { parse_mode: "Markdown" });
        }
    }

    private async getTokenDetails(tokens: string[], tokenData: TokenBalance[]): Promise<string> {
        let details = '';

        for (const symbol of tokens) {
            const token = tokenData.find(t => t.symbol === symbol);
            if (token) {
                details += `   *${token.symbol}*: ${formatUsdValue(token.valueUsd)}`;
                if (parseFloat(token.priceUsd1dChange) !== 0) {
                    const changeChar = parseFloat(token.priceUsd1dChange) > 0 ? '📈' : '📉';
                    details += ` (${changeChar} ${parseFloat(token.priceUsd1dChange).toFixed(2)}%)\n`;
                } else {
                    details += '\n';
                }
            }
        }

        return details || tokens.join(", ");
    }

    private async sendWalletAlert(settings: WalletAlertSettings, balance: TokenBalanceResponse) {
        const chatId = settings.chatId;
        let message = `📊 *Wallet Tracking Update*\n\n` +
            `*Wallet Address:* \`${settings.walletAddress}\`\n` +
            `*Total Wallet Value:* ${formatUsdValue(balance.totalTokenValueUsd)}\n`;

        if (balance.totalTokenValueUsd1dChange) {
            const changePercent = parseFloat(balance.totalTokenValueUsd1dChange);
            const changeEmoji = changePercent > 0 ? '📈' : (changePercent < 0 ? '📉' : '➡️');
            message += `*24h Change:* ${changeEmoji} ${changePercent.toFixed(2)}%\n`;
        }

        message += `\n*Top Holdings:*\n`;

        // Sort tokens by value and get top 5
        const sortedTokens = [...balance.data].sort((a, b) =>
            parseFloat(b.valueUsd) - parseFloat(a.valueUsd));

        for (let i = 0; i < Math.min(5, sortedTokens.length); i++) {
            const token = sortedTokens[i];
            message += `${i + 1}. *${token.symbol}*: ${formatUsdValue(token.valueUsd)}`;

            if (parseFloat(token.priceUsd1dChange) !== 0) {
                const changeChar = parseFloat(token.priceUsd1dChange) > 0 ? '📈' : '📉';
                message += ` (${changeChar} ${parseFloat(token.priceUsd1dChange).toFixed(2)}%)\n`;
            } else {
                message += '\n';
            }
        }

        message += `\n💰 *Recent Transfer Summary*\n`;

        const recentTransfer = await this.api.getRecentTransfers(undefined, settings.walletAddress, undefined, 3);
        if (recentTransfer?.transfers.length) {
            for (const tx of recentTransfer.transfers) {
                message += this.buildTransferMessage(tx);
            }
        } else {
            message += "_No recent transfers found_\n";
        }

        if (settings.pnl) {
            message += `\n${formatPnLAlert(settings.pnl)}\n`;
        }

        message += `\n_Last updated ${timeAgo(settings.lastCheckedTime)}_`;
        await this.bot.sendMessage(chatId, message,
            {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });
    }

    private buildTransferMessage(tx: RecentTransfer): string {
        const sender = tx.senderAddress ? `\`${tx.senderAddress.slice(0, 8)}...\`` : "Unknown";
        const receiver = tx.receiverAddress ? `\`${tx.receiverAddress.slice(0, 8)}...\`` : "Unknown";
        const amount = parseFloat(tx.calculatedAmount).toLocaleString(undefined, { maximumFractionDigits: 6 });
        const url = `https://explorer.solana.com/tx/${tx.signature}`;
        const time = timeAgo(tx.blockTime);

        // Add token info if available
        const tokenInfo = tx.tokenSymbol ? ` ${tx.tokenSymbol}` : " SOL";
        const valueInfo = tx.valueUsd ? ` (${formatUsdValue(tx.valueUsd)})` : "";

        return `\n👤 ${sender} → ${receiver}\n` +
            `💸 *Amount:* \`${amount}${tokenInfo}\`${valueInfo}\n` +
            `🕒 _${time}_ [🔍](${url})\n`;
    }

    async handleTrackWallet(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = msg.text?.split(" ") ?? [];

        if (parts[1] === 'help') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.TRACK_WALLET_HELP,
                { parse_mode: "Markdown" });
        }

        if (parts.length < 3) {
            return this.bot.sendMessage(chatId,
                "Usage: /trackwallet <wallet_address> <min_value_usd>");
        }

        const walletAddress = parts[1];
        const minValueUsd = parseFloat(parts[2]);

        if (!isValidWalletAddress(walletAddress)) {
            return this.bot.sendMessage(chatId,
                "⛔ Invalid wallet address format.");
        }

        if (isNaN(minValueUsd) || minValueUsd <= 0) {
            return this.bot.sendMessage(chatId,
                "⛔ Minimum value must be a positive number.");
        }

        // Check user's wallet limit
        let userWalletCount = 0;
        for (const userAlerts of this.alerts.values()) {
            if (userAlerts.has(chatId)) {
                userWalletCount++;
            }
        }
        if (userWalletCount >= MAX_WALLETS_PER_USER) {
            return this.bot.sendMessage(
                chatId,
                `⚠️ You've reached the maximum limit of ${MAX_WALLETS_PER_USER} tracked wallets\n\nPlease remove one before adding a new one.`
            );
        }

        try {
            const balance = await this.api.getTokenBalance(walletAddress);
            if (!balance?.data?.length) {
                return this.bot.sendMessage(chatId, "⛔ No tokens found in the specified wallet.");
            }

            const settings: WalletAlertSettings = {
                walletAddress,
                chatId,
                minValueUsd,
                lastCheckedTime: Math.floor(Date.now() / 1000),
                lastBalances: new Map(),
                errorCount: 0
            };

            // Initialize user alerts map for this wallet if it doesn't exist
            if (!this.alerts.has(walletAddress)) {
                this.alerts.set(walletAddress, new Map());
            }

            // Check if user is already tracking this wallet
            const userAlerts = this.alerts.get(walletAddress)!;
            if (userAlerts.has(chatId)) {
                // Update existing tracking settings
                const existingSettings = userAlerts.get(chatId)!;
                existingSettings.minValueUsd = minValueUsd;
                await this.saveAlerts();
                return this.bot.sendMessage(
                    chatId,
                    `✅ Updated tracking settings for wallet \`${walletAddress}\`.\nNew minimum value: ${formatUsdValue(minValueUsd)}`,
                    { parse_mode: "Markdown" }
                );
            }

            // Set initial token list
            settings.lastTokenList = balance.data.map(t => t.symbol);

            // Store initial values for change detection
            for (const token of balance.data) {
                settings.lastBalances.set(`${token.mintAddress}_value`, token.valueUsd);
            }

            // Get the latest transaction signature as baseline
            try {
                const recentTransfers = await this.api.getRecentTransfers(undefined, walletAddress, undefined, 1);
                if (recentTransfers?.transfers.length > 0) {
                    settings.lastKnownSignature = recentTransfers.transfers[0].signature;
                }
            } catch (error) {
                logger.warn(`Could not fetch recent transfers for new wallet ${walletAddress}`, error);
            }

            // Add new tracking settings
            userAlerts.set(chatId, settings);
            await this.saveAlerts();

            // Get wallet analytics for first-time display
            try {
                settings.category = await this.walletAnalysis.analyzeWalletCategory(walletAddress);
                settings.pnl = await this.walletAnalysis.calculatePnL(walletAddress);
            } catch (error) {
                logger.warn(`Could not analyze new wallet ${walletAddress}`, error);
            }

            await this.sendWalletAlert(settings, balance);

            return this.bot.sendMessage(
                chatId,
                `✅ Successfully set up tracking for wallet \`${walletAddress}\` with minimum value ${formatUsdValue(minValueUsd)}.\n\nYou will receive notifications when significant activity is detected.`,
                { parse_mode: "Markdown" }
            );

        } catch (error) {
            logger.error("Error setting up wallet tracking:", error);
            await this.bot.sendMessage(chatId, "❌ Error setting up wallet tracking. Please try again later.");
        }
    }

    async handleListTrackedWallets(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = msg.text?.split(" ");

        if (parts?.[1] === 'help') {
            return this.bot.sendMessage(chatId, BOT_MESSAGES.LIST_TRACKED_WALLETS_HELP, { parse_mode: "Markdown" });
        }

        // Collect all wallets tracked by this user
        const userWallets: { address: string, settings: WalletAlertSettings }[] = [];
        for (const [walletAddress, userAlerts] of this.alerts) {
            const settings = userAlerts.get(chatId);
            if (settings) {
                userWallets.push({ address: walletAddress, settings });
            }
        }

        if (!userWallets.length) {
            return this.bot.sendMessage(chatId, "You don't have any tracked wallets.");
        }

        let message = "📋 *Your Tracked Wallets*\n\n";

        // Sort wallets by value (if available)
        userWallets.sort((a, b) => {
            const aValue = a.settings.lastTotalValue || 0;
            const bValue = b.settings.lastTotalValue || 0;
            return bValue - aValue; // Descending by value
        });

        for (const { address, settings } of userWallets) {
            message += `*Address:* \`${address}\`\n`;
            message += `*Min Value Alert:* ${formatUsdValue(settings.minValueUsd)}\n`;

            if (settings.lastTotalValue !== undefined) {
                message += `*Current Value:* ${formatUsdValue(settings.lastTotalValue)}\n`;
            }

            if (settings.category?.type) {
                message += `*Wallet Type:* ${settings.category.type}\n`;
            }

            message += `*Last Check:* ${timeAgo(settings.lastCheckedTime)}\n\n`;
        }

        message += "Use `/removetrackedwallet <wallet_address>` to stop tracking.";

        await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown", disable_web_page_preview: true });
    }

    async handleRemoveTrackedWallet(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = msg.text?.split(" ") ?? [];

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId, "Usage: /removetrackedwallet <wallet_address>");
        }

        const walletAddress = parts[1];
        const userAlerts = this.alerts.get(walletAddress);

        if (userAlerts && userAlerts.has(chatId)) {
            userAlerts.delete(chatId);
            await this.saveAlerts();
            await this.bot.sendMessage(chatId, `✅ Removed tracking for wallet \`${walletAddress}\``,
                { parse_mode: "Markdown" });
        } else {
            await this.bot.sendMessage(chatId, `❌ No active tracking found for wallet ${walletAddress} or you don't have permission to remove it.`);
        }
    }

    async handleWalletAnalysis(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = msg.text?.split(" ") ?? [];

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId, "Usage: /analyzeWallet <wallet_address>");
        }

        const walletAddress = parts[1];
        if (!isValidWalletAddress(walletAddress)) {
            return this.bot.sendMessage(chatId, "⛔ Invalid wallet address format.");
        }

        try {
            await this.bot.sendMessage(chatId, "🔍 Analyzing wallet activity, please wait...");

            // Fetch wallet data
            const balance = await this.api.getTokenBalance(walletAddress);
            const pnl = await this.walletAnalysis.calculatePnL(walletAddress);
            const category = await this.walletAnalysis.analyzeWalletCategory(walletAddress);
            const recentTransfers = await this.api.getRecentTransfers(undefined, walletAddress, undefined, 5);

            // Create detailed analysis message
            let message = `📊 *Wallet Analysis Report*\n\n`;
            message += `*Address:* \`${walletAddress}\`\n`;
            message += `*Total Value:* ${formatUsdValue(balance.totalTokenValueUsd)}\n`;

            if (category?.type) {
                message += `*Wallet Type:* ${category.type}\n`;
                if (category.protocols?.length) {
                    message += `*Active Protocols:* ${category.protocols.join(', ')}\n`;
                }
            }

            message += `\n*Token Holdings (${balance.data.length}):*\n`;
            const sortedTokens = [...balance.data].sort((a, b) =>
                parseFloat(b.valueUsd) - parseFloat(a.valueUsd));

            for (let i = 0; i < Math.min(7, sortedTokens.length); i++) {
                const token = sortedTokens[i];
                message += `${i + 1}. *${token.symbol}*: ${formatUsdValue(token.valueUsd)}\n`;
            }

            if (balance.data.length > 7) {
                message += `..._and ${balance.data.length - 7} more tokens_\n`;
            }

            if (pnl) {
                message += `\n${formatPnLAlert(pnl)}\n`;
            }

            if (recentTransfers?.transfers.length) {
                message += `\n*Recent Transfers:*\n`;
                for (let i = 0; i < Math.min(3, recentTransfers.transfers.length); i++) {
                    message += this.buildTransferMessage(recentTransfers.transfers[i]);
                }
            }

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });

        } catch (error) {
            logger.error("Error analyzing wallet:", error);
            await this.bot.sendMessage(chatId, "❌ Error analyzing wallet. The address may be invalid or our service might be experiencing issues.");
        }
    }

    private async saveAlerts() {
        try {
            // Convert nested Maps to serializable format
            const serializableData = Array.from(this.alerts.entries()).map(([walletAddress, userAlerts]) => [
                walletAddress,
                Array.from(userAlerts.entries()).map(([chatId, settings]) => [
                    chatId,
                    { ...settings, lastBalances: Array.from(settings.lastBalances.entries()) }
                ])
            ]);

            const dataDir = path.join(__dirname, '../data');
            try {
                await fs.access(dataDir);
            } catch {
                await fs.mkdir(dataDir, { recursive: true });
            }

            await fs.writeFile(
                path.join(dataDir, 'wallet-alerts.json'),
                JSON.stringify(serializableData, null, 2)
            );
        } catch (error) {
            logger.error('Failed to save wallet alerts:', error);
        }
    }

    private async loadAlerts() {
        try {
            const filePath = path.join(__dirname, '../data/wallet-alerts.json');
            const data = await fs.readFile(filePath, 'utf-8');
            const serializableData = JSON.parse(data);

            // Convert serialized data back to nested Maps
            this.alerts = new Map(serializableData.map(([walletAddress, userAlerts]: [string, any]) => [
                walletAddress,
                new Map(userAlerts.map(([chatId, settings]: [number, any]) => [
                    chatId,
                    { ...settings, lastBalances: new Map(settings.lastBalances) }
                ]))
            ]));

            logger.info(`Loaded ${this.alerts.size} tracked wallets from storage`);
        } catch (error) {
            logger.warn('No saved wallet alerts found or error loading them:', error);
            this.alerts = new Map();
        }
    }
}