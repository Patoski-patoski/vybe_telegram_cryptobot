// src/bot/priceHandler.ts

import TelegramBot from "node-telegram-bot-api";
import { VybeApiService } from "../services/vybeAPI";
import { BOT_MESSAGES } from "../utils/messageTemplates";
import { BaseHandler } from "./baseHandler";
import { PriceAlert } from "@/interfaces/vybeApiInterface";
import { deleteDoubleSpace } from "../utils/utils";


export class PriceHandler extends BaseHandler {
    private readonly PRICE_ALERTS: PriceAlert[] = [];

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
    }

    async handlePriceCommand(msg: TelegramBot.Message, match: RegExpExecArray | null) {
        if (!match) return;
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);
        console.log("Parts", parts)
        console.log("Parts 0", parts[0])
        console.log("Parts 1", parts[1])
        console.log("Parts 2", parts[2])

        if (!parts[1]) {
            await this.bot.sendMessage(msg.chat.id, BOT_MESSAGES.PRICE_USAGE);
            return;
        }

        const mintAddress = parts[1];
        console.log("MintAddress", mintAddress)

        try {
            const ohlcvData = await this.api.getTokenOHLCV(mintAddress);
            console.log("ohlcvData", ohlcvData);
            
            if (!ohlcvData || !ohlcvData.data) {
                await this.bot.sendMessage(msg.chat.id, 'No price data available for this token.');
                return;
            }

            const latest = ohlcvData.data[0];
            const previous = ohlcvData.data[1];

            const change = ((parseFloat(latest.close) - parseFloat(previous.close)) / parseFloat(previous.close)) * 100;
            const changeEmoji = change >= 0 ? '📈' : '📉';

            const message = `💰 *Token Price Summary*

Last Close: $${parseFloat(latest.close).toFixed(2)}
24h High: $${parseFloat(latest.high).toFixed(2)}
24h Low: $${parseFloat(latest.low).toFixed(2)}
Volume: $${parseFloat(latest.volumeUsd).toLocaleString()}
Change: ${changeEmoji} ${change.toFixed(2)}%`;

            await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
        } catch (error) {
            await this.bot.sendMessage(msg.chat.id, 'Error fetching price data. Please try again later.');
        }
    }

    async handlePriceAlertCommand(msg: TelegramBot.Message, match: RegExpExecArray | null) {
        if (!match) return;
        const parts = match[1].split(' ');

        if (parts.length < 3) {
            await this.bot.sendMessage(msg.chat.id, BOT_MESSAGES.PRICE_ALERT_USAGE);
            return;
        }

        const [mintAddress, threshold, type] = parts;
        const userId = msg.from?.id;

        if (!userId) {
            await this.bot.sendMessage(msg.chat.id, 'Error: Could not identify user.');
            return;
        }

        const alert: PriceAlert = {
            tokenMint: mintAddress,
            threshold: parseFloat(threshold),
            isHigh: type.toLowerCase() === 'high',
            userId
        };

        this.PRICE_ALERTS.push(alert);
        await this.bot.sendMessage(msg.chat.id, `✅ Price alert set for ${mintAddress} at $${threshold} (${type})`);
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