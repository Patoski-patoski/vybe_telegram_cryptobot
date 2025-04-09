import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import { formatUsdValue } from "../utils/solana";
import logger from "../config/logger";
import { TopHolder } from "@/interfaces/vybeApiInterface";

export class HolderDistributionHandler extends BaseHandler {
    constructor(bot: TelegramBot, api: any) {
        super(bot, api);
    }

    async handleHolderDistribution(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = text.split(" ");

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /holder_distribution <token_mint_address> <limit>\n" +
                "Example: /holder_distribution EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v 5"
            );
        }

        const mintAddress = parts[1];
        const limit = Number(parts[2] || 10);
        const loadingMsg = await this.bot.sendMessage(chatId,
            "🔍 Analyzing token holder distribution..."
        );

        try {
            // Get top holders data
            const topHoldersResponse = await this.api.getTopTokenHolder(mintAddress, limit);
            const topHolders = topHoldersResponse.data;

            if (!topHolders || topHolders.length === 0) {
                await this.bot.deleteMessage(chatId, loadingMsg.message_id);
                return this.bot.sendMessage(chatId,
                    "⛔ No holder data found for the specified token."
                );
            }

            const response = await this.api.getTopTokenHolder(mintAddress);


            // Calculate distribution metrics
            const top10CombinedPercentage = response.data.slice(0, 10).reduce((sum: number, holder: TopHolder) =>
                sum + holder.percentageOfSupplyHeld, 0
            );


            // Calculate Gini coefficient
            const giniCoefficient = this.calculateGiniCoefficient(response.data);

            // Calculate concentration ratios
            const top5Percentage = response.data.slice(0, 5).reduce((sum: number, holder: TopHolder) =>
                sum + holder.percentageOfSupplyHeld, 0
            );
            const top1Percentage = response.data[0].percentageOfSupplyHeld;

            // Format the message
            let message = `📊 *Token Holder Distribution Analysis*\n\n`;
            message += `*Token:* \`${mintAddress}\`\n\n`;
            message += `*Distribution Metrics:*\n`;
            message += `• *Top 10 Holders:* hold ${top10CombinedPercentage.toFixed(2)}% of supply\n`;
            message += `• *Top 5 Holders:* hold ${top5Percentage.toFixed(2)}% of supply\n`;
            message += `• *Top 1️⃣ Holder:* hold ${top1Percentage.toFixed(2)}% of supply\n\n`;
            message += `• *Gini Coefficient:* ${giniCoefficient.toFixed(4)}\n\n`;

            message += `*Top Holders:*\n`;


            // Add top holders information
            topHolders.forEach((holder, index) => {
                message += `${index + 1}. \`${holder.ownerAddress}\`\n`;
                message += `   *Balance:* ${formatUsdValue(holder.balance)}\n`;
                message += `   *Percentage:* ${holder.percentageOfSupplyHeld.toFixed(2)}%\n\n`;
            });

            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });

        } catch (error: any) {
            logger.error("Error in holder distribution analysis:", error);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId,
                `❌ Error: ${error.message}`
            );
        }
    }

    private calculateGiniCoefficient(holders: any[]): number {
        // Sort holders by percentage in ascending order
        const sortedHolders = [...holders].sort((a, b) =>
            a.percentageOfSupplyHeld - b.percentageOfSupplyHeld
        );

        const n = sortedHolders.length;
        let sumOfAbsoluteDifferences = 0;
        let sumOfPercentages = 0;

        for (let i = 0; i < n; i++) {
            sumOfPercentages += sortedHolders[i].percentageOfSupplyHeld;
            for (let j = 0; j < n; j++) {
                sumOfAbsoluteDifferences += Math.abs(
                    sortedHolders[i].percentageOfSupplyHeld - sortedHolders[j].percentageOfSupplyHeld
                );
            }
        }

        return sumOfAbsoluteDifferences / (2 * n * sumOfPercentages);
    }
} 