import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import { formatUsdValue } from "../utils/solana";
import logger from "../config/logger";
import { BOT_MESSAGES } from "../utils/messageTemplates";
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration, Scale, Tick } from 'chart.js';

export class TokenAnalysisHandler extends BaseHandler {
    private chart: ChartJSNodeCanvas | null;

    constructor(bot: TelegramBot, api: any) {
        super(bot, api);
        this.chart = new ChartJSNodeCanvas({ width: 800, height: 400 });
    }

    async handleTokenAnalysis(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = text.split(" ");

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /analyze <token_mint_address>\n" +
                "Example: /analyze 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"
            );
        }

        const mintAddress = parts[1];

        if (mintAddress === 'help') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.TOKEN_ANALYSIS_HELP,
                {parse_mode: "Markdown"}
            );
        }

        try {
            const loadingMsg = await this.bot.sendMessage(chatId,
                "🔍 Analyzing token data..."
            );

            // Fetch token balance data which includes price trend
            const tokenBalanceResponse = await this.api.getTokenBalance(mintAddress);

            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            if (!tokenBalanceResponse.data || tokenBalanceResponse.data.length === 0) {
                return this.bot.sendMessage(chatId,
                    "⛔ No data found for the specified token."
                );
            }

            const tokenData = tokenBalanceResponse.data[0];

            // Generate price chart
            const chartBuffer = await this.generatePriceChart(tokenData);

            // Prepare message with token information
            let message = `📊 *Token Analysis*\n\n`;
            message += `*Wallet Address:* \`${mintAddress}\`\n`;
            message += `*Token:* ${tokenData.symbol} (${tokenData.name})\n\n`;
            message += `*Current Price:* ${formatUsdValue(tokenData.priceUsd.toString())}\n`;
            message += `*Price Change (24h):* ${Number(tokenData.priceUsd1dChange) > 0 ? '+' : ''}${Number(tokenData.priceUsd1dChange)}%\n`;
            message += `*Total Portfolio Value:* ${formatUsdValue(tokenBalanceResponse.totalTokenValueUsd)}\n`;
            message += `*Portfolio Change (24h):* ${Number(tokenBalanceResponse.totalTokenValueUsd1dChange) > 0 ? '+' : ''}${Number(tokenBalanceResponse.totalTokenValueUsd1dChange)}%\n`;
            message += `*Number of Tokens in Portfolio:* ${tokenBalanceResponse.totalTokenCount}\n`;
            message += `*Token Balance:* ${tokenData.amount} ${tokenData.symbol}\n`;
            message += `*Market Cap:* ${formatUsdValue((parseFloat(tokenData.priceUsd) * parseFloat(tokenData.amount)).toString())}\n\n`;
            message += `*The chart above shows the 7-day price trend of ${tokenData.symbol}*\n`;

            // Send the chart image
            const chartMsg = await this.bot.sendMessage(chatId, "📊 Sending chart...");
            await this.bot.deleteMessage(chatId, chartMsg.message_id);

            await this.bot.sendPhoto(chatId, chartBuffer, {
                caption: message,
                parse_mode: "Markdown"
            });

        } catch (error: any) {
            logger.error("Error in token analysis:", error);
            await this.bot.sendMessage(chatId,
                `❌ Error: ${error.message}`
            );
        }
    }

    private async generatePriceChart(tokenData: any): Promise<Buffer> {
        const dates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const configuration: ChartConfiguration<'line'> = {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Price (USD)',
                    data: tokenData.priceUsd7dTrend.map((price: string) => parseFloat(price)),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${tokenData.symbol} Price Trend (7 Days)`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function (this: Scale, tickValue: string | number, index: number, ticks: Tick[]) {
                                return `$${Number(tickValue).toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        };

        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
        return await chartJSNodeCanvas.renderToBuffer(configuration);
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