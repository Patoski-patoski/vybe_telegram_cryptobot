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
    walletAddress?: string;

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
    mintAddress: string;
    minAmount?: number;
    maxAmount?: number;
    timeStart?: number;
    timeEnd?: number;
    sortByDesc?: 'amount' | 'blockTime' | 'slot' | 'valueUsd';
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

export interface GetTokenVolumeTimeSeriesResponse {
    data: {
        timeBucketStart: number;
        timeBucketEnd: number;
        volume: string;
        amount: string;
    }[];
    pagination: {
        total: number;
        page: number;
        limit: number;
    };
}

export interface TokenBalance {
    ownerAddress: string;
    symbol: string;
    name: string;
    mintAddress: string;
    amount: string;
    priceUsd: string;
    priceUsd1dChange: string;
    priceUsd7dTrend: string[];
    valueUsd: string;
    valueUsd1dChange: string;
    logoUrl: string;
    category: string;
    decimals: number;
    verified: boolean;
    slot: number;
}

export interface TokenBalanceResponse {
    date: number;
    ownerAddress: string;
    stakedSolBalanceUsd: string;
    stakedSolBalance: string;
    activeStakedSolBalanceUsd: string;
    activeStakedSolBalance: string;
    totalTokenValueUsd: string;
    totalTokenValueUsd1dChange: string;
    totalTokenCount: number;
    data: TokenBalance[];
}

export interface WalletActivity {
    walletAddress: string;
    chatId: number;
    minValueUsd: number; // Minimum value to trigger alerts
    tokensToTrack: string[];  // Specific tokens to track (optional)
    checkInterval: number;  // How often to check (in minutes)
}


export interface WalletAlertSettings {
    walletAddress: string;
    chatId: number;
    minValueUsd: number;
    lastCheckedTime: number;
    lastBalances: Map<string, string>; // token address -> balance
    category?: WalletCategory;
    riskScore?: WalletRiskScore;
    pnl?: WalletPnL;
    interactions?: WalletInteraction[];
    lastKnownSignature?: string;
    lastTokenList?: string[];
    lastTotalValue?: number;
    errorCount?: number;
}

export interface WalletCategory {
    type: 'CEX' | 'DEX' | 'NFT' | 'PROTOCOL' | 'UNKNOWN';
    confidence: number;
    protocols: string[];
    lastUpdated: number;
}

export interface WalletRiskScore {
    score: number; // 0-100
    factors: {
        volatility: number;
        concentration: number;
        activity: number;
        protocolRisk: number;
    };
    lastUpdated: number;
}

export interface TokenPerformance {
    tokenAddress: string;
    tokenSymbol: string;
    pnlUsd: number;
    pnlPercentage: number;
}

export interface TokenMetrics {
    tokenAddress: string;
    tokenSymbol: string;
    buysTransactionCount: number;
    buysTokenAmount: number;
    buysVolumeUsd: number;
    sellsTransactionCount: number;
    sellsTokenAmount: number;
    sellsVolumeUsd: number;
    realizedPnlUsd: number;
    unrealizedPnlUsd: number;
}

export interface PnLTrend {
    date: string;
    pnl: number;
}

export interface WalletPnLSummary {
    winRate: number;
    realizedPnlUsd: number;
    unrealizedPnlUsd: number;
    uniqueTokensTraded: number;
    averageTradeUsd: number;
    tradesCount: number;
    winningTradesCount: number;
    losingTradesCount: number;
    tradesVolumeUsd: number;
    bestPerformingToken: TokenPerformance | null;
    worstPerformingToken: TokenPerformance | null;
    pnlTrendSevenDays: PnLTrend[];
}

export interface WalletPnLResponse {
    summary: WalletPnLSummary;
    tokenMetrics: TokenMetrics[];
}

export interface WalletPnL {
    totalPnL: number;
    realizedPnL: number;
    unrealizedPnL: number;
    winRate: number;
    tradeCount: number;
    averageTradeSize: number;
    bestPerformingToken: TokenPerformance | null;
    worstPerformingToken: TokenPerformance | null;
    pnlTrend: PnLTrend[];
    tokenMetrics: TokenMetrics[];
}

export interface WalletInteraction {
    protocol: string;
    type: 'TRADE' | 'STAKE' | 'BORROW' | 'LEND' | 'OTHER';
    count: number;
    lastInteraction: number;
    totalValue: number;
}


export interface Program {
    programId: string;
    name: string;
    logoUrl: string | null;
    labels: string[];
    idlUrl: string | null;
    siteUrl: string | null;
    defiLlamaId: string | null;
    entityName: string;
    entityId: string | null;
    twitterUrl: string | null;
    dateAdded: string;
    programDescription: string;
    programDetail: string | null;
    message: string;
}

