// src/services/tokenAnalyzer.ts

import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import { formatUsdValue, deleteDoubleSpace } from "../utils/utils";
import logger from "../config/logger";
import { BOT_MESSAGES } from "../utils/messageTemplates";
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration, Scale, Tick } from 'chart.js';

// Store top Solana addresses to search through
const ADDRESSES = {
    SYSTEM_PROGRAM: "11111111111111111111111111111111",
    WRAPPED_SOL: "So11111111111111111111111111111111111111112",
    JUPITER: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    STAR_ATLAS: "ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx",
    TENSOR: "TNSR1kWyGqr7FzGEJgJmvKRoqsdKhkbBJMrFLJyLMKG",
    BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    BONFIDA: "EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp",
    SOLEND: "SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp",
    ORCA: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    SERUM: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
};

// Convert object to array for easier iteration
const MINT_ADDRESSES = Object.values(ADDRESSES);

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

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
               BOT_MESSAGES.TOKEN_ANALYSIS_USAGE,
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

            // Special handling for SOL
            if (symbol === 'SOL') {
                const tokenData = await this.findTokenBySymbol(chatId, 'wSOL');

                if (tokenData) {
                    // Modify the token data to show it's SOL instead of Wrapped SOL
                    const solTokenData = {
                        ...tokenData,
                        symbol: 'SOL',
                        name: 'Solana',
                        mintAddress: ADDRESSES.SYSTEM_PROGRAM,
                        // Keep the price data from wSOL
                        priceUsd: tokenData.priceUsd,
                        priceUsd1dChange: tokenData.priceUsd1dChange,
                        priceUsd7dTrend: tokenData.priceUsd7dTrend
                    };

                    await this.bot.deleteMessage(chatId, loadingMsg.message_id);
                    await this.displayTokenInfo(chatId, solTokenData);
                    return;
                }
            }

            // For all other tokens, search through all mint addresses
            let tokenData = await this.findTokenBySymbol(chatId, symbol);

            let minttokenData = null;
            if (!tokenData) {
               minttokenData =  (await this.api.getTokenBalance(symbol)).data[0];
            }

            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            if (!minttokenData && !tokenData) {
                return this.bot.sendMessage(chatId,
                    "⛔ No data found for the specified token.\n" +
                    "Note: Symbol characters are case-sensitive\n\n" +
                    
                    "Example ✅: /analyze JUP" +
                    "Example ❌: /analyze jup is incorrect\n" +
                    "Example: /analyze 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN\n"
                );
            }


            if (minttokenData) { 
                await this.displayTokenInfo(chatId, minttokenData, minttokenData.mintAddress);
                return;
            }

            await this.displayTokenInfo(chatId, tokenData);

        } catch (error: any) {
            logger.error("Error in token analysis:", error);
            await this.bot.sendMessage(chatId,
                `❌ Error: ${error.message}`
            );
        }
    }

    /**
     * Searches for a token by symbol across multiple mint addresses
     * @param symbol Token symbol to search for
     * @returns Token data if found, null otherwise
     */
    private async findTokenBySymbol(chatId: number, symbol: string): Promise<any | null> {
        let statusMessageSent = false;
        let statusMessageId: number | null = null;

        for (let i = 0; i < MINT_ADDRESSES.length; i++) {
            const mintAddress = MINT_ADDRESSES[i];

            try {
                // If the search is taking too long, send an interactive message
                if (i > 0 && !statusMessageSent) {
                    const statusMsg = await this.bot.sendMessage(
                        chatId,
                        "Oops... This is taking longer than usual. Still searching for your token..."
                    );
                    statusMessageSent = true;
                    statusMessageId = statusMsg.message_id;
                }

                // Fetch token data from the current mint address
                const tokenBalanceResponse = await this.api.getTokenBalance(mintAddress);
                const tokenData = tokenBalanceResponse.data.find(
                    (tokenSymbol: any) => tokenSymbol.symbol === symbol
                );

                // If token is found, clean up status message and return the data
                if (tokenData) {
                    if (statusMessageSent && statusMessageId) {
                        await this.bot.deleteMessage(chatId, statusMessageId);
                    }
                    return tokenData;
                }
            } catch (error) {
                logger.error(`Error fetching token data from ${mintAddress}:`, error);
                // Continue to the next address even if this one fails
            }
        }

        // Clean up status message if token wasn't found
        if (statusMessageSent && statusMessageId) {
            await this.bot.deleteMessage(chatId, statusMessageId);
        }

        return null;
    }

    /**
     * Displays token information in a formatted message with chart button
     * @param chatId Chat ID to send the message to
     * @param tokenData Token data to display
     * @param walletAddress Optional wallet address for additional context
     */
    private async displayTokenInfo(chatId: number, tokenData: any, walletAddress?: string) {
        // Prepare message with token information
        let message = `📊 *Token Analysis*\n\n`;
        message += `*Token name:* ${tokenData.name}\n\n`;
        message += `*Symbol:* ${tokenData.symbol}\n`;
        message += `*mint Address:* \`\`\`${tokenData.mintAddress}\`\`\`\n\n`;
        message += `*Current Price:* ${formatUsdValue(tokenData.priceUsd)}\n`;
        message += `*Price Change (24h):* ${Number(tokenData.priceUsd1dChange) > 0 ? '+' : ''}${Number(tokenData.priceUsd1dChange).toFixed(2)}%\n\n`;
        message += `*Category:* ${tokenData.category}\n`;
        message += `*Token Verification status:* ${tokenData.verified ? "Verified ✅" : "Not Verified ❓"}\n\n`;
        message += `[Logo url](${tokenData.logoUrl})`;

        // Create inline keyboard with View Price Chart button
        let keyboard = undefined;

        if (!walletAddress) {
            keyboard = {
                inline_keyboard: [
                    [{
                        text: `📈 View Price Chart for ${tokenData.symbol}`,
                        callback_data: `price_chart_${tokenData.symbol}`
                    }]
                ]
            };
        } else {
            keyboard = {
                inline_keyboard: [
                    [{
                        text: `📈 View Price Chart for ${tokenData.symbol}`,
                        callback_data: `price_chart_${tokenData.mintAddress}`
                    }]
                ]
            };
        }

            // Send message with button
            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                reply_markup: keyboard,
                disable_web_page_preview: false
            });
      
    }

    // Add new method to handle the chart button click
    async handlePriceChartButton(query: TelegramBot.CallbackQuery, walletAddress?: string) {
        if (!query.data?.startsWith('price_chart_')) return;

        const chatId = query.message?.chat.id;
        if (!chatId) return;

        let symbol = query.data.replace('price_chart_', '');
        // Handle special case for SOL
        // If the symbol is SOL, we need to fetch the wrapped SOL (wSOL) data
        // and display the chart for wSOL instead
        const originalSymbol = symbol;
        if (symbol === "SOL") symbol = "wSOL";

        try {
            await this.bot.answerCallbackQuery(query.id, { text: "Generating price chart..." });

            const loadingMsg = await this.bot.sendMessage(chatId, "📊 Generating price chart...");

            // Find token data by searching through all mint addresses
            let tokenData = await this.findTokenBySymbol(chatId, symbol);

            if (!tokenData) {
                tokenData = (await this.api.getTokenBalance(symbol)).data[0];
            }


            if (!tokenData) {
                await this.bot.deleteMessage(chatId, loadingMsg.message_id);
                return this.bot.sendMessage(chatId, "❌ Could not generate price chart. Token data not found.");
            }

            // Generate and send the chart
            const chartBuffer = await this.generatePriceChart(tokenData);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);

            await this.bot.sendPhoto(chatId, chartBuffer, {
                caption: `7-day price trend for ${originalSymbol === "SOL" ? "SOL" : tokenData.symbol}`,
                parse_mode: "Markdown"
            });

        } catch (error) {
            logger.error("Error generating price chart:", error);
            await this.bot.sendMessage(chatId, "❌ Error generating price chart. Please try again later.");
        }
    }


    /**
     * Generates a price chart for a given token, fetching OHLCV data from CoinGecko.
     *
     * The chart is a combination of a line chart for price and a bar chart for volume.
     * The Y-axis is autoscaled based on the price range, with special handling for stablecoins (e.g., USDC, USDT).
     * For stablecoins, the Y-axis is narrowed to show minor price deviations from $1.00.
     * For low-value tokens, the Y-axis is also adjusted to show more detail.
     * The X-axis shows the date, and the tooltip shows the price and volume values.
     *
     * @param tokenData Token data object from CoinGecko API
     * @returns A buffer containing the generated chart image
     */

    private async generatePriceChart(tokenData: any): Promise<Buffer> {
        try {
            // Determine if this is a stablecoin (approximate check)
            const isStablecoin = tokenData.symbol === 'USDC' || tokenData.symbol === 'USDT'
                || tokenData.symbol === 'BUSD' || tokenData.symbol === 'DAI'
                || (tokenData.name?.toLowerCase().includes('usd') || tokenData.name?.toLowerCase().includes('stable'));

            // Calculate time range for the past 7 days
            const timeEnd = Math.floor(Date.now() / 1000); // current time in seconds
            const timeStart = timeEnd - (7 * 24 * 60 * 60); // 7 days ago in seconds

            // Fetch OHLCV data with volume
            const ohlcvResponse = await this.api.getTokenOHLCV(tokenData.mintAddress,
                '1d',
                timeStart,
                timeEnd,
                7
            );

            // Format dates
            const dates = ohlcvResponse.data.map(item => {
                const date = new Date(item.time * 1000);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });

            // Prepare price and volume data
            const priceData = ohlcvResponse.data.map(item => parseFloat(item.close));
            const volumeData = ohlcvResponse.data.map(item => parseFloat(item.volumeUsd));

            // Calculate min and max price for Y-axis scaling
            const minPrice = Math.min(...priceData);
            const maxPrice = Math.max(...priceData);

            // Set appropriate Y-axis range based on token type
            let yAxisMin, yAxisMax;
            if (isStablecoin) {
                // Narrow range for stablecoins (e.g., $0.995 to $1.005)
                const deviation = Math.max(0.005, Math.max(Math.abs(1 - minPrice), Math.abs(maxPrice - 1)));
                yAxisMin = 1 - deviation;
                yAxisMax = 1 + deviation;
            } else {
                // For tokens with prices < $1, we need special handling
                if (maxPrice < 1) {
                    // For low-value tokens like JUP, use a more appropriate scale
                    // First calculate the range and add padding
                    const range = maxPrice - minPrice;
                    const padding = range * 0.15; // 15% padding

                    if (range < 0.1) {
                        // Extend range to make it at least 10% of the token's value
                        const minPadding = maxPrice * 0.1;
                        yAxisMin = Math.max(0, minPrice - Math.max(padding, minPadding));
                        yAxisMax = maxPrice + Math.max(padding, minPadding);
                    } else {
                        // Normal padding for other low-value tokens
                        yAxisMin = Math.max(0, minPrice - padding);
                        yAxisMax = maxPrice + padding;
                    }
                } else {
                    // For regular tokens with price >= $1, calculate padding (10% padding)
                    const padding = (maxPrice - minPrice) * 0.1;
                    yAxisMin = minPrice - padding;
                    yAxisMax = maxPrice + padding;
                    // Ensure we never go below zero for token prices
                    yAxisMin = Math.max(0, yAxisMin);
                }
            }

            // Calculate volume bar height ranges
            const maxVolume = Math.max(...volumeData);

            // Create chart configuration with price and volume
            const configuration: ChartConfiguration<'bar' | 'line'> = {
                type: 'bar', // Use 'bar' as base type for combination chart
                data: {
                    labels: dates,
                    datasets: [
                        {
                            type: 'line',
                            label: 'Price (USD)',
                            data: priceData,
                            borderColor: '#4CAF50',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y',
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            type: 'bar',
                            label: 'Volume (USD)',
                            data: volumeData,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                            yAxisID: 'y1',
                            order: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: `${tokenData.symbol === 'wSOL' ? 'SOL' : tokenData.symbol} Price Trend (7 Days)`,
                            font: {
                                size: 18
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function (context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;

                                    if (label === 'Price (USD)') {
                                        return `${label}: $${value.toFixed(isStablecoin ? 4 : 2)}`;
                                    } else if (label === 'Volume (USD)') {
                                        // Format volume with appropriate suffixes (K, M, B)
                                        if (value >= 1_000_000_000) {
                                            return `${label}: $${(value / 1_000_000_000).toFixed(2)}B`;
                                        } else if (value >= 1_000_000) {
                                            return `${label}: $${(value / 1_000_000).toFixed(2)}M`;
                                        } else if (value >= 1_000) {
                                            return `${label}: $${(value / 1_000).toFixed(2)}K`;
                                        }
                                        return `${label}: $${value.toFixed(2)}`;
                                    }
                                    return `${label}: ${value}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Price (USD)'
                            },
                            min: yAxisMin,
                            max: yAxisMax,
                            ticks: {
                                // Set specific steps for Y-axis to avoid duplicate labels
                                // Calculate appropriate step size based on price range
                                stepSize: function () {
                                    const range = yAxisMax - yAxisMin;
                                    if (range <= 0.05) return 0.01;  // Very small range (e.g. stablecoins)
                                    if (range <= 0.2) return 0.02;   // Small range (e.g. JUP)
                                    if (range <= 1) return 0.1;      // Medium range
                                    if (range <= 10) return 1;       // Larger range
                                    if (range <= 100) return 10;     // Much larger range
                                    return 100;                      // Very large range
                                }(),
                                // Calculate precision based on price value
                                callback: function (value) {
                                    const numValue = Number(value);

                                    // Dynamic precision based on value range
                                    let precision;
                                    if (isStablecoin) {
                                        precision = 4;  // Always 4 decimals for stablecoins
                                    } else if (numValue < 0.01) {
                                        precision = 6;  // Very small value tokens
                                    } else if (numValue < 0.1) {
                                        precision = 4;  // Small value tokens like JUP
                                    } else if (numValue < 1) {
                                        precision = 3;  // Medium value tokens
                                    } else if (numValue < 100) {
                                        precision = 2;  // Higher value tokens
                                    } else {
                                        precision = 0;  // Very high value tokens
                                    }

                                    return `${numValue.toFixed(precision)}`;
                                }
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Volume (USD)'
                            },
                            min: 0,
                            // Add some padding to the max volume
                            max: maxVolume * 1.1,
                            grid: {
                                drawOnChartArea: false // Don't show grid lines for volume axis
                            },
                            ticks: {
                                callback: function (value) {
                                    // Format volume with appropriate suffixes (K, M, B)
                                    const numValue = Number(value);
                                    if (numValue >= 1_000_000_000) {
                                        return `$${(numValue / 1_000_000_000).toFixed(1)}B`;
                                    } else if (numValue >= 1_000_000) {
                                        return `$${(numValue / 1_000_000).toFixed(1)}M`;
                                    } else if (numValue >= 1_000) {
                                        return `$${(numValue / 1_000).toFixed(1)}K`;
                                    }
                                    return `$${value}`;
                                }
                            }
                        }
                    }
                }
            };

            // Add special note for stablecoins
            if (isStablecoin) {
                // Add subtitle for stablecoins explaining the narrow range
                configuration.options!.plugins!.subtitle = {
                    display: true,
                    text: 'Note: Y-axis shows minor price deviations from $1.00',
                    font: {
                        size: 14,
                        style: 'italic'
                    }
                };
            }

            const chartJSNodeCanvas = new ChartJSNodeCanvas({
                width: 900,
                height: 500,
                backgroundColour: 'white', // Add white background for better readability
            });

            return await chartJSNodeCanvas.renderToBuffer(configuration);
        } catch (error) {
            logger.error("Error generating chart:", error);
            throw new Error(`Failed to generate price chart: ${error}`);
        }
    }


}