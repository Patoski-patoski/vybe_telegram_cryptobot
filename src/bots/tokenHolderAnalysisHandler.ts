// src/bots/tokenHolderAnalysis

import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import { formatUsdValue, timeAgo, deleteDoubleSpace } from "../utils/utils";
import logger from "../config/logger";
import { BOT_MESSAGES } from "../utils/messageTemplates";

export class TokenHolderAnalysisHandler extends BaseHandler {
    private userPreferences: Map<number, UserPreferences> = new Map();

    constructor(bot: TelegramBot, api: any) {
        super(bot, api);
    }

    private parseDate(dateStr: string): number | null {
        if (!dateStr) return null;

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return null;
        }
        return Math.floor(date.getTime() / 1000);
    }

    async handleTokenHolderAnalysis(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = deleteDoubleSpace(text.split(" "));

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /holders <token_mint_address> [start_date] [end_date]\n" +
                "Example: /holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN\n" +
                "Example: /holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09\n" +
                "Example: /holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09 2025-03-30\n" +
                "Dates should be in YYYY-MM-DD format"
            );
        }

        const mintAddress = parts[1];
        if (mintAddress === "help") {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.TOKENHOLDERANALYSIS_HELP,
                { parse_mode: "Markdown" }
            );
        }

        // Parse dates
        const startDate = parts[2] || ""; 
        const endDate = parts[3] || "";

        const startTimeUnix = this.parseDate(startDate);
        const endTimeUnix = this.parseDate(endDate);

        // Validate dates
        if (startDate && !startTimeUnix) {
            return this.bot.sendMessage(chatId,
                "Invalid start date format. Please use YYYY-MM-DD format."
            );
        }

        if (endDate && !endTimeUnix) {
            return this.bot.sendMessage(chatId,
                "Invalid end date format. Please use YYYY-MM-DD format."
            );
        }

        // If only one date is provided, use it as end date and set start date to 30 days before
        const finalStartTime = startTimeUnix
            || (endTimeUnix ? endTimeUnix - (30 * 24 * 60 * 60)
                : Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60));

        const finalEndTime = endTimeUnix || Math.floor(Date.now() / 1000);

        try {
            const loadingMsg = await this.bot.sendMessage(chatId,
                "🔍 Analyzing token holder data..."
            );

            const response = await this.api.getTokenHolderTimeSeries(mintAddress, finalStartTime, finalEndTime, 5);

            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            if (!response.data || response.data.length === 0) {
                return this.bot.sendMessage(chatId,
                    "⛔ No holder data found for the specified token and timeframe."
                );
            }

            // Get the most recent data point
            const latestData = response.data[0];
            const oldestData = response.data[response.data.length - 1];

            // Calculate changes
            const holderChange = latestData.nHolders - oldestData.nHolders;
            const holderChangePercent = (holderChange / oldestData.nHolders) * 100;

            let message = `📊 *Token Holder Analysis*\n\n`;
            message += `*Token:* \`${mintAddress}\`\n`;

            // Format timeframe message
            if (startDate || endDate) {
                const startDateStr = startDate || new Date(finalStartTime * 1000).toISOString().split('T')[0];
                const endDateStr = endDate || new Date(finalEndTime * 1000).toISOString().split('T')[0];
                message += `*Timeframe:* *${startDateStr}* to *${endDateStr}*\n\n`;
            } else {
                message += `*Timeframe:* Last 30 days\n\n`;
            }

            message += `*Current Holders:* *${latestData.nHolders}*\n`;
            message += `*Change in Holders:* *${holderChange > 0 ? '+' : ''}${holderChange}* (${holderChangePercent.toFixed(2)}%)\n\n`;
            message += `*Historical Data:*\n`;

            // Add historical data points
            response.data.forEach((dataPoint, index) => {
                const date = new Date(dataPoint.holdersTimestamp * 1000).toISOString().split('T')[0];
                message += `${index + 1}. * On ${date}*: There were *${dataPoint.nHolders}* holders\n`;
            });

            message += `\n_Data as of ${timeAgo(latestData.holdersTimestamp * 1000)}_`;

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });

        } catch (error: any) {
            logger.error("Error in token holder analysis:", error);
            await this.bot.sendMessage(chatId,
                `❌ Error: ${error.message}`
            );
        }
    }
}

interface UserPreferences {
    defaultTimeframe: string;
    alertThreshold: number;
    preferredMetrics: string[];
} 