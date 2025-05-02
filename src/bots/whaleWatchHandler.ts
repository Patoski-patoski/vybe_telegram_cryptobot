// src/bots/whaleWatcherHandler.ts

import TelegramBot from "node-telegram-bot-api";
import fs from 'fs/promises';
import path from 'path';
import { BaseHandler } from "./baseHandler";
import { timeAgo, formatUsdValue, deleteDoubleSpace } from "../utils/utils";
import logger from "../config/logger";
import {
    RecentTransfer,
    WhaleAlertSettings
} from "../interfaces/vybeApiInterface";
import { VybeApiService } from "../services/vybeAPI";
import { BOT_MESSAGES } from "../utils/messageTemplates";
import { RedisService } from "../services/redisService";

export class WhaleWatcherHandler extends BaseHandler {
    private alerts: Map<string, WhaleAlertSettings> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;
    private lastCheckedTime: number = Math.floor(Date.now() / 1000 - 3600); // 1 hour ago
    private redisService: RedisService | null = null;

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
        this.initRedis();
    }

    private async initRedis() {
        try {
            this.redisService = await RedisService.getInstance();
            await this.loadAlerts();
            this.startWatchingWhales();
            logger.info("Redis initialized for WhaleWatcherHandler");
        } catch (error) {
            logger.error("Failed to initialize Redis:", error);
            // Fallback to empty data
            this.alerts = new Map();
            this.startWatchingWhales();
        }
    }

    /**
     * Starts monitoring whale transactions
     * 
     * Checks every 10 minutes for transfers over the threshold
     * for each token we are monitoring.
     */

    private startWatchingWhales() {
        // check every 10 minutes
        this.checkInterval = setInterval(async () => {
            await this.checkWhaleTransactions();
        }, 3 * 60 * 1000);

        logger.info("Whale Watcher started. Monitoring whale transactions every 3 minutes.");
    }

    /**
     * Checks for whale transactions that have occurred since the last check
     * 
     * Iterates over all tokens we are monitoring and checks for transfers
     * over the threshold. If a transfer is found, it sends a message to
     * the chat with the details.
     */

    private async checkWhaleTransactions() {
        try {
            const currentTime = Math.floor(Date.now() / 1000);

            // Dont process if we have no alerts
            if (this.alerts.size === 0) return;

            // Get all tokens we need to monitor
            const allTokens = new Set<string>();
            this.alerts.forEach((settings) => {
                settings.tokens.forEach((token) => allTokens.add(token));
            });

            for (const token of allTokens) {
                // find the minimum threshold for this token
                let minimumAmount = Number.MAX_SAFE_INTEGER;
                this.alerts.forEach((settings) => {
                    if (settings.tokens.includes(token)
                        && settings.minAmount < minimumAmount) {
                        minimumAmount = Math.min(minimumAmount, settings.minAmount);
                    }
                });

                const transfers = await this.api.getWhaleTransfers({
                    mintAddress: token,
                    minAmount: minimumAmount,
                    timeStart: this.lastCheckedTime,
                    timeEnd: currentTime,
                    limit: 5
                });


                if (transfers && transfers.transfers.length > 0) {
                    // Process each transfers

                    for (const transfer of transfers.transfers) {
                        this.alerts.forEach((settings, key) => {
                            if (settings.tokens.includes(token) &&
                                parseFloat(transfer.calculatedAmount) >= settings.minAmount) {
                                this.sendWhaleAlert(settings.chatId, transfer);
                            }
                        });
                    }
                }
            }

            // update last checked time
            this.lastCheckedTime = currentTime;

        } catch (error) {
            logger.error("Error checking for whale transfers:", error);
        }
    }

    /**
     * Send a whale alert to a chat about a recent transfer.
     * @param chatId The Telegram chat ID to send the message to.
     * @param transfer The whale transfer to report.
     */
    private async sendWhaleAlert(chatId: number, transfer: RecentTransfer): Promise<void> {
        // Determine if this is a native SOL transfer
        const isNativeSol = transfer.mintAddress === "11111111111111111111111111111111";
        let amount: string, tokenSymbol: string;

        if (isNativeSol) {
            amount = parseFloat(transfer.calculatedAmount)
                .toLocaleString(undefined, { maximumFractionDigits: 6 });

            tokenSymbol = "SOL";

        } else {
            amount = parseFloat(transfer.calculatedAmount)
                .toLocaleString(undefined, { maximumFractionDigits: 6 });
        }

        const getTokenSymbol = await this.api.getTopTokenHolder(transfer.mintAddress);
        tokenSymbol = getTokenSymbol.data[0].tokenSymbol || "";


        const solscanUrl = `https://solscan.io/tx/${transfer.signature}`;
        const valueUsd = transfer.valueUsd ? `${formatUsdValue(transfer.valueUsd)}` : "N/A";


        const message =
            `🐋 *WHALE ALERT!* 🐋\n\n` +
            `*A large transfer of *${amount} ${tokenSymbol}* (${valueUsd}) was detected!*\n\n` +
            `👤 *From:* \`${transfer.senderAddress || "Unknown"}\`\n` +
            `📥 *To:* \`${transfer.receiverAddress || "Unknown"}\`\n\n` +
            `🕒 _${timeAgo(transfer.blockTime)}_\n` +
            `🔗 [View Transaction on solscan](${solscanUrl})`;

        await this.bot.sendMessage(chatId, message, {
            parse_mode: "Markdown",
            disable_web_page_preview: true
        });
    }

    // Command handler for setting whale alerts
    async handleSetWhaleAlert(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = deleteDoubleSpace(text.split(" "));

        if ( parts[1] && parts[1].toLowerCase() === 'help') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.WHALE_ALERT_HELP,
                { parse_mode: "Markdown" }
            );
        }

        if (parts.length !== 3) {
            return this.bot.sendMessage(chatId,
                "Usage: /set_whale_alert <token_mint_address> <min_amount>\n" +
                "Example: /set_whale_alert EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v 1000\n\n" +
                "(Alerts when transfers of more than 1000 worth of tokens are made)",
            );
        }

        const mintAddress = parts[1];
        const minAmount = parseFloat(parts[2]);

        if (isNaN(minAmount) || minAmount <= 0) {
            return this.bot.sendMessage(chatId, "⛔ Minimum amount must be a positive number.");
        }

        // Store the alert settings
        const alertId = `${chatId}-${mintAddress}`;
        const existingAlert = this.alerts.get(alertId);

        if (existingAlert) {
            existingAlert.minAmount = minAmount;
            this.alerts.set(alertId, existingAlert);

            // Save to Redis
            if (this.redisService) {
                await this.redisService.setWhaleAlert(chatId, existingAlert);
            }

            await this.bot.sendMessage(chatId,
                `*🟡 Updated whale alert!!*\n\nYou will be notified of transfers over *${minAmount}* for token \`\`\`${mintAddress}\`\`\``,
                { parse_mode: "Markdown" }
            );
        } else {
            // Create new alert
            const newAlert: WhaleAlertSettings = {
                chatId,
                minAmount,
                tokens: [mintAddress]
            };
            this.alerts.set(alertId, newAlert);

            // Save to Redis
            if (this.redisService) {
                await this.redisService.setWhaleAlert(chatId, newAlert);
            }

            await this.bot.sendMessage(chatId,
                `*✅  Whale alert set!!*\n\nYou will be notified of transfers over *${minAmount}* for token \`\`\`${mintAddress}\`\`\``,
                { parse_mode: "Markdown" }
            );
        }
    }

    // Command handler for listing active whale alerts
    /**
     * @function handleListWhaleAlerts
     * 
     * Lists all active whale alerts for the user
     */
    async handleListWhaleAlerts(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = deleteDoubleSpace(text.split(" "));

        if (parts.length >= 1 && parts[1] === 'help') { 

            await this.bot.sendMessage(chatId,
                BOT_MESSAGES.LIST_WHALE_ALERTS_HELP,
                { parse_mode: "Markdown" }
            );

            return;
        }


        // Get alerts from Redis if available
        if (this.redisService) {
            const whaleAlerts = await this.redisService.getWhaleAlerts(chatId);
            if (whaleAlerts.length === 0) {
                return this.bot.sendMessage(chatId,
                    "You don't have any active whale alerts.\n\n" +
                    "To set a whale alert, use the command: /set\\_whale\\_alert"
                );
            }

            let message = "🐋 *Your Active Whale Alerts* 🐋\n\n";

            whaleAlerts.forEach((alert, index) => {
                message += `*Alert ${index + 1}*:\n`;
                // Ensure tokens is an array
                const tokens = Array.isArray(alert.tokens) ? alert.tokens : [alert.tokens];
                tokens.forEach(token => {
                    message += `• *Token/Mint Address:* \n\`\`\`${token}\`\`\`\n`;
                });
                message += `• *Minimum Amount to trigger:* ${alert.minAmount}\n\n`;
            });
            message += `To remove an alert, use /remove\\_whalealert <token\\_mint\\_address>`;

            await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
            return;
        }

        // Fallback to in-memory alerts if Redis is not available
        const chatAlerts = Array.from(this.alerts.values())
            .filter(alert => alert.chatId === chatId);

        if (chatAlerts.length === 0) {
            return this.bot.sendMessage(chatId,
                "You don't have any active whale alerts."
            );
        }

        let message = "🐋 *Your Active Whale Alerts* 🐋\n\n";

        chatAlerts.forEach((alert, index) => {
            message += `*Alert ${index + 1}*:\n`;
            // Ensure tokens is an array
            const tokens = Array.isArray(alert.tokens) ? alert.tokens : [alert.tokens];
            tokens.forEach(token => {
                message += `• *Token/Mint Address:* \n\`\`\`${token}\`\`\`\n`;
            });
            message += `• *Minimum Amount to trigger:* ${alert.minAmount}\n\n`;
        });

        message += `To remove an alert, use /remove\\_whalealert <token\\_mint\\_address>`;

        await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }

    // Command handler for removing whale alerts
    async handleRemoveWhaleAlert(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = deleteDoubleSpace(text.split(" "));

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /remove_whalealert <token_mint_address>\n" +
                "To see your active alerts, use /list_whale_alerts"
            );
        }

        const mintAddress = parts[1];
        const alertId = `${chatId}-${mintAddress}`;

        if (this.alerts.has(alertId)) {
            this.alerts.delete(alertId);

            // Remove from Redis
            if (this.redisService) {
                await this.redisService.removeWhaleAlert(chatId, mintAddress);
            }

            await this.bot.sendMessage(chatId,
                `✅ Successfully removed whale alert for token\n\n \`\`\`${mintAddress}\`\`\``,
                { parse_mode: "Markdown" }
            );
        } else {
            await this.bot.sendMessage(chatId,
                `❌ No active whale alert found for token\n \`\`\`${mintAddress}\`\`\``,
                { parse_mode: "Markdown" }
            );
        }
    }
    // Command handler for checking latest whale transfers (one-time check)
    async handleCheckWhales(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = deleteDoubleSpace(text.split(" "));

        let mintAddress: string;
        let minAmount = 5000; // Default minimum amount

        if (parts.length < 2 || parts.length >= 4) {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.CHECK_WHALES_USAGE,
            );
        }

        mintAddress = parts[1];

        if (mintAddress.toLowerCase() === 'help') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.CHECK_WHALES_HELP,
                { parse_mode: "Markdown" }
            );
        }

        let limit = parseInt(parts[2]);
        if (isNaN(limit)) limit = 5;
        if (limit > 10) {
            return this.bot.sendMessage(chatId,
                "⛔ Maximum limit is 10."
            );
        }


        // Send load message
        const loadingMsg = await this.bot.sendMessage(chatId,
            "🔍 Searching for whale holders..."
        );

        try {
            const holders = await this.api.getTopTokenHolder(mintAddress);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            if (!holders || !holders.data || holders.data.length === 0) {
                return this.bot.sendMessage(chatId,
                    "⛔ No whale holders found for this token."
                );
            }

            // Filter holders by minimum amount and limit
            const whaleHolders = holders.data
                .filter(holder => parseFloat(holder.balance)).slice(0, limit);

            if (whaleHolders.length === 0) {
                return this.bot.sendMessage(chatId,
                    `⛔ No holders found with balance above ${minAmount} tokens.`
                );
            }

            // Send summary message
            await this.bot.sendMessage(chatId,
                `🐋 *Top ${whaleHolders.length} Whale Holders of the ${holders.data[0].tokenSymbol} token* 🐋\n\n` +
                `*Token mintAddress:* \n\`\`\`${mintAddress}\`\`\`\n` +
                `*Minimum Amount:* ${minAmount} tokens\n\n` +
                `*Holders:*`,
                { parse_mode: "Markdown" }
            );

            let count = 0;

            // Send each holder's details
            for (const holder of whaleHolders) {
                const balance = parseFloat(holder.balance).toLocaleString(undefined, { maximumFractionDigits: 3 });
                const message =
                    `👤 *Holder ${count + 1}:* \n\nWallet Address:\n\`\`\`${holder.ownerAddress}\`\`\`\n\n` +
                    `🆔 *Owner Name:* ${holder.ownerName || "N/A"}\n\n` +
                    `💰 *Balance:* ${balance} ${holder.tokenSymbol}\n\n` +
                    `💵 *Value in USD:* ${formatUsdValue(holder.valueUsd)}\n\n` +
                    `📊 *Percentage of Supply Held:* ${holder.percentageOfSupplyHeld.toFixed(2)}%`;

                await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
                count++;
            }

        } catch (error: any) {
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId, `❌ Failed to fetch whale holders. Please try again later.`);
        }
    }

    /**
     * 
     * @function saveAlerts
     * Saves the whale alerts to Redis or a fallback JSON file.
     *
     * If Redis is not available, the alerts are saved to a JSON file at
     * `data/whale-alerts.json` in the root directory of the repository.
     *
     * @private 
     */
    private async saveAlerts() {
        try {
            if (!this.redisService) {
                // Fallback to file system if Redis is not available
                const data = JSON.stringify(Array.from(this.alerts.entries()));
                await fs.writeFile(path.join(__dirname, '../data/whale-alerts.json'), data);
                return;
            }

            // Save to Redis
            for (const [alertId, settings] of this.alerts) {
                await this.redisService.setWhaleAlert(settings.chatId, settings);
            }

            logger.info('Successfully saved whale alerts to Redis');
        } catch (error) {
            logger.error('Failed to save whale alerts:', error);
        }
    }

    /**
     * 
     * @function loadAlerts
     * 
     * Loads the whale alerts from Redis or a fallback JSON file.
     *
     * If Redis is not available, the alerts are loaded from a JSON file at
     * `data/whale-alerts.json` in the root directory of the repository.
     *
     * @private
     */
    private async loadAlerts() {
        try {
            if (!this.redisService) {
                logger.warn('Redis service not available, using empty alerts map');
                this.alerts = new Map();
                return;
            }

            // Load from Redis
            this.alerts = new Map();
            const userIds = await this.redisService.getAllUserIds();

            for (const userId of userIds) {
                const chatId = parseInt(userId);
                const whaleAlerts = await this.redisService.getWhaleAlerts(chatId);

                for (const alert of whaleAlerts) {
                    const tokens = Array.isArray(alert.tokens) ? alert.tokens : [alert.tokens];
                    for (const token of tokens) {
                        const alertId = `${chatId}-${token}`;
                        this.alerts.set(alertId, {
                            chatId,
                            minAmount: alert.minAmount,
                            tokens: [token]
                        });
                    }
                }
            }

            logger.info(`Loaded ${this.alerts.size} whale alerts from Redis`);
        } catch (error) {
            logger.warn('Error loading whale alerts:', error);
            this.alerts = new Map();
        }
    }
}