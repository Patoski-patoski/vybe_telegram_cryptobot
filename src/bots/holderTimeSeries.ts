import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import { formatUsdValue } from "../utils/solana";
import { timeAgo } from "../utils/time";
import logger from "../config/logger";
import { BOT_MESSAGES } from "../utils/messageTemplates";

export class TokenHolderAnalysisHandler extends BaseHandler {
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

    async handleTokenAnalysis(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = text.split(" ");

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /analyze <token_mint_address> [start_date] [end_date]\n" +
                "Example: /analyze 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN\n" +
                "Example: /analyze 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09\n" +
                "Example: /analyze 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09 2025-03-30\n" +
                "Dates should be in YYYY-MM-DD format"
            );
        }

        const mintAddress = parts[1];

        if (mintAddress === 'help') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.TOKENANALYSIS_HELP
            );
        }
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
                "🔍 Analyzing token data..."
            );

            // Fetch both holder and volume data
            const [volumeResponse, holdersResponse] = await Promise.all([
                this.api.getTokenVolumeTimeSeries(mintAddress, finalStartTime, finalEndTime, 5),
                this.api.getTokenHolderTimeSeries(mintAddress, finalStartTime, finalEndTime, 5)
            ]);

            console.log("holdersResponse", holdersResponse);
            console.log("volumeResponse", volumeResponse);

            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            if ((!holdersResponse.data || holdersResponse.data.length === 0) &&
                (!volumeResponse.data || volumeResponse.data.length === 0)) {
                return this.bot.sendMessage(chatId,
                    "⛔ No data found for the specified token and timeframe."
                );
            }

            let message = `📊 *Comprehensive Token Analysis*\n\n`;
            message += `*Token:* \`${mintAddress}\`\n`;

            // Format timeframe message
            if (startDate || endDate) {
                const startDateStr = startDate || new Date(finalStartTime * 1000).toISOString().split('T')[0];
                const endDateStr = endDate || new Date(finalEndTime * 1000).toISOString().split('T')[0];
                message += `*Timeframe:* ${startDateStr} to ${endDateStr}\n\n`;
            } else {
                message += `*Timeframe:* Last 30 days\n\n`;
            }

            // Holder Analysis
            if (holdersResponse.data && holdersResponse.data.length > 0) {
                const latestHolders = holdersResponse.data[0];
                const oldestHolders = holdersResponse.data[holdersResponse.data.length - 1];
                const holderChange = latestHolders.nHolders - oldestHolders.nHolders;
                const holderChangePercent = (holderChange / oldestHolders.nHolders) * 100;

                message += `*Holder Analysis:*\n`;
                message += `• Current Holders: ${latestHolders.nHolders}\n`;
                message += `• Change in Holders: ${holderChange > 0 ? '+' : ''}${holderChange} (${holderChangePercent.toFixed(2)}%)\n\n`;
            }

            // Volume Analysis
            if (volumeResponse.data && volumeResponse.data.length > 0) {
                const latestVolume = volumeResponse.data[0];
                const oldestVolume = volumeResponse.data[volumeResponse.data.length - 1];
                const totalVolume = volumeResponse.data.reduce((sum, data) =>
                    sum + parseFloat(data.volume), 0
                );
                const avgVolume = totalVolume / volumeResponse.data.length;

                message += `*Volume Analysis:*\n`;
                message += `• Latest 24h Volume: ${formatUsdValue(latestVolume.volume)}\n`;
                message += `• Average Daily Volume: ${formatUsdValue(avgVolume.toString())}\n`;
                message += `• Total Volume: ${formatUsdValue(totalVolume.toString())}\n\n`;
            }

            // Correlation Analysis
            if (holdersResponse.data && volumeResponse.data &&
                holdersResponse.data.length > 0 && volumeResponse.data.length > 0) {
                const correlation = this.calculateCorrelation(
                    holdersResponse.data.map(d => d.nHolders),
                    volumeResponse.data.map(d => parseFloat(d.volume))
                );

                message += `*Correlation Analysis:*\n`;
                message += `• Holder-Volume Correlation: ${correlation.toFixed(2)}\n`;
                message += `  (1.0 = perfect positive, -1.0 = perfect negative, 0 = no correlation)\n\n`;
            }

            // Historical Data
            message += `*Historical Data:*\n`;
            const maxLength = Math.max(
                holdersResponse.data?.length || 0,
                volumeResponse.data?.length || 0
            );

            for (let i = 0; i < maxLength; i++) {
                const holderData = holdersResponse.data?.[i];
                const volumeData = volumeResponse.data?.[i];
                const date = holderData ?
                    new Date(holderData.holdersTimestamp * 1000).toISOString().split('T')[0] :
                    new Date(volumeData.timeBucketStart * 1000).toISOString().split('T')[0];

                message += `${i + 1}. ${date}\n`;
                if (holderData) {
                    message += `   Holders: ${holderData.nHolders}\n`;
                }
                if (volumeData) {
                    message += `   Volume: ${formatUsdValue(volumeData.volume)}\n`;
                }
                message += '\n';
            }

            message += `_Data as of ${timeAgo(Math.max(
                holdersResponse.data?.[0]?.holdersTimestamp || 0,
                volumeResponse.data?.[0]?.timeBucketStart || 0
            ) * 1000)}_`;

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });

        } catch (error: any) {
            logger.error("Error in token analysis:", error);
            await this.bot.sendMessage(chatId,
                `❌ Error: ${error.message}`
            );
        }
    }

    private calculateCorrelation(holders: number[], volumes: number[]): number {
        if (holders.length !== volumes.length || holders.length < 2) {
            return 0;
        }

        const n = holders.length;
        let sumHolders = 0;
        let sumVolumes = 0;
        let sumHoldersSquared = 0;
        let sumVolumesSquared = 0;
        let sumProducts = 0;

        for (let i = 0; i < n; i++) {
            sumHolders += holders[i];
            sumVolumes += volumes[i];
            sumHoldersSquared += holders[i] * holders[i];
            sumVolumesSquared += volumes[i] * volumes[i];
            sumProducts += holders[i] * volumes[i];
        }

        const numerator = sumProducts - (sumHolders * sumVolumes / n);
        const denominator = Math.sqrt(
            (sumHoldersSquared - (sumHolders * sumHolders / n)) *
            (sumVolumesSquared - (sumVolumes * sumVolumes / n))
        );

        return denominator === 0 ? 0 : numerator / denominator;
    }
} 