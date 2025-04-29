import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import { formatUsdValue, deleteDoubleSpace } from "../utils/utils";
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
        const parts = deleteDoubleSpace(text.split(" "));
        const systemProgram = "11111111111111111111111111111111";
        const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112"; // Wrapped SOL mint address

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /analyze <symbol>\n" +
                "Example: /analyze JUP\n" +
                "Note that: Symbol characters are case sensitive"
            );
        }

        const symbol: string = parts[1];

        if (symbol.toUpperCase() === 'HELP') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.TOKEN_ANALYSIS_HELP,
                { parse_mode: "Markdown" }
            );
        }

        try {
            const loadingMsg = await this.bot.sendMessage(chatId,
                "🔍 Analyzing token data..."
            );

            let tokenData;

            // Special handling for SOL
            if (symbol === 'SOL') {
                // Fetch data for Wrapped SOL which will have the same price data as SOL
                const tokenBalanceResponse = await this.api.getTokenBalance(systemProgram);
                tokenData = tokenBalanceResponse.data.find(
                    token => token.mintAddress === WRAPPED_SOL_MINT
                );

                if (tokenData) {
                    // Modify the token data to show it's SOL instead of Wrapped SOL
                    tokenData = {
                        ...tokenData,
                        symbol: 'SOL',
                        name: 'Solana',
                        mintAddress: systemProgram,
                        // Keep the price data from wSOL
                        priceUsd: tokenData.priceUsd,
                        priceUsd1dChange: tokenData.priceUsd1dChange,
                        priceUsd7dTrend: tokenData.priceUsd7dTrend
                    };
                }
            } else {
                // For other tokens, proceed as normal
                const tokenBalanceResponse = await this.api.getTokenBalance(systemProgram);
                tokenData = tokenBalanceResponse.data.find(
                    tokenSymbol => tokenSymbol.symbol === symbol
                );
            }

            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            if (!tokenData) {
                return this.bot.sendMessage(chatId,
                    "⛔ No data found for the specified token.\n" +
                    "Note: Symbol characters are case-sensitive" +
                    "Example: wSOL is correct, WSOL is incorrect\n" +
                    "Example: SOL is correct, Sol is incorrect\n"
                );
            }

            // Prepare message with token information
            let message = `📊 *Token Analysis*\n\n`;
            message += `*Token name:* ${tokenData.name}\n`;
            message += `*Symbol:* ${tokenData.symbol}\n`;
            message += `*mint Address:* \`\`\`${tokenData.mintAddress}\`\`\`\n\n`;
            message += `*Current Price:* ${formatUsdValue(tokenData.priceUsd.toLocaleString())}\n`;
            message += `*Price Change (24h):* ${Number(tokenData.priceUsd1dChange) > 0 ? '+' : ''}${Number(tokenData.priceUsd1dChange).toFixed(2)}%\n\n`;
            message += `*Category:* ${tokenData.category}\n`
            message += `*Token Verification status:* ${tokenData.verified ? "Verified ✅" : "Not Verified ❓"}\n`
            message += `[Logo url](${tokenData.logoUrl})`;


            // Create inline keyboard with View Price Chart button
            const keyboard = {
                inline_keyboard: [
                    [{
                        text: `📈 View Price Chart for ${tokenData.symbol}`,
                        callback_data: `price_chart_${tokenData.symbol}`
                    }]
                ]
            };

            // Send initial message with button
            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                reply_markup: keyboard,
                disable_web_page_preview: false
            });

        } catch (error: any) {
            logger.error("Error in token analysis:", error);
            await this.bot.sendMessage(chatId,
                `❌ Error: ${error.message}`
            );
        }
    }

    // Add new method to handle the chart button click
    async handlePriceChartButton(query: TelegramBot.CallbackQuery) {
        if (!query.data?.startsWith('price_chart_')) return;

        const chatId = query.message?.chat.id;
        if (!chatId) return;

        let symbol = query.data.replace('price_chart_', '');
        if (symbol === "SOL") symbol = "wSOL";

        try {
            await this.bot.answerCallbackQuery(query.id, { text: "Generating price chart..." });

            const loadingMsg = await this.bot.sendMessage(chatId, "📊 Generating price chart...");

            // Fetch fresh token data
            const tokenBalanceResponse = await this.api.getTokenBalance("11111111111111111111111111111111");
            const tokenData = tokenBalanceResponse.data.find(
                (tokenSymbol => tokenSymbol.symbol === symbol)
            );

            if (!tokenData) {
                await this.bot.deleteMessage(chatId, loadingMsg.message_id);
                return this.bot.sendMessage(chatId, "❌ Could not generate price chart. Token data not found.");
            }

            // Generate and send the chart
            const chartBuffer = await this.generatePriceChart(tokenData);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            await this.bot.sendPhoto(chatId, chartBuffer, {
                caption: `7-day price trend for ${tokenData.name === "Wrapped SOL" ? "wSOL/SOL" : symbol}`,
                parse_mode: "Markdown"
            });

        } catch (error) {
            logger.error("Error generating price chart:", error);
            await this.bot.sendMessage(chatId, "❌ Error generating price chart. Please try again later.");
        }
    }

    private async generatePriceChart(tokenData: any): Promise<Buffer> {
        // Generate dates including today
        const dates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i)); // Adjusted to count forward from 6 days ago
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // Get the historical trend data and ensure current price is included
        const trendData = [...tokenData.priceUsd7dTrend];
        // Replace the last value with current price to ensure accuracy
        trendData[trendData.length - 1] = tokenData.priceUsd;

        const configuration: ChartConfiguration<'line'> = {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Price (USD)',
                    data: trendData.map((price: string) => parseFloat(price)),
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
} 