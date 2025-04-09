export interface TopHolder {
    rank: number;                // The rank of the holder
    ownerAddress: string;        // The address of the token holder
    ownerName: string;           // The name of the token holder
    ownerLogoUrl: string;        // URL of the holder's logo
    tokenMint: string;           // The mint address of the token
    tokenSymbol: string;         // The symbol of the token
    tokenLogoUrl: string;        // URL of the token's logo
    balance: string;             // The Percentae of total supply/balance held by the holder
    valueUsd: string;            // The value of the balance in USD
    percentageOfSupplyHeld: number; // Percentage of total supply held by the holder
}

export interface GetTopHoldersResponse {
    data: TopHolder[];    // An array of top holders
}

export interface RecentTransfer {
    signature: string;
    callingMetadata: CallingMetadata[];
    senderTokenAccount: string | null;
    senderAddress: string;
    receiverTokenAccount: string | null;
    receiverAddress: string;
    mintAddress: string;
    feePayer: string;
    decimal: number;
    amount: number;
    slot: number;
    blockTime: number;
    price: string;
    calculatedAmount: string;
    valueUsd: string;
    tokenSymbol?: string;
}

interface CallingMetadata {
    callingInstructions: number[];
    ixName: string;
    callingProgram: string;
    programName: string;
}

export interface GetRecentTransferResponse {
    transfers: RecentTransfer[];    // An array of recent transfers
}

export interface WhaleWatchParams {
    mintAddress?: string;
    minAmount?: number;
    maxAmount?: number;
    timeStart?: number;
    timeEnd?: number;
    sortByDesc?: 'amount' | 'blockTime' | 'slot';
    limit?: number;
}


// Define settings interface for whale alerts

export interface WhaleAlertSettings {
    minAmount: number;
    tokens: string[]; // Array of token mint addresses to monitor
    chatId: number;
}

export interface TokenHolderTimeSeries {
    holdersTimestamp: number;
    nHolders: number;
    totalSupply: string;
    topHolders: {
        address: string;
        balance: string;
        percentage: number;
    }[];
}

export interface GetTokenHolderTimeSeriesResponse {
    data: TokenHolderTimeSeries[];
}