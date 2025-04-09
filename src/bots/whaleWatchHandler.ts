// src/bots/whaleWatcherHandler.ts

import TelegramBot from "node-telegram-bot-api";
import fs from 'fs/promises';
import path from 'path';
import { BaseHandler } from "./baseHandler";
import { timeAgo } from "../utils/time";
import { formatUsdValue } from "../utils/solana";
import logger from "../config/logger";
import {
    GetRecentTransferResponse,
    RecentTransfer,
    WhaleWatchParams,
    WhaleAlertSettings
} from "../interfaces/vybeApiInterface";
import { VybeApiService } from "@/services/vybeAPI";

export class WhaleWatcherHandler extends BaseHandler {
    private alerts: Map<string, WhaleAlertSettings> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;
    private lastCheckedTime: number = Math.floor(Date.now() / 1000 - 3600); // 1 hour ago

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
        this.loadAlerts();
        this.startWatchingWhales();
    }

    /**
     * @function startWatchingWhales
     * 
     * Starts monitoring whale transactions
     * 
     * Checks every 10 minutes for transfers over the threshold
     * for each token we are monitoring.
     */

    private startWatchingWhales() {
        // check every 10 minutes
        this.checkInterval = setInterval(async () => {
            await this.checkWhaleTransactions();
        }, 10 * 60 * 1000);
        
        logger.info("Whale Watcher started. Monitoring whale transactions every 10 minutes.");
    }

    /**
     * @function checkWhaleTransactions
     * 
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
                console.log("minimunamounts", minimumAmount);
                this.alerts.forEach((settings) => {
                    if (settings.tokens.includes(token)
                        && settings.minAmount < minimumAmount) {
                        minimumAmount = Math.min(minimumAmount, settings.minAmount);
                    }
                });
                console.log("this.alerts", this.alerts);
                const transfers = await this.api.getWhaleTransfers({
                    mintAddress: token,
                    minAmount: minimumAmount,
                    timeStart: this.lastCheckedTime,
                    timeEnd: currentTime,
                    sortByDesc: 'amount',
                    limit: 5
                });

                console.log("Transfer", transfers)

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
        tokenSymbol = getTokenSymbol.data[0].tokenSymbol;
        
        const solscanUrl = `https://solscan.io/tx/${transfer.signature}`;
        const valueUsd = transfer.valueUsd ? `${formatUsdValue(transfer.valueUsd)}` : "N/A";


        let programContext = "";
        if (transfer.callingMetadata && transfer.calculatedAmount.length > 0) {
            const program = transfer.callingMetadata[0].programName;
            if (program) {
                programContext = `\n💻 *Program:* ${program}`;
            }
        }

        const message =
            `🐋 *WHALE ALERT!* 🐋\n\n` +
            `*A large transfer of *${amount} ${tokenSymbol}* (${valueUsd}) was detected!*\n\n` +
            `👤 *From:* \`${transfer.senderAddress || "Unknown"}\`\n` +
            `📥 *To:* \`${transfer.receiverAddress || "Unknown"}\`\n\n` +
            `🕒 _${timeAgo(transfer.blockTime * 1000)}_\n` +
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
        const parts = text.split(" ");

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /whalealert <token_mint_address> <min_amount>\n" +
                "Example: /whalealert EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v 1000\n" +
                "(Alerts when transfers of USDC over 1000 tokens occur)"
            );
        }

        const mintAddress = parts[1];
        const minAmount = parseFloat(parts[2]);
        if (isNaN(minAmount) || minAmount <= 0) {
            return this.bot.sendMessage(chatId, "⛔ Minimum amount must be a positive number.");
        }
        // Store the alert seetings
        const alertId = `${chatId}-${mintAddress}`;
        const existingAlert = this.alerts.get(alertId);

        if (existingAlert) {
            existingAlert.minAmount = minAmount;
            this.alerts.set(alertId, existingAlert);
            await this.saveAlerts();
            await this.bot.sendMessage(chatId,
                `*🟡 Updated whale alert!!*\nYou will be notified of transfers over *${minAmount}* for token *${mintAddress}*`,
                { parse_mode: "Markdown" }
            );
        } else {
            // Crete new alert
            this.alerts.set(alertId, {
                chatId,
                minAmount,
                tokens: [mintAddress]
            });
            await this.saveAlerts();
            await this.bot.sendMessage(chatId,
                `*✅  Whale alert set!!*\nYou will be notified of transfers over *${minAmount}* for token *${mintAddress}*`,
                {parse_mode: "Markdown"}
            );
        }
    }

    // Command handler for listing active whale alerts
    /**
     * @function handleListWhaleAlerts
     * 
     * 
     */
    async handleListWhaleAlerts(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;

        // Find all alerts for this chat
        // Gather all alerts associated with this chat ID
        const chatAlerts = Array.from(this.alerts.values())
            .filter(alert => alert.chatId);
        if (chatAlerts.length == 0) {
            return this.bot.sendMessage(chatId,
                "You don't have any active whale alerts."
            );
        }

        let message = "🐋 *Your Active Whale Alerts* 🐋\n\n";

        chatAlerts.forEach(async (alert, index) => {
            message += `*Alert ${index + 1}*:\n`;
            alert.tokens.forEach(token => {
                message += `• *Token: * \`${token}\`\n\n`;
            });
            message += `• *Min Amount:* ${alert.minAmount}\n\n`;
        });

        message += "To remove an alert, use /removewhalealert <token_mint_address>";

        await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }

    // Command handler for removing whale alerts
    async handleRemoveWhaleAlert(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = text.split(" ");

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /removewhalealert <token_mint_address>\n" +
                "To see your active alerts, use /listwhalealerts"
            );
        }

        const mintAddress = parts[1];
        const alertId = `${chatId}-${mintAddress}`;

        if (this.alerts.has(alertId)) {
            this.alerts.delete(alertId);
            await this.saveAlerts();
            await this.bot.sendMessage(chatId,
                `✅ Removed whale alert for token ${mintAddress}`
            );
        } else {
            await this.bot.sendMessage(chatId,
                `❌ No active whale alert found for token ${mintAddress}`
            );
        }
    }

    // Command handler for checking latest whale transfers (one-time check)
    async handleCheckWhales(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = text.split(" ");

        let mintAddress: string | undefined;
        let minAmount = 1000; // Default minimum account

        if (parts.length >= 3) mintAddress = parts[1];

        if (parts.length > 3) {
            const parsedAMount = parseFloat(parts[2]);
            if (!isNaN(parsedAMount) && parsedAMount > 0) {
                minAmount = parsedAMount;
            }
        }

        // Send load message
        const loadingMsg = await this.bot.sendMessage(chatId,
            "🔍 Searching for whale transfers..."
        );

        try {
            // Get past 24 hours
            const oneDayAgo = Math.floor(Date.now() / 100) - 86400;
            const params: any = {
                minAmount,
                timeStart: oneDayAgo,
                sortByDesc: 'amount',
                limit: 5
            };

            if (mintAddress) params.mintAddress = mintAddress;

            const transfers = await this.api.getWhaleTransfers(params);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            if (!transfers || !transfers.transfers || transfers.transfers.length === 0) {
                return this.bot.sendMessage(chatId,
                    "⛔ No whale transfers found with the specified criteria in the last 24 hours."
                );
            }

            await this.bot.sendMessage(chatId,
                `🐋 *Top ${transfers.transfers.length} Whale Transfers (Last 24h)* 🐋\n\n` +
                `${mintAddress ? `For token: ${mintAddress}\n` : ""}` +
                `Minimum amount: ${minAmount}`,
                { parse_mode: "Markdown" }
            );

            // Send each transfer alert
            for (const transfer of transfers.transfers) {
                await this.sendWhaleAlert(chatId, transfer);
            }

        } catch (error: any) {
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    }

    private async saveAlerts() {
        try {
            const data = JSON.stringify(Array.from(this.alerts.entries()));
            await fs.writeFile(path.join(__dirname, '../data/whale-alerts.json'), data);
        } catch (error) {
            logger.error('Failed to save whale alerts:', error);
        }
    }

    private async loadAlerts() {
        try {
            const filePath = path.join(__dirname, '../data/whale-alerts.json');
            console.log("filePath", filePath);
            const data = await fs.readFile(filePath, 'utf-8');
            const entries = JSON.parse(data);
            this.alerts = new Map(entries);
        } catch (error) {
            logger.warn('No saved whale alerts found or error loading them:', error);
            this.alerts = new Map();
        }
    }
}