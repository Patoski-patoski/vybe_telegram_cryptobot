import TelegramBot from "node-telegram-bot-api";
import fs from 'fs/promises';
import path from 'path';
import { BaseHandler } from "./baseHandler";
import { timeAgo } from "../utils/time";
import { formatUsdValue } from "../utils/solana";
import logger from "../config/logger";
import { VybeApiService } from "../services/vybeAPI";
import { TokenBalanceResponse } from "../interfaces/vybeApiInterface";
import { BOT_MESSAGES } from "../utils/messageTemplates";

interface WalletAlertSettings {
    walletAddress: string;
    chatId: number;
    minValueUsd: number;
    lastCheckedTime: number;
    lastBalances: Map<string, string>; // token address -> balance
}

export class WalletTrackerHandler extends BaseHandler {
    private alerts: Map<string, WalletAlertSettings> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
        this.loadAlerts();
        this.startWatchingWallets();
    }

    private startWatchingWallets() {
        // check every 5 minutes
        this.checkInterval = setInterval(async () => {
            await this.checkWalletBalances();
        }, 5 * 60 * 1000);

        logger.info("Wallet Tracker started. Monitoring wallet balances every 5 minutes.");
    }

    private async checkWalletBalances() {
        try {
            const currentTime = Math.floor(Date.now() / 1000);

            // Don't process if we have no alerts
            if (this.alerts.size === 0) return;

            for (const [alertId, settings] of this.alerts) {
                try {
                    const balances = await this.api.getTokenBalance(settings.walletAddress);

                    // Check for new tokens or balance changes
                    for (const token of balances.data) {
                        const currentBalance = token.amount;
                        const lastBalance = settings.lastBalances.get(token.mintAddress);

                        // If this is a new token or balance has changed
                        if (!lastBalance || lastBalance !== currentBalance) {
                            const valueUsd = parseFloat(token.valueUsd);

                            // Only alert if the value is above the minimum threshold
                            if (valueUsd >= settings.minValueUsd) {
                                await this.sendWalletAlert(settings, token, lastBalance);
                            }

                            // Update the last known balance
                            settings.lastBalances.set(token.mintAddress, currentBalance);
                        }
                    }

                    // Update last checked time
                    settings.lastCheckedTime = currentTime;
                    this.alerts.set(alertId, settings);

                } catch (error) {
                    logger.error(`Error checking wallet ${settings.walletAddress}:`, error);
                }
            }

            await this.saveAlerts();

        } catch (error) {
            logger.error("Error checking wallet balances:", error);
        }
    }

    private async sendWalletAlert(settings: WalletAlertSettings, token: any, lastBalance: string | undefined) {
        const valueUsd = formatUsdValue(token.valueUsd);
        const change = lastBalance ?
            ((parseFloat(token.amount) - parseFloat(lastBalance)) / parseFloat(lastBalance) * 100).toFixed(2) :
            "New Token";
        const changePercentage = change.includes("-") ? change : `+${change}`;
        const changeSign = change.includes("-") ? "-" : "+";
        console.log(changePercentage, changeSign);
        console.log("Change: ", change);
        console.log("Last Balance: ", lastBalance);
        console.log("Token: ", token);
        console.log("Token Amount: ", token.amount);
        console.log("Token Value Usd: ", token.valueUsd);

        const message =
            `💰 *Wallet Alert!* 💰\n\n` +
            `*Wallet:* \`${settings.walletAddress}\`\n` +
            `*Token:* ${token.symbol} (${token.name})\n` +
            `*Balance:* ${parseFloat(token.amount).toLocaleString()} ${token.symbol}\n` +
            `*Value:* ${valueUsd}\n` +
            `*Change:* ${change}%\n` +
            `*Category:* ${token.category}\n` +
            `*Verified:* ${token.verified ? "✅" : "❌"}\n\n` +
            `🕒 _${timeAgo(settings.lastCheckedTime)}_`;

        await this.bot.sendMessage(settings.chatId, message, {
            parse_mode: "Markdown",
            disable_web_page_preview: true
        });
    }

    async handleTrackWallet(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = text.split(" ");

        if (parts[1] === 'help') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.TRACK_WALLET_HELP,
                { parse_mode: "Markdown" }
            );
        }

        if (parts.length < 3) {
            return this.bot.sendMessage(chatId,
                "Usage: /trackwallet <wallet_address> <min_value_usd>\n" +
                "Example: /trackwallet 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q 1000\n" +
                "(Alerts when any token balance changes exceed $1000 in value)"
            );
        }

        const walletAddress = parts[1];
        const minValueUsd = parseFloat(parts[2]);

        if (isNaN(minValueUsd) || minValueUsd <= 0) {
            return this.bot.sendMessage(chatId, "⛔ Minimum value must be a positive number.");
        }

        // Validate wallet address
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
            return this.bot.sendMessage(chatId, "⛔ Invalid wallet address format.");
        }

        // Store the alert settings
        const alertId = `${chatId}-${walletAddress}`;
        const existingAlert = this.alerts.get(alertId);

        if (existingAlert) {
            existingAlert.minValueUsd = minValueUsd;
            this.alerts.set(alertId, existingAlert);
            await this.saveAlerts();
            await this.bot.sendMessage(chatId,
                `*🟡 Updated wallet tracking!*\nYou will be notified of balance changes over *$${minValueUsd.toLocaleString()}* for wallet *${walletAddress}*`,
                { parse_mode: "Markdown" }
            );
        } else {
            // Create new alert
            this.alerts.set(alertId, {
                walletAddress,
                chatId,
                minValueUsd,
                lastCheckedTime: Math.floor(Date.now() / 1000),
                lastBalances: new Map()
            });
            await this.saveAlerts();
            await this.bot.sendMessage(chatId,
                `*✅ Wallet tracking set!*\nYou will be notified of balance changes over *$${minValueUsd.toLocaleString()}* for wallet *${walletAddress}*`,
                { parse_mode: "Markdown" }
            );
        }
    }

    private async saveAlerts() {
        try {
            const data = JSON.stringify(Array.from(this.alerts.entries()));
            await fs.writeFile(path.join(__dirname, '../data/wallet-alerts.json'), data);
        } catch (error) {
            logger.error('Failed to save wallet alerts:', error);
        }
    }

    private async loadAlerts() {
        try {
            const filePath = path.join(__dirname, '../data/wallet-alerts.json');
            const data = await fs.readFile(filePath, 'utf-8');
            const entries = JSON.parse(data);
            this.alerts = new Map(entries);
        } catch (error) {
            logger.warn('No saved wallet alerts found or error loading them:', error);
            this.alerts = new Map();
        }
    }

    async handleListTrackedWallets(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;

        // Find all alerts for this chat
        const chatAlerts = Array.from(this.alerts.values())
            .filter(alert => alert.chatId === chatId);

        if (chatAlerts.length === 0) {
            return this.bot.sendMessage(chatId,
                "You don't have any tracked wallets."
            );
        }

        let message = "👛 *Your Tracked Wallets* 👛\n\n";

        for (const alert of chatAlerts) {
            message += `*Wallet:* \`${alert.walletAddress}\`\n`;
            message += `*Min Value:* $${alert.minValueUsd.toLocaleString()}\n`;
            message += `*Last Checked:* ${timeAgo(alert.lastCheckedTime)}\n\n`;
        }

        message += "To remove a wallet, use /removetrackedwallet <wallet_address>\n";
        message += "To check wallet status, use /walletstatus <wallet_address>";

        await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }

    async handleRemoveTrackedWallet(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = text.split(" ");

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /removetrackedwallet <wallet_address>\n" +
                "To see your tracked wallets, use /listtrackedwallets"
            );
        }

        const walletAddress = parts[1];
        const alertId = `${chatId}-${walletAddress}`;

        if (this.alerts.has(alertId)) {
            this.alerts.delete(alertId);
            await this.saveAlerts();
            await this.bot.sendMessage(chatId,
                `✅ Removed tracking for wallet ${walletAddress}`
            );
        } else {
            await this.bot.sendMessage(chatId,
                `❌ No active tracking found for wallet ${walletAddress}`
            );
        }
    }

    async handleWalletStatus(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = text.split(" ");

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /walletstatus <wallet_address>\n" +
                "Example: /walletstatus 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q"
            );
        }

        const walletAddress = parts[1];

        // Validate wallet address
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
            return this.bot.sendMessage(chatId, "⛔ Invalid wallet address format.");
        }

        // Send loading message
        const loadingMsg = await this.bot.sendMessage(chatId,
            "🔍 Fetching wallet status..."
        );

        try {
            const balances = await this.api.getTokenBalance(walletAddress);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            if (!balances.data || balances.data.length === 0) {
                return this.bot.sendMessage(chatId,
                    `No tokens found in wallet ${walletAddress}`
                );
            }

            let message = `💰 *Wallet Status* 💰\n\n`;
            message += `*Address:* \`${walletAddress}\`\n\n`;
            message += `*Total Value:* ${formatUsdValue(balances.totalTokenValueUsd)}\n`;
            message += `*24h Change:* ${balances.totalTokenValueUsd1dChange}%\n`;
            message += `*Token Count:* ${balances.totalTokenCount}\n\n`;
            message += `*Tokens:*\n\n`;

            // Sort tokens by USD value
            const sortedTokens = balances.data.sort((a, b) =>
                parseFloat(b.valueUsd) - parseFloat(a.valueUsd)
            );

            for (const token of sortedTokens) {
                message += `*${token.symbol} (${token.name})*\n`;
                message += `Balance: ${parseFloat(token.amount).toLocaleString()} ${token.symbol}\n`;
                message += `Value: ${formatUsdValue(token.valueUsd)}\n`;
                message += `24h Change: ${token.priceUsd1dChange}%\n`;
                message += `Category: ${token.category}\n`;
                message += `Verified: ${token.verified ? "✅" : "❌"}\n\n`;
            }

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });

        } catch (error: any) {
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId,
                `❌ Error fetching wallet status: ${error.message}`
            );
        }
    }
} 