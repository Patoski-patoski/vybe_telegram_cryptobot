// src/bots/walletTrackerHandler.ts

import TelegramBot from "node-telegram-bot-api";
import fs from 'fs/promises';
import path from 'path';
import { BaseHandler } from "./baseHandler";
import { timeAgo, formatUsdValue, formatPnLAlert, isValidWalletAddress, deleteDoubleSpace } from "../utils/utils";
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
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';
import { RedisService } from "../services/redisService";

// Configurable settings
const DEFAULT_CHECK_INTERVAL_MS = 2 * 60 * 1000;  // 5 minutes default
const MAX_WALLETS_PER_USER = 5;  // Limit wallets per user
const SIGNIFICANT_VALUE_CHANGE_PERCENT = 5;  // Alert on 5% value change

export class EnhancedWalletTrackerHandler extends BaseHandler {
    private alerts: Map<string, Map<number, WalletAlertSettings>> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;
    private walletAnalysis: WalletAnalysisService;
    private lastErrorTime: Map<string, number> = new Map(); // Track API error times
    private historicalValues: Map<string, { value: string; timestamp: number }> = new Map();
    private walletDataCache: Map<string, { data: any, expiry: number }> = new Map();
    private redisService: RedisService | null = null;

    constructor(bot: TelegramBot, api: VybeApiService, checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS) {
        super(bot, api);
        this.walletAnalysis = new WalletAnalysisService(api);
        this.initRedis(checkIntervalMs);  // Initialize Redis first
        this.setupDailySnapshot()
    }

    private async initRedis(checkIntervalMs: number) {
        try {
            this.redisService = await RedisService.getInstance();
            logger.info("Redis initialized for EnhancedWalletTrackerHandler");
            await this.loadAlerts();
            this.startWatchingWallets(checkIntervalMs);
            this.setupGracefulShutdown();
            logger.info("Redis initialized for EnhancedWalletTrackerHandler");
        } catch (error) {
            logger.error("Failed to initialize Redis:", error);
            // Fallback to empty data
            this.alerts = new Map();
            this.historicalValues = new Map();
            this.startWatchingWallets(DEFAULT_CHECK_INTERVAL_MS);
        }
    }
    private setupDailySnapshot() {
        // Calculate time until 1:00 AM GMT+1
        const now = new Date();
        const target = new Date();
        target.setUTCHours(0, 0, 0, 0); // GMT
        target.setHours(target.getHours() + 1); // GMT+1

        if (target <= now) {
            target.setDate(target.getDate() + 1);
        }

        const timeUntilTarget = target.getTime() - now.getTime();

        // Schedule first run
        setTimeout(() => {
            this.takeDailySnapshot();

            // Then schedule daily runs
            setInterval(() => this.takeDailySnapshot(), 24 * 60 * 60 * 1000);
        }, timeUntilTarget);

        logger.info(`Daily snapshot scheduled for ${target.toISOString()} (in ${timeUntilTarget / 1000 / 60} minutes)`);
    }
    private startWatchingWallets(checkIntervalMs: number) {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
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

        logger.info(`Starting wallet check cycle. Number of tracked wallets: ${this.alerts.size}`);

        // Process wallets in parallel with rate limiting
        for (const [walletAddress, userAlerts] of this.alerts) {
            logger.info(`Checking wallet ${walletAddress} with ${userAlerts.size} users tracking it`);

            try {
                // Get current wallet balance once for all users tracking this wallet
                const balance = await this.api.getTokenBalance(walletAddress);
                logger.info(`Got balance for wallet ${walletAddress}: ${balance.totalTokenValueUsd}`);

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
            } catch (error) {
                logger.error(`Error fetching balance for wallet ${walletAddress}:`, error);
            }
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
            const currentTime = Math.floor(Date.now() / 1000);
            const currentValue = balance.totalTokenValueUsd;

            // Update historical value if 24 hours have passed
            const lastHistorical = this.historicalValues.get(walletAddress);
            if (!lastHistorical || (currentTime - lastHistorical.timestamp) >= 24 * 60 * 60) {
                this.historicalValues.set(walletAddress, {
                    value: currentValue,
                    timestamp: currentTime
                });
            }

            if (this.redisService) {
                const historicalMap = new Map<string, string>();
                historicalMap.set('value', currentValue);
                historicalMap.set('timestamp', currentTime.toString());
                await this.redisService.setHistoricalValues(settings.chatId, walletAddress, historicalMap);
            }
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
    /**
     * Checks for new transfers in the given wallet and sends a Telegram notification to the user if a new transfer is detected.
     * @param walletAddress The address of the wallet to check for new transfers.
     * @param settings The tracking settings for the given wallet.
     */
    private async checkForNewTransfers(walletAddress: string, settings: WalletAlertSettings): Promise<void> {
        try {
            // Fetch both sent and received transfers in parallel
            const [sentTransfers, receivedTransfers] = await Promise.all([
                this.api.getWalletRecentTransfers({ senderAddress: walletAddress, limit: 1 }),
                this.api.getWalletRecentTransfers({ receiverAddress: walletAddress, limit: 1 })
            ]);

            // Combine and sort transfers by block time
            const allTransfers = [
                ...(sentTransfers?.transfers || []),
                ...(receivedTransfers?.transfers || [])
            ].sort((a, b) => b.blockTime - a.blockTime);

            if (allTransfers.length > 0) {
                const latestTransfer = allTransfers[0];
                const latestSignature = latestTransfer.signature;

                if (settings.lastKnownSignature !== latestSignature) {
                    // New transaction detected
                    settings.lastKnownSignature = latestSignature;
                    await this.sendTransferMessage(settings.chatId, latestTransfer);

                    // Check if there are more recent transfers we should notify about
                    const [additionalSent, additionalReceived] = await Promise.all([
                        this.api.getWalletRecentTransfers({ senderAddress: walletAddress, limit: 2 }),
                        this.api.getWalletRecentTransfers({ receiverAddress: walletAddress, limit: 2 })
                    ]);

                    const additionalTransfers = [
                        ...(additionalSent?.transfers || []),
                        ...(additionalReceived?.transfers || [])
                    ].sort((a, b) => b.blockTime - a.blockTime);

                    // Skip the first one as we already notified about it
                    if (additionalTransfers.length > 1) {
                        for (let i = 1; i < additionalTransfers.length; i++) {
                            const tx = additionalTransfers[i];
                            if (tx.signature !== settings.lastKnownSignature) {
                                await this.sendTransferMessage(settings.chatId, tx);
                            } else {
                                break; // Stop once we hit a previously seen transaction
                            }
                        }
                    }
                }
            }
        } catch (error) {
            logger.error(`Error checking transfers for wallet ${walletAddress}:`, error);
        }
    }


    /**
     * Sends a formatted message to a Telegram chat about a recent transfer
     * @param chatId The Telegram chat ID to send the message to
     * @param tx The RecentTransfer object to format into a message
     */
    private async sendTransferMessage(chatId: number, tx: RecentTransfer) {
        try {
            // Fetch token symbol for this specific transfer
            let tokenSymbol = "Unknown";

            if (tx.mintAddress) {
                try {
                    const topHolderResponse = await this.api.getTopTokenHolder(tx.mintAddress, 1);
                    if (topHolderResponse?.data?.[0]?.tokenSymbol) {
                        tokenSymbol = topHolderResponse.data[0].tokenSymbol;
                    }
                } catch (error) {
                    logger.warn(`Could not fetch token symbol for mint ${tx.mintAddress}:`, error);
                    // Continue with "Unknown" token symbol
                }
            }

            const sender = tx.senderAddress || "Unknown";
            const receiver = tx.receiverAddress || "Unknown";
            const amount = `${parseFloat(tx.calculatedAmount).toLocaleString(
                undefined, { maximumFractionDigits: 6 })} ${tokenSymbol}`;
            const url = `https://solscan.io/tx/${tx.signature}`;
            const time = timeAgo(tx.blockTime);

            const message =
                `💰 *Transfer Summary*\n\n` +
                `👤 *From:* \`${sender}\`\n\n` +
                `📥 *To:* \`${receiver}\`\n\n` +
                `💸 *Transfer Amount:* \`${amount}\`\n\n` +
                `🕒 *Block Time:* _${time}_\n\n` +
                `🔗 [🔍 View more on Solscan](${url})`;

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });

        } catch (error) {
            logger.error(`Error sending transfer message:`, error);
            // Send a simplified message if we encounter an error
            await this.bot.sendMessage(
                chatId,
                `💰 New transfer detected. View on Solscan: https://solscan.io/tx/${tx.signature}`,
                { disable_web_page_preview: true }
            );
        }
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

            await this.bot.sendMessage(settings.chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });
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
        const currentValue = parseFloat(balance.totalTokenValueUsd);

        let message = `📊 *Wallet Tracking Update*\n\n` +
            `*Wallet Address:* \`${settings.walletAddress}\`\n`;


        // Get yesterday's date in YYYY-MM-DD format
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().split('T')[0];

        // Try to get historical value from Redis with date first
        let historicalValueStr = null;
        if (this.redisService) {
            historicalValueStr = await this.redisService.getHistoricalValueByDate(
                settings.walletAddress,
                yesterdayKey
            );
        }

        // Fallback to in-memory if Redis data not available
        if (!historicalValueStr) {
            const historicalValue = this.historicalValues.get(settings.walletAddress);
            if (historicalValue) {
                historicalValueStr = historicalValue.value;
            }
        }

        if (historicalValueStr) {
            const historicalValueNum = parseFloat(historicalValueStr);
            const changePercent = ((currentValue - historicalValueNum) / historicalValueNum) * 100;
            const changeEmoji = changePercent > 0 ? '📈 +' : (changePercent < 0 ? '📉' : '➡️');

            message += `*Wallet Value 24h ago:* ${formatUsdValue(historicalValueStr)}\n` +
                `*Current Wallet Value:* ${formatUsdValue(currentValue.toString())}\n` +
                `*24h Change:* ${changeEmoji} ${Math.abs(changePercent).toFixed(2)}%\n\n`;
        } else {
            message += `*Current Wallet Value:* ${formatUsdValue(currentValue.toString())}\n\n` +
                `*24h Change:* _Data will be available tomorrow_\n\n`;
        }

        // Generate and send the pie chart
        try {
            const chartBuffer = await this.generateHoldingsPieChart(balance.data, settings.walletAddress);

            // Create inline keyboard buttons
            const keyboard = {
                inline_keyboard: [
                    [
                        {
                            text: "View Recent Transactions",
                            callback_data: `view_transactions_${settings.walletAddress}`
                        },
                        {
                            text: "View wallet's Top Holdings",
                            callback_data: `view_holdings_${settings.walletAddress}`
                        }
                    ]
                ]
            };

            await this.bot.sendPhoto(chatId, chartBuffer, {
                caption: message,
                parse_mode: "Markdown",
                reply_markup: keyboard
            });

            // Store the data for later use
            this.storeWalletData(settings.walletAddress, {
                balance,
                settings,
                historicalValueStr
            });

        } catch (error) {
            logger.error("Error generating holdings chart:", error);
            await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        }
    }

    /**
     * Stores wallet data in the local cache and optionally in Redis with a 5-minute expiration.
     * @param walletAddress The address of the wallet whose data is being stored.
     * @param data The data related to the wallet to be cached.
     */

    private storeWalletData(walletAddress: string, data: any) {
        // Store data for 5 minutes
        const expiry = Date.now() + 5 * 60 * 1000;
        this.walletDataCache.set(walletAddress, { data, expiry });
        if (this.redisService) {
            const cacheKey = `wallet_data:${walletAddress}`;
            console.log("CacheKey", cacheKey);
            this.redisService.setCachedResponse(cacheKey, data, 300); // 5 minutes TTL
        }
    }


    /**
     * Handles the /view_transactions command, which displays the recent transfers of a given wallet.
     * @param chatId The Telegram chat ID to send the message to.
     * @param walletAddress The address of the wallet to analyze.
     */
    async handleViewTransactions(chatId: number, walletAddress: string) {

        await this.bot.sendMessage(chatId,
            `💰 *Recent Transfer Summary*\n`,
            { parse_mode: "Markdown" }
        );

        let message = "";
        try {
            const [sentTransfers, receivedTransfers] = await Promise.all([
                this.api.getWalletRecentTransfers({ senderAddress: walletAddress, limit: 3 }),
                this.api.getWalletRecentTransfers({ receiverAddress: walletAddress, limit: 3 })
            ]);

            const mintAddress = sentTransfers.transfers[0].mintAddress;
            const tokenSymbol = (await this.api.getTopTokenHolder(mintAddress, 1)).data[0].tokenSymbol;

            const allTransfers = [
                ...(sentTransfers?.transfers || []),
                ...(receivedTransfers?.transfers || [])
            ].sort((a, b) => b.blockTime - a.blockTime);

            if (allTransfers.length > 0) {
                for (const tx of allTransfers.slice(0, 6)) {
                    await this.sendTransferMessage(chatId, tx);
                }
            } else {
                message += "No recent transfers found\n";
            }
        } catch (error) {
            logger.error(`Error fetching recent transfers for wallet ${walletAddress}:`, error);
            message += "\nError fetching recent transfers\n";
        }

        await this.bot.sendMessage(chatId, message, {
            parse_mode: "Markdown",
            disable_web_page_preview: true
        });
    }

    /**
     * Handles the /view_holdings command, which displays the top 7 tokens held
     * by a given wallet along with their current value and 1-day price change.
     * @param chatId The Telegram chat ID to send the message to.
     * @param walletAddress The address of the wallet to analyze.
     */
    async handleViewHoldings(chatId: number, walletAddress: string) {
        try {
            // Fetch fresh wallet data
            const balance = await this.api.getTokenBalance(walletAddress);
            if (!balance?.data?.length) {
                return this.bot.sendMessage(chatId, "⛔ No tokens found in the specified wallet.");
            }

            let message = `\n*Top Holdings*\n \`${walletAddress}\`\n\n`;

            // Sort tokens by value and get top 7
            const sortedTokens = [...balance.data].sort((a, b) =>
                parseFloat(b.valueUsd) - parseFloat(a.valueUsd));

            for (let i = 0; i < Math.min(7, sortedTokens.length); i++) {
                const token = sortedTokens[i];
                message += `${i + 1}. *${token.symbol}*: ${formatUsdValue(token.valueUsd)}`;

                if (parseFloat(token.priceUsd1dChange) !== 0) {
                    const changeChar = parseFloat(token.priceUsd1dChange) > 0 ? '📈 +' : '📉 ';
                    message += ` (${changeChar} ${parseFloat(token.priceUsd1dChange).toFixed(2)}%)\n\n`;
                } else {
                    message += '\n';
                }
            }

            // Get fresh PnL data
            const pnl = await this.walletAnalysis.calculatePnL(walletAddress);
            if (pnl) {
                message += `\n${formatPnLAlert(pnl)}\n`;
            }

            message += `\n_Last updated just now_`;

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });
        } catch (error) {
            logger.error(`Error fetching wallet holdings for ${walletAddress}:`, error);
            await this.bot.sendMessage(chatId, "❌ Error fetching wallet holdings. Please try again later.");
        }
    }

    /**
     * Handles the /trackwallet command, which sets up a wallet to be periodically
     * checked for significant activity and sends a notification to the user if
     * a change is detected.
     * @param msg The Telegram message containing the command and wallet address.
     */
    async handleTrackWallet(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

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
                `⚠️ You've reached the maximum limit of ${MAX_WALLETS_PER_USER} tracked wallets` +
                `\nPlease remove one before adding a new one.`
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
                existingSettings.lastCheckedTime = Math.floor(Date.now() / 1000);
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
                const recentTransfers = await this.api.getWalletRecentTransfers({ senderAddress: walletAddress, limit: 1 });
                if (recentTransfers?.transfers.length > 0) {
                    settings.lastKnownSignature = recentTransfers.transfers[0].signature;
                }
            } catch (error) {
                logger.warn(`Could not fetch recent transfers for new wallet ${walletAddress}`, error);
            }

            // Add new tracking settings
            userAlerts.set(chatId, settings);

            // Save to Redis
            if (this.redisService) {
                await this.redisService.setTrackedWallet(chatId, walletAddress, settings);
            }
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
                `✅ *Successfully set up tracking for wallet: *\n\n \`\`\`${walletAddress}\`\`\`\n\n To be triggered with a minimum value of ${formatUsdValue(minValueUsd)}.\n\nYou will receive notifications when significant activity is detected.`,
                { parse_mode: "Markdown" }
            );

        } catch (error) {
            logger.error("Error setting up wallet tracking:", error);
            await this.bot.sendMessage(chatId, "❌ Error setting up wallet tracking. Please try again later.");
        }
    }

    async handleListTrackedWallets(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        if (parts?.[1] === 'help') {
            return this.bot.sendMessage(chatId, BOT_MESSAGES.LIST_TRACKED_WALLETS_HELP, { parse_mode: "Markdown" });
        }

        // Collect all wallets tracked by this user
        const userWallets: { address: string, settings: WalletAlertSettings }[] = [];

        // First try to get wallets from Redis
        if (this.redisService) {
            try {
                const trackedWallets = await this.redisService.getTrackedWallets(chatId);
                for (const [walletAddress, settings] of trackedWallets) {
                    userWallets.push({ address: walletAddress, settings });
                }
            } catch (error) {
                logger.error('Error loading tracked wallets from Redis:', error);
            }
        }

        // If no wallets found in Redis, check in-memory cache
        if (userWallets.length === 0) {
            for (const [walletAddress, userAlerts] of this.alerts) {
                const settings = userAlerts.get(chatId);
                if (settings) {
                    userWallets.push({ address: walletAddress, settings });
                }
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

        message += "Use `/remove_tracked_wallet <wallet_address>` to stop tracking.";

        await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown", disable_web_page_preview: true });
    }

    /**
     * Handle listing all wallets tracked by a user.
     * @param msg Telegram message object
     */

    async handleRemoveTrackedWallet(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        const keyboard = {
            inline_keyboard:
                [[{ text: "💨 View Commands", callback_data: `help` }]]
        };


        if (parts.length < 2) {
            return this.bot.sendMessage(chatId, "Usage: /remove_tracked_wallet <wallet_address>");
        }

        const walletAddress = parts[1];
        const userAlerts = this.alerts.get(walletAddress);

        if (userAlerts && userAlerts.has(chatId)) {
            userAlerts.delete(chatId);
            // Save to Redis
            if (this.redisService) {
                await this.redisService.removeTrackedWallet(chatId, walletAddress);
            }
            await this.saveAlerts();
            await this.bot.sendMessage(chatId,
                `✅ Removed tracking for wallet \`${walletAddress}\`` +
                `You no longer track and will not receive notification from this address` +
                `\n\n Use /track\\_wallet [wallet\\_address] to start tracking again.`,
                {
                    parse_mode: "Markdown",
                    reply_markup: keyboard
                }
            );
        } else {
            await this.bot.sendMessage(chatId,
                `❌ No active tracking found for wallet ${walletAddress}\n` +
                `Or you don't have permission to remove it.`
            );
        }
    }

    /**
     * Analyze a given wallet address and send a report of token holdings,
     * portfolio value, and recent transfers.
     * @param msg - The Telegram message containing the command and wallet address
     */
    async handleWalletAnalysis(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        const keyboard = {
            inline_keyboard:
                [[{ text: "💨 View Commands", callback_data: `help` }]]
        };

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId, "Usage: /analyze_Wallet <wallet_address>");
        }

        const walletAddress = parts[1];
        if (!isValidWalletAddress(walletAddress)) {
            return this.bot.sendMessage(chatId, "⛔ Invalid wallet address format.");
        }

        try {
            const loadingMsg = await this.bot.sendMessage(chatId, "🔍 Analyzing wallet activity, please wait...");

            // Fetch all data in parallel
            const [balance, pnl, category, sentTransfers, receivedTransfers] = await Promise.all([
                this.api.getTokenBalance(walletAddress),
                this.walletAnalysis.calculatePnL(walletAddress),
                this.walletAnalysis.analyzeWalletCategory(walletAddress),
                this.api.getWalletRecentTransfers({ senderAddress: walletAddress, limit: 5 }),
                this.api.getWalletRecentTransfers({ receiverAddress: walletAddress, limit: 5 }),
            ]);

            // Delete loading message
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            if (!balance?.data?.length) {
                return this.bot.sendMessage(chatId, "⛔ No tokens found in the specified wallet.");
            }

            // 1. First, send token analysis data
            const sortedTokens = [...balance.data].sort((a, b) =>
                parseFloat(b.valueUsd) - parseFloat(a.valueUsd));

            let tokenAnalysisMsg = `📊 *Token Analysis Report*\n\n`;
            tokenAnalysisMsg += `*Wallet Address:* \`${walletAddress}\`\n`;
            tokenAnalysisMsg += `*Total Portfolio Value:* ${formatUsdValue(balance.totalTokenValueUsd)}\n`;
            if (category?.type) {
                tokenAnalysisMsg += `*Wallet Type:* ${category.type}\n`;
                if (category.protocols?.length) {
                    tokenAnalysisMsg += `*Active Protocols:* ${category.protocols.join(', ')}\n`;
                }
            }
            tokenAnalysisMsg += `\n*Top Token Holdings (${balance.data.length}):*\n`;

            // Show top 7 tokens with details
            for (let i = 0; i < Math.min(7, sortedTokens.length); i++) {
                const token = sortedTokens[i];
                tokenAnalysisMsg += `${i + 1}. *${token.symbol}*: ${formatUsdValue(token.valueUsd)}`;
                if (parseFloat(token.priceUsd1dChange) !== 0) {
                    const changeChar = parseFloat(token.priceUsd1dChange) > 0 ? '📈 +' : '📉';
                    tokenAnalysisMsg += ` (${changeChar}${parseFloat(token.priceUsd1dChange).toFixed(2)}%)\n`;
                } else {
                    tokenAnalysisMsg += '\n';
                }
            }

            if (balance.data.length > 7) {
                tokenAnalysisMsg += `..._and ${balance.data.length - 7} more tokens_\n`;
            }

            // Send token analysis message
            await this.bot.sendMessage(chatId, tokenAnalysisMsg, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });

            // 2. Send PnL information if available
            if (pnl) {
                await this.bot.sendMessage(chatId, formatPnLAlert(pnl), {
                    parse_mode: "Markdown",
                    disable_web_page_preview: true
                });
            }

            // 3. Send recent transfers if available
            const allTransfers = [
                ...(sentTransfers?.transfers || []),
                ...(receivedTransfers?.transfers || [])
            ].sort((a, b) => b.blockTime - a.blockTime);

            if (allTransfers.length > 0) {
                await this.bot.sendMessage(chatId, "💰 *Recent Transfers:*", {
                    parse_mode: "Markdown"
                });

                // Send up to 4 most recent transfers
                setTimeout(async () => {
                    for (let i = 0; i < Math.min(4, allTransfers.length); i++) {
                        await this.sendTransferMessage(chatId, allTransfers[i]);
                    }
                }, 3000);

            }

        } catch (error) {
            logger.error("Error analyzing wallet:", error);
            await this.bot.sendMessage(chatId, "❌ Error analyzing wallet. The address may be invalid or our service might be experiencing issues.");
        }
    }

    // Add this method to your class
    async takeDailySnapshot() {
        logger.info('Taking daily wallet value snapshot');
        const timestamp = Math.floor(Date.now() / 1000);
        const dateKey = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

        for (const [walletAddress, userAlerts] of this.alerts) {
            try {
                // Only fetch balance once per wallet regardless of how many users track it
                const balance = await this.api.getTokenBalance(walletAddress);
                if (balance?.totalTokenValueUsd) {
                    // Update in-memory store
                    this.historicalValues.set(walletAddress, {
                        value: balance.totalTokenValueUsd,
                        timestamp: timestamp
                    });

                    // Store in Redis with date key for better historical tracking
                    if (this.redisService) {
                        await this.redisService.setHistoricalValueWithDate(
                            walletAddress,
                            dateKey,
                            balance.totalTokenValueUsd
                        );
                    }
                }
            } catch (error) {
                logger.error(`Error taking snapshot for wallet ${walletAddress}:`, error);
            }
        }

        logger.info('Daily wallet snapshot completed');

        /**
         * Saves the current state of wallet alerts and historical values.
         * 
         * If a Redis service is available, data is saved to Redis. Each wallet's alerts
         * and historical values are stored with the appropriate chat IDs and wallet addresses.
         * 
         * If Redis is not available, the data is serialized and written to the local file system
         * in JSON format under the `data/wallet-alerts.json` path. This includes alerts and
         * historical values for all tracked wallets.
         * 
         * The function ensures that any necessary directories are created if they don't exist,
         * and logs the success or failure of the save operation.
         * 
         * Catches and logs any errors during the save process.
         */

    } private async saveAlerts() {
        try {
            if (!this.redisService) {
                // Fallback to file system if Redis is not available
                const serializableData = {
                    alerts: Array.from(this.alerts.entries()).map(([walletAddress, userAlerts]) => [
                        walletAddress,
                        Array.from(userAlerts.entries()).map(([chatId, settings]) => [
                            chatId,
                            { ...settings, lastBalances: Array.from(settings.lastBalances?.entries() || []) }
                        ])
                    ]),
                    historicalValues: Array.from(this.historicalValues.entries())
                };

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
                return;
            }

            // Save to Redis
            // Save each wallet alert
            for (const [walletAddress, userAlerts] of this.alerts) {
                for (const [chatId, settings] of userAlerts) {
                    const value = this.historicalValues.get(walletAddress);
                    if (value) {
                        const historicalMap = new Map();
                        historicalMap.set('value', value.value);
                        historicalMap.set('timestamp', value.timestamp.toString());
                        await this.redisService.setHistoricalValues(chatId, walletAddress, historicalMap);
                    }
                    // Convert lastBalances Map to a format that can be stored in Redis
                    const serializableSettings = {
                        ...settings,
                        lastBalances: settings.lastBalances ? new Map(settings.lastBalances) : new Map()
                    };
                    await this.redisService.setTrackedWallet(chatId, walletAddress, serializableSettings);
                }
            }

            // Save historical values
            for (const [walletAddress, value] of this.historicalValues) {
                const historicalMap = new Map();
                historicalMap.set('value', value.value);
                historicalMap.set('timestamp', value.timestamp.toString());
                await this.redisService.setHistoricalValues(0, walletAddress, historicalMap); // Using 0 as a generic chatId for historical values
            }

            logger.info('Successfully saved wallet alerts to Redis');
        } catch (error) {
            logger.error('Failed to save wallet alerts:', error);
        }
    }
    /**
     * Loads wallet alerts from Redis or a fallback JSON file
     * @return {Promise<void>}
     * @private
     */
    private async loadAlerts() {
        try {
            if (!this.redisService) {
                // Fallback to file system if Redis is not available
                const filePath = path.join(__dirname, '../data/wallet-alerts.json');
                const data = await fs.readFile(filePath, 'utf-8');
                const { alerts: serializableAlerts, historicalValues: serializableHistorical } = JSON.parse(data);

                // Convert serialized data back to nested Maps
                this.alerts = new Map(serializableAlerts.map(([walletAddress, userAlerts]: [string, any]) => [
                    walletAddress,
                    new Map(userAlerts.map(([chatId, settings]: [number, any]) => [
                        chatId,
                        { ...settings, lastBalances: new Map(settings.lastBalances) }
                    ]))
                ]));

                // Load historical values
                this.historicalValues = new Map(serializableHistorical);

                logger.info(`Loaded ${this.alerts.size} tracked wallets from storage`);
                return;
            }

            // Load from Redis
            this.alerts = new Map();
            this.historicalValues = new Map();

            // Get all user IDs that have tracked wallets
            const userIds = await this.redisService.getAllUserIds();
            logger.info(`Found ${userIds.length} users with tracked wallets`);

            for (const userId of userIds) {
                const chatId = parseInt(userId);
                const trackedWallets = await this.redisService.getTrackedWallets(chatId);
                logger.info(`User ${chatId} has ${trackedWallets.size} tracked wallets`);

                for (const [walletAddress, settings] of trackedWallets) {
                    if (!this.alerts.has(walletAddress)) {
                        this.alerts.set(walletAddress, new Map());
                    }

                    try {
                        // Ensure settings is an object and has required properties
                        if (!settings || typeof settings !== 'object') {
                            logger.warn(`Invalid settings for wallet ${walletAddress}, skipping...`);
                            continue;
                        }

                        // Convert lastBalances to Map if it exists and is valid
                        let lastBalances = new Map();
                        if (settings.lastBalances) {
                            try {
                                if (Array.isArray(settings.lastBalances)) {
                                    lastBalances = new Map(settings.lastBalances);
                                } else if (settings.lastBalances instanceof Map) {
                                    lastBalances = settings.lastBalances;
                                } else if (typeof settings.lastBalances === 'object') {
                                    lastBalances = new Map(Object.entries(settings.lastBalances));
                                }
                            } catch (mapError) {
                                logger.warn(`Error converting lastBalances for wallet ${walletAddress}:`, mapError);
                            }
                        }

                        // Create settings object with proper Map conversion
                        const settingsWithMap = {
                            ...settings,
                            walletAddress,
                            lastBalances,
                            lastTokenList: Array.isArray(settings.lastTokenList) ? settings.lastTokenList : [],
                            errorCount: settings.errorCount || 0,
                            lastCheckedTime: settings.lastCheckedTime || Math.floor(Date.now() / 1000)
                        };

                        // Ensure we refresh the lastKnownSignature on reload
                        if (!settingsWithMap.lastKnownSignature) {
                            try {
                                const recentTransfers = await this.api.getWalletRecentTransfers({
                                    senderAddress: walletAddress,
                                    limit: 1
                                });

                                if (recentTransfers?.transfers.length > 0) {
                                    settingsWithMap.lastKnownSignature = recentTransfers.transfers[0].signature;
                                    logger.info(`Updated signature for wallet ${walletAddress}: ${settingsWithMap.lastKnownSignature}`);
                                }
                            } catch (signatureError) {
                                logger.warn(`Could not fetch recent transfers for wallet ${walletAddress}:`, signatureError);
                            }
                        }

                        this.alerts.get(walletAddress)!.set(chatId, settingsWithMap);

                        // Load historical values for this wallet
                        const historicalValues = await this.redisService.getHistoricalValues(chatId, walletAddress);
                        if (historicalValues && historicalValues.size > 0) {
                            this.historicalValues.set(walletAddress, {
                                value: historicalValues.get('value') || '0',
                                timestamp: parseInt(historicalValues.get('timestamp') || '0')
                            });
                        }

                        // Additionally, try to load historical values with dates
                        if (this.redisService) {
                            for (const walletAddress of this.alerts.keys()) {
                                try {
                                    // Get yesterday's date for immediate comparison
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    const yesterdayKey = yesterday.toISOString().split('T')[0];

                                    const value = await this.redisService.getHistoricalValueByDate(
                                        walletAddress,
                                        yesterdayKey
                                    );

                                    if (value) {
                                        this.historicalValues.set(walletAddress, {
                                            value: value,
                                            timestamp: Math.floor(yesterday.getTime() / 1000)
                                        });
                                    }
                                } catch (error) {
                                    logger.warn(`Error loading historical data for wallet ${walletAddress}:`, error);
                                }
                            }
                        }

                    } catch (walletError) {
                        logger.error(`Error processing wallet ${walletAddress}:`, walletError);
                        continue;
                    }
                }
            }

            logger.info(`Successfully loaded ${this.alerts.size} tracked wallets from Redis`);
        } catch (error) {
            logger.error('Error loading wallet alerts:', error);
            // Initialize empty maps on error
            this.alerts = new Map();
            this.historicalValues = new Map();
        }
    }

    private async generateHoldingsPieChart(tokens: TokenBalance[], walletAddress: string): Promise<Buffer> {
        // Sort tokens by value and get top 7
        const sortedTokens = [...tokens].sort((a, b) =>
            parseFloat(b.valueUsd) - parseFloat(a.valueUsd)).slice(0, 7);

        const configuration: ChartConfiguration<'pie'> = {
            type: 'pie',
            data: {
                labels: sortedTokens.map(t => t.symbol),
                datasets: [{
                    data: sortedTokens.map(t => parseFloat(t.valueUsd)),
                    backgroundColor: [
                        '#4CAF50', // Green
                        '#2196F3', // Blue
                        '#FFC107', // Amber
                        '#FF5722', // Deep Orange
                        '#9C27B0', // Purple
                        '#00BCD4', // Cyan
                        '#FF9800'  // Orange
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Top Holdings Distribution of ${walletAddress}`
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        };

        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
        return await chartJSNodeCanvas.renderToBuffer(configuration);
    }
}