// src/bots/topHolderHandler.ts

/**
 * @file topHolderHandler.ts
 * 
 * @description This file contains the TopTokenHandler class, which handles the
 * /holder command in a Telegram bot. It fetches and displays the top 10 
 * token holders for a given mint address using the Vybe API.
 * It formats the token balance and value to USD and sends the information
 * to the Telegram chat. The class extends the BaseHandler class, which
 * provides common functionality for handling bot commands.
 * 
 * @module topHolderHandler
 * 
 * @requires node-telegram-bot-api
 * @requires ../bots/baseHandler
 * @requires ../interfaces/vybeApiInterface
 * @requires ../utils/solana
 * @requires ../utils/messageTemplates
 */

import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";

import {
    GetTopHoldersResponse,
    TopHolder
} from "../interfaces/vybeApiInterface";

import { formatUsdValue } from "../utils/solana";
import { BOT_MESSAGES } from "../utils/messageTemplates";


export class TopTokenHandler extends BaseHandler { 
    async handleTopToken(msg: TelegramBot.Message) {
        const { chat: { id: chatId }, text } = msg;

        if (!text || !text.startsWith("/holder")) { 
            await this.bot.sendMessage(chatId,
                "Please use the command in the format: /token mintAddress"
            );
            return;
        }

        const commandParts = text.split(" ");
        if (commandParts.length < 2) { 
            await this.bot.sendMessage(chatId,
                "Please provide a mint address. Usage: /holder mintAddress"
            );
            return;
        }
        const mintAddress = commandParts[1]; // Extract mint address from command
        const limit: number = Number(commandParts[2]);

        if (limit && isNaN(limit)) {
            await this.bot.sendMessage(chatId,
                "Invalid limit. Please provide a valid number for the limit."
            );
            return;
        }
        if (limit && limit > 10) {
            await this.bot.sendMessage(chatId,
                "Limit exceeded. Please provide a limit of 10 or less." +
                "\nExample: /holder {mintAddress} 10",
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: '🔗 View more Holders on our AlphaVybe website',
                                url: `https://docs.vybenetwork.com/reference/get_top_holders`
                            }],
                            [{ text: '🔙 Back', callback_data: 'commands' }]
                        ]
                    }
                }
            );
            return;
        }

        if (!mintAddress) {
            await this.bot.sendMessage(chatId,
                "Invalid mint address. Please provide a valid mint address."
            );
            return;
        }
        // Fetch top token holders from the API using the provided mint address
        const topHoldersResponse: GetTopHoldersResponse = await
            this.api.getTopTokenHolder(mintAddress, limit? limit : 5);

        console.log("topHoldersResponse", topHoldersResponse);

        if (topHoldersResponse && topHoldersResponse.data) {
            const topHolders: TopHolder[] = topHoldersResponse.data;

            // Sort topHolders by rank
            topHolders.sort((a, b) => a.rank - b.rank);
            console.log("topHolders", topHolders);
            
            const fetching = await this.bot.sendMessage(chatId,
                "⏳ Fetching top token holders...",
            );
            // Remove the message after fetching
            setTimeout( async () => {
                await this.bot.deleteMessage(chatId, fetching.message_id);
            }, 3000);

            const mintSymbol = topHolders[0].tokenSymbol;
            await this.bot.sendMessage(chatId,
                `Token Symbol: *${mintSymbol}*\n*MintAddress:* \`\`\`\n${mintAddress}\n\`\`\``,
                { parse_mode: "MarkdownV2" }
            );
            await this.bot.sendMessage(chatId,
                `*Top ${isNaN(limit)? 5: limit} Holders:*`,
                { parse_mode: "MarkdownV2" }
            );


            for (let index = 0; index < (isNaN(limit) ? 5 : limit); index++) {
                if (topHolders[index]) {
                    const holder = topHolders[index];
                    // Format the token balance and value to USD
                    const formattedBalance = formatUsdValue(holder.balance);
                    const formattedValue = formatUsdValue(holder.valueUsd);
                    const formattedSupply = formatUsdValue(holder.percentageOfSupplyHeld);

                    const Holdermessages = BOT_MESSAGES.TOKEN_HOLDER
                        .replace("%index%", `\`${index + 1}\``)
                        .replace("%ownerName%", `\`${holder.ownerName || "N/A"}\``)
                        .replace("%formattedBalance%", `\`${formattedBalance}\``)
                        .replace("%formattedSupply%", `\`${formattedSupply}%\``)
                        .replace("%formattedValue%", `\`${formattedValue}\``)
                        .replace("%ownerAddress%", `\`\`\`\n${holder.ownerAddress}\n\`\`\``);

                    
                    // To avoid rate limiting or "message flooding" warnings from Telegram,
                    await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 sec
                    
                    await this.bot.sendMessage(chatId,
                        Holdermessages,
                        {parse_mode: "MarkdownV2"}
                    );
                }
            }

        } else {
            await this.bot.sendMessage(chatId, "Failed to fetch top token holders.");
        }
    }
}