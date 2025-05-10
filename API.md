# Vybe Network API Documentation

This document provides comprehensive information about the Vybe Network API integration used in the Vybe Telegram Bot.

## 📚 Overview

The Vybe Telegram Bot leverages the Vybe Network API to retrieve real-time data from the Solana blockchain. This API provides access to token balances, transaction history, wallet analytics, price data, and NFT information.

## 🔑 Authentication

All API requests require an API key in the header:

```bash
X-API-KEY: your_api_key
```

To obtain an API key for the hackathon, please contact Eric BD @ Vybe via Telegram ([@ericvybes](http://t.me/ericvybes)).

## 🌐 Base URL

```bash
https://api.vybenetwork.xyz
```

## 📡 Endpoints

### Token Balance

1. Retrieve token balances for a specific wallet address.
2. Get recent token transfers for analysis.

```bash
GET /account/token-balance/{ownerAddress}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ownerAddress` | `string` | Solana wallet address |

**Response:**

```typescript
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
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/account/token-balance/7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q" \
  -H "X-API-KEY: your_api_key"
```

### Top Holder

Fetches top token holders from Vybe API.

```bash
GET /token/${mintAddress}/top-holders
```

**Parameter:**

**Path Params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mintAddress` | `string` | The address of the token holder (optional) |

**Query Params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | `int32 or null >= 0` |Page selection, 0-indexed. |
| `limit` | `int32 or null >= 0` | Limit of the number of transfers to return per page. |
| `sortByDesc` | `string or null` | The name of the token holder (optional) |
| `sortByAsc` | `string or null` | URL of the holder's logo (optional) |

**Response:**

```typescript

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

```

### Recent Transfers

Fetches recent wallets transfers from Vybe API.

```bash
GET /token/transfers{params}
```

**Parameters:**

**Query Params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `senderAddress` | `string or null` | Sender’s public key (optional) |
| `receiverAddress` | `string or null` |Receiver’s public key (optional)|
| `timeStart` | `int32 or null` | Start timestamp (optional) |
| `limit` | `int32 or null` | Limit of the number of transfers to return per page (optional) default 10|

**Response:**

```typescript
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

export interface GetRecentTransferResponse {
    transfers: RecentTransfer[];    // An array of recent transfers
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/token/transfers?mintAddress=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&limit=10" \
  -H "X-API-KEY: your_api_key"
```

### Whale Transfers

Track large token transfers across the Solana blockchain.

```bash
GET /token/transfers/{params}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mintAddress` | `string` | Token mint address |
| `maxAmount` | `number` | Maximum transfer amount |
| `minAmount` | `number` | Minimum transfer amount |
| `timeStart` | `number` | Start timestamp (optional) |
| `timeEnd` | `number` | End timestamp (optional) |
| `sortByDesc` | `string` | Sort field (optional) |
| `limit` | `number` | Result limit (optional) |

**Response:**

```typescript

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

export interface GetRecentTransferResponse {
    transfers: RecentTransfer[];    // An array of recent transfers
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/token/transfers?mintAddress=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&minAmount=1000" \
  -H "X-API-KEY: your_api_key"
```

### Top Token Holder time series

Fetches token holder time series data from Vybe API.

```bash
GET /token/{mintAddress}/holder-ts
```

**Parameters:**

**Path params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mintAddress` | `string` | The public key of the token of interest|

**Query params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `startTime` | `int32 or null >= 0` |Start time of period of interest |
| `endTime` | `int32 or null >= 0` |StaEndrt time of period of interest |
| `limit` | `number` | Result limit. Default to 5 (optional) |

**Response:**

```typescript
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

```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/token/{mintAddress}/holder-ts" \
  -H "X-API-KEY: your_api_key"
```

### Volume tine series data

Fetches token volume time series data from Vybe API.

```bash
GET /token/{mintAddress}/transfer-volume
```

**Parameters:**

**Path params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mintAddress` | `string` | The public key of the token of interest|

**Path params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `startTime` | `int32 or null >= 0` |Start time of period of interest |
| `endTime` | `int32 or null >= 0` |StaEndrt time of period of interest |
| `limit` | `number` | Result limit. Default to 5 (optional) |

**Response:**

```typescript
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

```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/token/{mintAddress}/holder-ts" \
  -H "X-API-KEY: your_api_key"
```

### Wallet PnL

Fetches wallet PnL data from Vybe API.
Get comprehensive profit and loss analysis for a wallet.

```bash
GET /account/pnl/{ownerAddress}?{params}
```

**Parameters:**

**Query Params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ownerAddress` | `string` | The public key (pubKey) associated with the Solana account |

**Path Params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `resolution` | `string` | Time resolution (1d, 7d, 30d) (optional) |
| `tokenAddress` | `string` | Token address filter (optional) |
| `sortByAsc` | `string` | Sort ascending by field (optional) |
| `sortByDesc` | `string` | Sort descending by field (optional) |
| `limit` | `number` | Result limit (optional) |
| `page` | `number` | Page number (optional) |

**Response:**

```typescript
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
    roi: number;
}

export interface WalletPnLResponse {
    summary: WalletPnLSummary;
    tokenMetrics: TokenMetrics[];
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/account/pnl/{walletaddress}?{params}" \
  -H "X-API-KEY: your_api_key"
```

### Get Program info

Fetches program info by ID or name from Vybe API.

```bash
GET /program/known-program-accounts/{params}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `identifier` | `string` | Unique public key or Known program name for a Solana program |

**Response:**

```typescript
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

```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz//program/known-program-accounts?{params}" \
  -H "X-API-KEY: your_api_key"
```

### Explore Program

Explores a program by label from Vybe API.

```bash
GET /program/known-program-accounts?{params}`
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `label` | `string` | Token mint address |

**Response:**

```typescript
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
```

```bash
curl -X GET "https://api.vybenetwork.xyz/price/DEX" \
  -H "X-API-KEY: your_api_key"
```

### Get Program active user

Fetches active users for a specified program.

```bash
GET /program/${programId}/active-users?{params}`
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `programId` | `string` |  The program ID to fetch active users for. |
| `limit` | `int32 or null >= 0` | limit of number of records to return. (Optional) Default is 10. |

**Response:**

```typescript
export interface ProgramActiveUser {
    programId: string;
    wallet: string;
    transactions: number;
    instructions: number;
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/program/${programId}/active-users/" \
  -H "X-API-KEY: your_api_key"
```

### Token Price OHLCV

Get OHLCV (Open, High, Low, Close, Volume) data for a token.

```bash
GET /price/{mintAddress}/token-ohlcv
```

**Parameters:**

**Path Params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mintAddress` | `string` |  The public key of the token of interest |


**Query Params:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `resolution` | `string or null` |  Resolution of the data. |
| `timeStart` | `int32 or string or null >= 0` | Start time of the data to return . |
| `timeEnd` | `int32 or string or null >= 0` | End time of the data to return . |
| `limit` | `int32 or null >= 0` | Start time of the data to return  |

**Response:**

```typescript
interface OHLCVResponse {
  data: Array<{
    time: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    volumeUsd: string;
    count: number;
  }>;
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/price/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/token-ohlcv" \
  -H "X-API-KEY: your_api_key"
```

### NFT Balance

Get NFT portfolio data for a wallet.

```bash
GET /account/nft-balance/{ownerAddress}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ownerAddress` | `string` | Wallet address |

**Response:**

```typescript
export interface NftCollection {
    name: string;
    collectionAddress: string;
    totalItems: number;
    valueSol: string;
    priceSol: string;
    valueUsd: string;
    priceUsd: string;
    logoUrl: string;
    slot: number;
}

export interface NftBalanceResponse {
    date: number;
    ownerAddress: string;
    totalSol: string;
    totalUsd: string;
    totalNftCollectionCount: number;
    data: NftCollection[];
}

```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/account/nft-balance/7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q" \
  -H "X-API-KEY: your_api_key"
```

## 🧩 Implementation

### TypeScript Services

Below is an example of how to implement the Vybe API service in TypeScript:

```typescript
import axios from 'axios';
import { GetRecentTransferResponse, WhaleWatchParams, NFTPortfolioResponse } from '../interfaces/vybeApiInterface';

export class VybeApiService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = 'https://api.vybenetwork.xyz';
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params
      });
      return response.data as T;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async getWhaleTransfers(walletAddress: string): Promise<GetRecentTransferResponse> {
    return this.makeRequest<TokenBalanceResponse>(`/token/transfer/${WhaleWatchParams}`);
  }


  async getNftPortfolio(walletAddress: string): Promise<NFTPortfolioResponse> {
    return this.makeRequest<NFTPortfolioResponse>(`/account/nft-balance/${walletAddress}`);
  }

}
```

## 🚧 Error Handling

The API returns standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | OK - The request was successful |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - API key doesn't have access |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

Example error response:

```json
{
  "error": {
    "code": "invalid_parameters",
    "message": "Invalid wallet address format"
  }
}
```

## 📋 Rate Limits

The Vybe Network API has rate limits to ensure fair usage:

- 60 requests per minute
- 1000 requests per day

For increased limits, contact the Vybe team.

## 🔄 Webhooks

Real-time notifications are available through webhooks. Contact the Vybe team developers to set up webhook integration for your bot.

## 🌱 Best Practices

1. **Cache Responses**: Implement caching for frequently accessed data
2. **Respect Rate Limits**: Implement backoff strategies and pooling
3. **Handle Errors Gracefully**: Provide user-friendly error messages
4. **Validate Input**: Always validate user input before passing to the API
5. **Test Thoroughly**: Test all API integrations in different scenarios

## 📞 Support

For API support, contact:

- Eric BD @ Vybe via Telegram: [@ericvybes](http://t.me/ericvybes)
- Vybe Network Community: [Telegram Group](https://t.me/VybeNetwork_Official)
