import { PublicKey } from "@solana/web3.js";
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

    if (isNaN(num)) return "$0";

    if (num >= 1_000_000_000) {
        return `$${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
        return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
        return `$${(num / 1_000).toFixed(2)}K`;
    }

    return `$${num.toFixed(2)}`;
}


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


export function formatPnLAlert(pnlData: WalletPnL): string {
    return `📊 *Wallet PnL Analysis*\n\n` +
        `💰 *Total PnL:* ${formatUsdValue(pnlData.totalPnL)}\n` +
        `💸 *Realized PnL:* ${formatUsdValue(pnlData.realizedPnL)}\n` +
        `📉 *Unrealized PnL:* ${formatUsdValue(pnlData.unrealizedPnL)}\n` +
        `🎯 *Win Rate:* ${(pnlData.winRate * 100).toFixed(2)}%\n` +
        `🔄 *Trades:* ${pnlData.tradeCount}\n` +
        `📊 *Avg Trade Size:* ${formatUsdValue(pnlData.averageTradeSize)}\n\n` +
        `🌟 *Best Performer:* ${pnlData.bestPerformingToken?.tokenSymbol || 'N/A'} ` +
        `(${formatUsdValue(pnlData.bestPerformingToken?.pnlUsd || 0)})\n` +
        `💥 *Worst Performer:* ${pnlData.worstPerformingToken?.tokenSymbol || 'N/A'} ` +
        `(${formatUsdValue(pnlData.worstPerformingToken?.pnlUsd || 0)})`;
}

export function deleteDoubleSpace(parts: string[]): string[] {
    return parts.filter(part => part !== "");
}
