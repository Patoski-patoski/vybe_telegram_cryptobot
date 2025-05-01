// src/bots/priceHandler.ts

import TelegramBot from "node-telegram-bot-api";
import { VybeApiService } from "../services/vybeAPI";
import { BOT_MESSAGES } from "../utils/messageTemplates";
import { BaseHandler } from "./baseHandler";
import { PriceAlert } from "@/interfaces/vybeApiInterface";

import {
    deleteDoubleSpace,
    formatUsdValue,
    sendAndDeleteMessage
} from "../utils/utils";

import { createOHLCVChart } from '../utils/chartUtils';
import { RedisService } from "../services/redisService";

export class PriceHandler extends BaseHandler {
    private redisService!: RedisService;

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
        // Initialize Redis service
        this.initRedis();
    }

    private async initRedis() {
        try {
            this.redisService = await RedisService.getInstance();
        } catch (error) {
            console.error('Failed to initialize Redis service:', error);
        }
    }

    async handlePriceCommand(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        if (!parts[1]) {
            await this.bot.sendMessage(chatId, BOT_MESSAGES.CHECK_PRICE_USAGE);
            return;
        }

        if (parts[1] === 'help') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.CHECK_PRICE_HELP,
                { parse_mode: "Markdown" }
            );
        }

        const mintAddress = parts[1];

        try {
            const [ohlcvData, holders] = await Promise.all([
                this.api.getTokenOHLCV(mintAddress),
                this.api.getTopTokenHolder(mintAddress)]
            )

            const tokenName = holders.data[0].tokenSymbol || 'N/A'

            if (!ohlcvData || !ohlcvData.data) {
                await this.bot.sendMessage(chatId, 'No price data available for this token.');
                return;
            }

            // Generate and send the chart
            const chartImage = await createOHLCVChart(ohlcvData.data);
            await this.bot.sendPhoto(chatId, chartImage, { caption: '📊 Token Price Chart' });

            const len = ohlcvData.data.length;
            let latest, previous;

            if (len >= 2) {
                [previous, latest] = ohlcvData.data.slice(-2); // Get the last two entries
            } else if (len === 1) {
                latest = ohlcvData.data[len - 1];
                previous = latest;
            } else {
                return this.bot.sendMessage(chatId,
                    "No OHLCV data available."
                );
            }

            const change = ((parseFloat(latest.close) - parseFloat(previous.close)) / parseFloat(previous.close)) * 100;
            const changeEmoji = change >= 0 ? '📈 +' : '📉';
            const timestamp = latest.time;
            const date = new Date(timestamp * 1000); // Convert to milliseconds

            const humanReadableDate = date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            });
            const tokenVolume = parseFloat(latest.volume).toLocaleString()

            const message = `💰 *Token Price Summary as of ${humanReadableDate}*

*Token name:* ${tokenName}

*Current Price(Close):* ${formatUsdValue(latest.close)}

*24h High:* ${formatUsdValue(latest.high)}
*24h Low:* ${formatUsdValue(latest.low)}

*Number of trades*: ${latest.count.toLocaleString()}

*Total amount of ${tokenName} traded:* ${tokenVolume}
*Total Value of ${tokenName} traded(USD):* ${formatUsdValue(latest.volumeUsd)}

*24h Change:* ${changeEmoji} ${change.toFixed(2)}%`;

            await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error in handlePriceCommand:', error);

            const errorMsg = 'Error fetching price data. Please try again later.'
            sendAndDeleteMessage(this.bot, msg, errorMsg);
        }
    }

/**
 * Handles the /price_alert command to set up a price alert for a specified token.
 * 
 * @param msg - Telegram message object containing the command and arguments.
 * 
 * Process:
 * - Validates the command input for correct number of arguments.
 * - Extracts token mint address, threshold, and alert type (high/low) from the message.
 * - Stores the price alert configuration in Redis for the user.
 * 
 * Outputs:
 * - Sends confirmation message to the user on successful setup.
 * - Deletes the confirmation message after a short delay.
 * - Sends error messages if input validation fails or an error occurs during setup.
 * 
 * Edge Cases:
 * - Handles cases where the user ID is not available in the message.
 * - Catches and logs any errors occurring during the alert setup process.
 */

    async handlePriceAlertCommand(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const text = msg.text || "";
        const parts = deleteDoubleSpace(text.split(" "));


        if (parts.length < 4) {
            await this.bot.sendMessage(chatId, BOT_MESSAGES.PRICE_ALERT_USAGE);
            return;
        }

        const mintAddress = parts[1];
        const threshold = parts[2];
        const type = parts[3];

        if (!userId) {
            const errorMsg = 'Error: Could not identify user.';
            sendAndDeleteMessage(this.bot, msg, errorMsg);
            return;
        }

        try {
            const alert: PriceAlert = {
                tokenMint: mintAddress,
                threshold: parseFloat(threshold),
                isHigh: type.toLowerCase() === 'high',
                userId
            };

            // Store alert in Redis
            await this.redisService.setPriceAlert(userId, alert);
            const setPriceAlert = await this.bot.sendMessage(chatId,
                `✅ Price alert set for ${mintAddress} at $${threshold} (${type})\n` +
                `You will be notified when the price reaches this threshold.`,
            );

            setTimeout(async () => {
                await this.bot.deleteMessage(chatId, msg.message_id, setPriceAlert);
            }, 5000);
        } catch (error) {
            console.error('Error setting price alert:', error);
            const errorMsg = 'Error setting price alert. Please try again later.';
            sendAndDeleteMessage(this.bot, msg, errorMsg);
        }
    }

    async handleListPriceAlertsCommand(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;

        if (!userId) {
            await this.bot.sendMessage(chatId, 'Error: Could not identify user.');
            return;
        }

        try {
            const alerts = await this.redisService.getPriceAlerts(userId);

            if (!alerts || alerts.length === 0) {
                const errorMsg = 'You have no price alerts set.';
                sendAndDeleteMessage(this.bot, msg, errorMsg);
                return;
            }

            const alertsMessage = alerts.map(alert => {
                const direction = alert.isHigh ? 'high' : 'low';
                return `- ${alert.tokenMint}: $${alert.threshold} (${direction})`;
            }).join('\n');

            await this.bot.sendMessage(userId,
                `*Your Price Alerts:*\n${alertsMessage}`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('Error listing price alerts:', error);
            const errorMsg = 'Error retrieving price alerts. Please try again later.';
            sendAndDeleteMessage(this.bot, msg, errorMsg);

        }
    }

    async handleRemovePriceAlertCommand(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = deleteDoubleSpace(text.split(" "));
        const userId = msg.from?.id;

        if (!userId) {
            const errorMsg = 'Error: Could not identify user.';
            sendAndDeleteMessage(this.bot, msg, errorMsg);
            return;
        }

        if (parts.length < 2) {
            const errorMsg = 'Usage: /remove_alert [mint_address]';
            sendAndDeleteMessage(this.bot, msg, errorMsg, 30);
            return;
        }

        const mintAddress = parts[1];

        try {
            await this.redisService.removePriceAlert(userId, mintAddress);
            sendAndDeleteMessage(this.bot, msg, `✅ Price alert for ${mintAddress} removed.`, 10);

        } catch (error) {
            console.error('Error removing price alert:', error);
            const errorMsg = 'Error removing price alert. Please try again later.';
            sendAndDeleteMessage(this.bot, msg, errorMsg);
        }
    }

        /**
         * Checks all price alerts for all users and sends Telegram messages if any
         * alert has been triggered.
         */
    // In checkPriceAlerts method, modify the keyboard to include the token mint:
    async checkPriceAlerts() {
        try {
            // Get all user IDs
            const userIds = await this.redisService.getAllUserIds();

            for (const userIdStr of userIds) {
                const userId = parseInt(userIdStr);
                // Get alerts for this user
                const alerts = await this.redisService.getPriceAlerts(userId);

                for (const alert of alerts) {
                    try {
                        const ohlcvData = await this.api.getTokenOHLCV(alert.tokenMint);
                        if (!ohlcvData || !ohlcvData.data || ohlcvData.data.length === 0) continue;

                        const latest = ohlcvData.data[ohlcvData.data.length - 1];
                        const currentPrice = parseFloat(latest.close);

                        // Create keyboard with the specific token mint for this alert
                        const keyboard = {
                            inline_keyboard: [
                                [
                                    {
                                        text: "⛔ Remove this alert",
                                        callback_data: `remove_alert_${alert.tokenMint}`
                                    },
                                    {
                                        text: "🔙 Back to Commands",
                                        callback_data: `command`
                                    },
                                ]
                            ]
                        };

                        if (alert.isHigh && currentPrice >= alert.threshold) {
                            await this.bot.sendMessage(
                                userId,
                                `⚠️ Alert: You set a price alert for ${alert.tokenMint} if it increases to at least $${alert.threshold}.\n\n` +
                                `Current price has reached $${currentPrice.toFixed(2)}`,
                                { reply_markup: keyboard }
                            );
                            // Optional remove the alert after it's triggered
                            // await this.redisService.removePriceAlert(userId, alert.tokenMint);
                        } else if (!alert.isHigh && currentPrice <= alert.threshold) {
                            await this.bot.sendMessage(
                                userId,
                                `⚠️ Alert: You set a price alert for ${alert.tokenMint} if it decreases to at least $${alert.threshold}.\n\n` +
                                `Current price has reached $${currentPrice.toFixed(2)}`,
                                { reply_markup: keyboard }
                            );
                            // Optional remove the alert after it's triggered
                            // await this.redisService.removePriceAlert(userId, alert.tokenMint);
                        }

                    } catch (error) {
                        console.error(`Error checking price alert for ${alert.tokenMint}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error in checkPriceAlerts:', error);
        }
    }
}