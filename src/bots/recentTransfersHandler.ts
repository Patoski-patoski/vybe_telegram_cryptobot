// src/bots/recentTransfersHandler.ts

import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import {
    timeAgo,
    deleteDoubleSpace,
    sendAndDeleteMessage
} from "../utils/utils";

import {
    GetRecentTransferResponse,
    RecentTransfer
} from "../interfaces/vybeApiInterface";

import { BOT_MESSAGES } from "../utils/messageTemplates";
import logger from "../config/logger";

export class RecentTransferHandler extends BaseHandler {

    async handleTransfers(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const parts = deleteDoubleSpace(text.split(" "));

        // If no filter provided or not enough parts, show usage
        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.RECENT_TRANSFERS_USAGE,
            );
        }

        const walletAddress = parts[1];
        if (walletAddress === 'help') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.RECENT_TRANSFERS_HELP,
                { parse_mode: "Markdown" }
            );
        }

        // Parse the limit (default to 5)
        const limit = Number(parts[2] || 3);
        if (isNaN(limit) || limit <= 0) {
            sendAndDeleteMessage(this.bot, msg, "Invalid limit. Please provide a positive number for the limit.");
            return;
            
        }

        // Initialize parameters

        try {
            sendAndDeleteMessage(this.bot, msg, "⏳ Fetching recent transfers...", 25);

            // Get transfers based on the filter type
            let response: GetRecentTransferResponse;
            let [senderResponse, receiverResponse] = await Promise.all([
                this.api.getWalletRecentTransfers({ senderAddress: walletAddress, limit }),
                this.api.getWalletRecentTransfers({ receiverAddress: walletAddress, limit })
            ]);

            // Display results
            if (!senderResponse.transfers
                || senderResponse.transfers.length === 0
                || !receiverResponse.transfers
                || receiverResponse.transfers.length === 0) {
                return this.bot.sendMessage(chatId,
                    "⛔ No transfers found matching your criteria." +
                    "Check if you match the correct format for the filter.\n" +
                    "Example: /transfers <wallet_address>\n"
                );
            }

            response = {
                transfers: [...senderResponse.transfers, ...receiverResponse.transfers]
            };

            // Send summary message
            await this.bot.sendMessage(chatId,
                `Showing ${Math.min(response.transfers.length, limit) * 2} results:\n\n(Received and sent Transfers)`,
                { parse_mode: "Markdown" }
            );

            // Send each transfer
            for (const tx of response.transfers.slice(0, response.transfers.length)) {
                await this.sendTransferMessage(chatId, tx);
            }

        } catch (error: any) {
            console.error("Transfer handler error:", error);
            sendAndDeleteMessage(this.bot, msg, "❌ Error: Failed to fetch transfers");
            return;
        }
    }

    /**
     * Sends a formatted message to a Telegram chat about a recent transfer
     * @param chatId The Telegram chat ID to send the message to
     * @param tx The RecentTransfer object to format into a message
     */
    private async sendTransferMessage(chatId: number, tx: RecentTransfer) {
        try {
            // Fetch token symbol for this specific transfer
            let tokenSymbol = "Unknown";

            if (tx.mintAddress) {
                try {
                    const topHolderResponse = await this.api.getTopTokenHolder(tx.mintAddress, 1);
                    if (topHolderResponse?.data?.[0]?.tokenSymbol) {
                        tokenSymbol = topHolderResponse.data[0].tokenSymbol;
                    }
                } catch (error) {
                    logger.warn(`Could not fetch token symbol for mint ${tx.mintAddress}:`, error);
                    // Continue with "Unknown" token symbol
                }
            }

            const sender = tx.senderAddress || "Unknown";
            const receiver = tx.receiverAddress || "Unknown";
            const amount = `${parseFloat(tx.calculatedAmount).toLocaleString(
                undefined, { maximumFractionDigits: 6 })} ${tokenSymbol}`;
            const url = `https://solscan.io/tx/${tx.signature}`;
            const time = timeAgo(tx.blockTime);

            const message =
                `💰 *Transfer Summary*\n\n` +
                `👤 *From:* \`${sender}\`\n\n` +
                `📥 *To:* \`${receiver}\`\n\n` +
                `💸 *Transfer Amount:* \`${amount}\`\n\n` +
                `🕒 *Block Time:* _${time}_\n\n` +
                `🔗 [🔍 View more on Solscan](${url})`;

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });

        } catch (error) {
            logger.error(`Error sending transfer message:`, error);
            // Send a simplified message if we encounter an error
            await this.bot.sendMessage(
                chatId,
                `💰 New transfer detected. View on Solscan: https://solscan.io/tx/${tx.signature}`,
                { disable_web_page_preview: true }
            );
        }
    }
} 