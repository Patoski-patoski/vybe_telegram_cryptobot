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

Retrieve token balances for a specific wallet address.

```bash
GET /token/balance/{ownerAddress}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ownerAddress` | `string` | Solana wallet address |

**Response:**

```typescript
interface TokenBalanceResponse {
  totalTokenValueUsd: string;
  data: Array<{
    mintAddress: string;
    symbol: string;
    amount: string;
    valueUsd: string;
  }>;
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/token/balance/7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q" \
  -H "X-API-KEY: your_api_key"
```

### Whale Transfers

Track large token transfers across the Solana blockchain.

```bash
GET /token/whale-transfers
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mintAddress` | `string` | Token mint address |
| `minAmount` | `number` | Minimum transfer amount |
| `timeStart` | `number` | Start timestamp (optional) |
| `timeEnd` | `number` | End timestamp (optional) |
| `sortByDesc` | `string` | Sort field (optional) |
| `limit` | `number` | Result limit (optional) |

**Response:**

```typescript
interface WhaleTransferResponse {
  transfers: Array<{
    signature: string;
    blockTime: number;
    senderAddress: string;
    receiverAddress: string;
    mintAddress: string;
    amount: string;
    valueUsd: string;
  }>;
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/token/whale-transfers?mintAddress=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&minAmount=1000" \
  -H "X-API-KEY: your_api_key"
```

### Recent Transfers

Get recent token transfers for analysis.

```bash
GET /token/recent-transfers
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mintAddress` | `string` | Token mint address (optional) |
| `senderAddress` | `string` | Sender wallet address (optional) |
| `receiverAddress` | `string` | Receiver wallet address (optional) |
| `tx_signature` | `string` | Transaction signature (optional) |
| `limit` | `number` | Result limit (optional) |

**Response:**

```typescript
interface RecentTransferResponse {
  transfers: Array<{
    signature: string;
    blockTime: number;
    senderAddress: string;
    receiverAddress: string;
    mintAddress: string;
    amount: string;
    valueUsd: string;
  }>;
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/token/recent-transfers?mintAddress=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&limit=10" \
  -H "X-API-KEY: your_api_key"
```

### Wallet PnL

Get comprehensive profit and loss analysis for a wallet.

```bash
GET /account/pnl/{ownerAddress}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ownerAddress` | `string` | Wallet address |
| `resolution` | `string` | Time resolution (1d, 7d, 30d) (optional) |
| `tokenAddress` | `string` | Token address filter (optional) |
| `sortByAsc` | `string` | Sort ascending by field (optional) |
| `sortByDesc` | `string` | Sort descending by field (optional) |
| `limit` | `number` | Result limit (optional) |
| `page` | `number` | Page number (optional) |

**Response:**

```typescript
interface WalletPnLResponse {
  summary: {
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
    pnlTrendSevenDays: Array<{
      date: string;
      pnl: number;
    }>;
  };
  tokenMetrics: Array<{
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
  }>;
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/account/pnl/7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q?resolution=7d" \
  -H "X-API-KEY: your_api_key"
```

### Token Price OHLCV

Get OHLCV (Open, High, Low, Close, Volume) data for a token.

```bash
GET /price/{mintAddress}/token-ohlcv
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mintAddress` | `string` | Token mint address |

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
interface NFTPortfolioResponse {
  totalUsd: string;
  totalSol: string;
  totalNftCollectionCount: number;
  data: Array<{
    name: string;
    collectionAddress: string;
    totalItems: number;
    valueUsd: string;
    valueSol: string;
    priceUsd: string;
    priceSol: string;
    logoUrl?: string;
  }>;
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/account/nft-balance/7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q" \
  -H "X-API-KEY: your_api_key"
```

### Token Analysis

Get detailed token information including price, metadata, and category.

```bash
GET /token/analysis/{symbol}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `symbol` | `string` | Token symbol (e.g., "SOL", "JUP") |

**Response:**

```typescript
interface TokenAnalysisResponse {
  symbol: string;
  name: string;
  mintAddress: string;
  amount: string;
  priceUsd: string;
  valueUsd: string;
  priceUsd1dChange: string;
  priceUsd7dTrend: string[];
  category: string;
  logoUrl: string;
}
```

**Example Request:**

```bash
curl -X GET "https://api.vybenetwork.xyz/token/analysis/JUP" \
  -H "X-API-KEY: your_api_key"
```

## 🧩 Implementation

### TypeScript Services

Below is an example of how to implement the Vybe API service in TypeScript:

```typescript
import axios from 'axios';
import { TokenBalanceResponse, WhaleTransferResponse, NFTPortfolioResponse } from '../interfaces/vybeApiInterface';

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

  async getTokenBalance(walletAddress: string): Promise<TokenBalanceResponse> {
    return this.makeRequest<TokenBalanceResponse>(`/token/balance/${walletAddress}`);
  }

  async getWhaleTransfers(params: { 
    mintAddress: string, 
    minAmount: number,
    limit?: number
  }): Promise<WhaleTransferResponse> {
    return this.makeRequest<WhaleTransferResponse>('/token/whale-transfers', params);
  }

  async getNftPortfolio(walletAddress: string): Promise<NFTPortfolioResponse> {
    return this.makeRequest<NFTPortfolioResponse>(`/account/nft-balance/${walletAddress}`);
  }

  // Additional methods for other endpoints...
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
