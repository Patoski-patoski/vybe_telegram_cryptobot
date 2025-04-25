// src/bot/priceHandler.ts

import TelegramBot from "node-telegram-bot-api";
import { VybeApiService } from "../services/vybeAPI";
import { BOT_MESSAGES } from "../utils/messageTemplates";
import { BaseHandler } from "./baseHandler";
import { PriceAlert } from "@/interfaces/vybeApiInterface";
import { deleteDoubleSpace, formatUsdValue } from "../utils/utils";


export class PriceHandler extends BaseHandler {
    private readonly PRICE_ALERTS: PriceAlert[] = [];

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
    }

    async handlePriceCommand(msg: TelegramBot.Message, match: RegExpExecArray | null) {
        if (!match) return;
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        if (!parts[1]) {
            await this.bot.sendMessage(chatId, BOT_MESSAGES.PRICE_USAGE);
            return;
        }

        const mintAddress = parts[1];
        console.log("MintAddress", mintAddress)

        try {
            const ohlcvData = await this.api.getTokenOHLCV(mintAddress);
            console.log("ohlcvData", ohlcvData);

            if (!ohlcvData || !ohlcvData.data) {
                await this.bot.sendMessage(chatId, 'No price data available for this token.');
                return;
            }

            const latest = ohlcvData.data[0];
            const previous = ohlcvData.data[1];

            const change = ((parseFloat(latest.close) - parseFloat(previous.close)) / parseFloat(previous.close)) * 100;
            const changeEmoji = change >= 0 ? '📈' : '📉';

            const message = `💰 *Token Price Summary*

*Last Close:* ${formatUsdValue(latest.close)}

*24h High:* ${formatUsdValue(latest.high)}
*24h Low:* ${formatUsdValue(latest.low)}

*Volume:* ${formatUsdValue(latest.volumeUsd).toLocaleString()}
*Change:* ${changeEmoji} ${change.toFixed(2)}%`;

            await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (error) {
            await this.bot.sendMessage(chatId, 'Error fetching price data. Please try again later.');
        }
    }

    async handlePriceAlertCommand(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = deleteDoubleSpace(text.split(" "));
        console.log("Parts", parts);
        console.log("Parts.length", parts.length);

        if (parts.length < 4) {
            await this.bot.sendMessage(chatId, BOT_MESSAGES.PRICE_ALERT_USAGE);
            return;
        }

        
        const mintAddress = parts[1];
        const threshold = parts[2];
        const type = parts[3];
        const userId = msg.from?.id;

        if (!userId) {
            await this.bot.sendMessage(chatId, 'Error: Could not identify user.');
            return;
        }

        const alert: PriceAlert = {
            tokenMint: mintAddress,
            threshold: parseFloat(threshold),
            isHigh: type.toLowerCase() === 'high',
            userId
        };

        this.PRICE_ALERTS.push(alert);
        await this.bot.sendMessage(chatId, `✅ Price alert set for ${mintAddress} at $${threshold} (${type})`);
    }

    async handlePriceChangeCommand(msg: TelegramBot.Message, match: RegExpExecArray | null) {
        if (!match) return;
        const parts = match[1].split(' ');

        if (!parts[0]) {
            await this.bot.sendMessage(msg.chat.id, BOT_MESSAGES.PRICE_CHANGE_USAGE);
            return;
        }

        const mintAddress = parts[0];
        try {
            const ohlcvData = await this.api.getTokenOHLCV(mintAddress);
            if (!ohlcvData || !ohlcvData.data || ohlcvData.data.length === 0) {
                await this.bot.sendMessage(msg.chat.id, 'No price data available for this token.');
                return;
            }

            const latest = ohlcvData.data[0];
            const previous = ohlcvData.data[1];

            const change = ((parseFloat(latest.close) - parseFloat(previous.close)) / parseFloat(previous.close)) * 100;
            const changeEmoji = change >= 0 ? '📈' : '📉';

            const message = `${changeEmoji} Token price is ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(2)}% this hour.`;
            await this.bot.sendMessage(msg.chat.id, message);
        } catch (error) {
            await this.bot.sendMessage(msg.chat.id, 'Error fetching price data. Please try again later.');
        }
    }

    async checkPriceAlerts() {
        for (const alert of this.PRICE_ALERTS) {
            try {
                const ohlcvData = await this.api.getTokenOHLCV(alert.tokenMint);
                if (!ohlcvData || !ohlcvData.data) continue;

                const latest = ohlcvData.data[0];
                const currentPrice = parseFloat(latest.close);

                if (alert.isHigh && currentPrice >= alert.threshold) {
                    await this.bot.sendMessage(
                        alert.userId,
                        `⚠️ Alert: ${alert.tokenMint} has reached $${currentPrice.toFixed(2)} (threshold: $${alert.threshold})`
                    );
                } else if (!alert.isHigh && currentPrice <= alert.threshold) {
                    await this.bot.sendMessage(
                        alert.userId,
                        `⚠️ Alert: ${alert.tokenMint} has dropped to $${currentPrice.toFixed(2)} (threshold: $${alert.threshold})`
                    );
                }
            } catch (error) {
                console.error('Error checking price alerts:', error);
            }
        }
    }
} 