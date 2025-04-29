// src/bots/recentTransfersHandler.ts

/**
 * @file recentTransfersHandler.ts
 * 
 * @description This file contains the RecentTransferHandler class, 
 * which handles the /transfers command in the Telegram bot.  It fetches recent
 * transfers from the Vybe API and formats them for display in Telegram. It
 * includes methods for parsing the command input, fetching transfer data,
 * and formatting the output message. It extends the BaseHandler class,
 * which provides common functionality for handling bot commands.
 *
 * @module recentTransfersHandler @extends BaseHandler
 * 
 * @requires node-telegram-bot-api
 * @requires ../bots/baseHandler
 * @requires ../utils/utils
 * @requires ../interfaces/vybeApiInterface
 * @requires ../utils/messageTemplates
 * 
 * @method handleTransfers
 * @method sendTransferMessage
 * 
 * @exports RecentTransferHandler
 */


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
                    "Example: /transfers <walletaddress>\n"
                );
            }

            response = {
                transfers: [...senderResponse.transfers, ...receiverResponse.transfers]
            };

            // Send summary message
            await this.bot.sendMessage(chatId,
                `Showing ${Math.min(response.transfers.length, limit) * 2} results:`,
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

    // Helper method to format and send a transfer message
    private async sendTransferMessage(chatId: number, tx: RecentTransfer) {
        const sender = tx.senderAddress || "Unknown";
        const receiver = tx.receiverAddress || "Unknown";
        const amount = parseFloat(tx.calculatedAmount).toLocaleString(
            undefined, { maximumFractionDigits: 6 });
        const url = `https://explorer.solana.com/tx/${tx.signature}`;
        const time = timeAgo(tx.blockTime);

        const message =
            `💰 *Transfer Summary*\n\n` +
            `👤 *From:* \`${sender}\`\n\n` +
            `📥 *To:* \`${receiver}\`\n\n` +
            `💸 *Transfer Amount(SOL):* \`${amount} SOL\`\n\n` +
            `🕒 *Block Time:* _${time}_\n\n` +
            `🔗 [🔍 View on Solscan](${url})`;


        await this.bot.sendMessage(chatId, message, {
            parse_mode: "Markdown",
            disable_web_page_preview: true
        });
    }
} 