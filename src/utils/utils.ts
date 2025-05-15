// src/utils/utils.ts

import { PublicKey } from "@solana/web3.js";
import TelegramBot from "node-telegram-bot-api";
import { WalletPnL } from "../interfaces/vybeApiInterface";

/**
 * Validates if a given string is a valid Solana mint address.
 * @param mintAddress - the mint address to validate
 * @returns true if valid, false otherwise
 */
export function isValidMintAddress(mintAddress: string): boolean {
    try {
        const pubkey = new PublicKey(mintAddress);
        return pubkey.toBase58() === mintAddress; // Check if the base58 representation matches the input
    } catch {
        return false;
    }
}

/**
 * Validates a Solana wallet address
 * @param address The wallet address to validate
 * @returns True if the address is valid, false otherwise
 */
export function isValidWalletAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Formats a USD value into a human-readable financial string.
 * Rounds to 2 decimal places and appends M or B when appropriate.
 * 
 * Examples:
 *   7335305155.404051 → "$7.34B"
 *   230616724.4985304 → "$230.62M"
 *   12500 → "$12.5K"
 *   950 → "$950"
 */
export function formatUsdValue(raw: string | number): string {
    const num = typeof raw === "string" ? parseFloat(raw) : raw;

    if (isNaN(num)) return "$0.00";

    if (num >= 1_000_000_000) {
        return `$${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
        return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
        return `$${(num / 1_000).toFixed(2)}K`;
    }

    return `$${num.toFixed(2)}`;
}


/**
 * Converts a Unix timestamp into a human-readable string of time elapsed since the timestamp.
 * e.g. "1 year ago", "5 months ago", "3 days ago", "1 hour ago", "30 minutes ago", "1 minute ago", "just now"
 * @param timestamp The Unix timestamp to convert
 * @returns A string of time elapsed since the timestamp
 */
export function timeAgo(timestamp: number): string {
    const now = Date.now() / 1000; // Current time in seconds
    const seconds = Math.floor(now - timestamp);

    const units = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 }
    ];

    for (const unit of units) {
        const value = Math.floor(seconds / unit.seconds);
        if (value >= 1) {
            return `${value} ${unit.label}${value > 1 ? "s" : ""} ago`
        };
    }

    return "just now";
}


/**
 * Formats a {@link WalletPnL} object into a human-readable string for display as a Discord alert.
 * @param pnlData The {@link WalletPnL} object to format
 * @returns A string representing the formatted PnL data
 */
export function formatPnLAlert(pnlData: WalletPnL): string {
    return `📊 *Wallet PnL Analysis*\n\n` +
        `💰 *Total PnL: * ${formatUsdValue(pnlData.totalPnL)}\n` +
        `💸 *Realized PnL: * ${formatUsdValue(pnlData.realizedPnL)}\n` +
        `📉 *Unrealized PnL: * ${formatUsdValue(pnlData.unrealizedPnL)}\n` +
        `🎯 *Win Rate: * ${(pnlData.winRate * 100).toFixed(2)}%\n` +
        `🔄 *Trades: * ${pnlData.tradeCount}\n` +
        `📊 *Avg Trade Size: * ${formatUsdValue(pnlData.averageTradeSize)}\n\n` +
        `🌟 *Best Performer: * ${pnlData.bestPerformingToken?.tokenSymbol.toLocaleString() || 'N/A'} ` +
        `(${formatUsdValue(pnlData.bestPerformingToken?.pnlUsd || 0)})\n` +
        `💥 *Worst Performer:* ${pnlData.worstPerformingToken?.tokenSymbol.toLocaleString() || 'N/A'} ` +
        `(${formatUsdValue(pnlData.worstPerformingToken?.pnlUsd || 0)})`;
}

/**
 * Removes any empty strings from an array of strings, e.g. ["foo", "", "bar"] becomes ["foo", "bar"].
 * @param parts The array of strings to filter
 * @returns The filtered array of strings
 */
export function deleteDoubleSpace(parts: string[]): string[] {
    return parts.filter(part => part !== "");
}


/**
 * Returns the Unix timestamp (in seconds) for 6 days ago at 6:00 AM UTC.
 * This is used for getting the 7-day OHLCV for a token.
 * @returns Unix timestamp in seconds
 */
export function tokenOHLCV7Days(): string | number {
    const currentDate = new Date();
    // Subtract 6 days
    currentDate.setDate(currentDate.getDate() - 6);
    // Set the time to 6:00 AM
    currentDate.setUTCHours(6, 0, 0, 0); // hours, minutes, seconds, milliseconds
    // Get the Unix timestamp (in seconds)
    const timestamp = Math.floor(currentDate.getTime() / 1000); // Convert milliseconds to seconds
    return timestamp;
}




/**
 * Sends a message and then deletes it after a specified delay.
 *
 * @param bot TelegramBot instance
 * @param msg Message object containing chatId
 * @param text Text of message to send
 * @param delay Number of seconds to wait before deleting the message
 * @returns Promise that resolves when the message has been deleted
 */
export async function sendAndDeleteMessage(
    bot: TelegramBot,
    msg: TelegramBot.Message,
    text: string,
    delay: number = 7) {
    
    const chatId = msg.chat.id;

    try {
        const sentMessage = await bot.sendMessage(chatId, text);
        // Wait for the specified delay before deleting the message
        await new Promise(resolve => setTimeout(resolve, delay * 1000)); // Convert seconds to milliseconds
        await bot.deleteMessage(chatId, sentMessage.message_id);

    } catch (error) {
        console.error(`Error in deleteMessage: ${error}`);
    }
}
