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
    data: TopHolder[];           // An array of top holders
}
