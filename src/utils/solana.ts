import { PublicKey } from "@solana/web3.js";

/**
 * Validates if a given string is a valid Solana mint address.
 * @param mintAddress - the mint address to validate
 * @returns true if valid, false otherwise
 */
export function isValidMintAddress(mintAddress: string): boolean {
    try {
        const pubkey = new PublicKey(mintAddress);
        return PublicKey.isOnCurve(pubkey); // Optional: can remove for looser validation
    } catch {
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

