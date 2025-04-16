# Vybe Telegram Bot API Documentation

## Overview

This document provides detailed information about the Vybe Telegram Bot's API integration, command structure, and response formats.

## Vybe Network API Integration

### Base URL

```bash
https://api.vybenetwork.xyz
```

### Authentication

All API requests require an API key in the header:

```bash
X-API-KEY: your_api_key
```

### Endpoints

#### 1. Token Balance

```typescript
GET / token / balance / { ownerAddress };
```

Get token balances for a wallet.

**Parameters:**

- `ownerAddress`: Solana wallet address

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

#### 2. Whale Transfers

```typescript
GET / token / whale - transfers;
```

Get large token transfers.

**Parameters:**

- `mintAddress`: Token mint address
- `minAmount`: Minimum transfer amount
- `timeStart`: Start timestamp
- `timeEnd`: End timestamp
- `sortByDesc`: Sort field
- `limit`: Result limit

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

#### 3. Recent Transfers

```typescript
GET / token / recent - transfers;
```

Get recent token transfers.

**Parameters:**

- `mintAddress`: Token mint address
- `senderAddress`: Sender wallet address
- `receiverAddress`: Receiver wallet address
- `tx_signature`: Transaction signature
- `limit`: Result limit

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

#### 4. Wallet PnL

```typescript
GET / account / pnl / { ownerAddress };
```

Get wallet PnL analysis.

**Parameters:**

- `ownerAddress`: Wallet address
- `resolution`: Time resolution (1d, 7d, 30d)
- `tokenAddress`: Token address filter
- `sortByAsc`: Sort ascending by field
- `sortByDesc`: Sort descending by field
- `limit`: Result limit
- `page`: Page number

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

## Bot Commands

### Whale Watch Commands

#### 1. Set Whale Alert

```bash
/whalealert <token_mint_address> <min_amount>
```

Set up alerts for large transfers of a specific token.

**Parameters:**

- `token_mint_address`: Token's mint address
- `min_amount`: Minimum amount to trigger alert

**Example:**

```bash
/whalealert EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v 1000
```

#### 2. List Whale Alerts

```bash
/listwhalealerts
```

View all active whale alerts.

#### 3. Remove Whale Alert

```bash
/removewhalealert <token_mint_address>
```

Remove a whale alert.

#### 4. Check Whales

```bash
/checkwhales <token_mint_address> <min_amount> [limit]
```

Check recent whale transfers.

### Wallet Tracking Commands

#### 1. Track Wallet

```bash
/trackwallet <wallet_address> <min_value_usd>
```

Start tracking a wallet.

**Parameters:**

- `wallet_address`: Solana wallet address
- `min_value_usd`: Minimum value to trigger alerts

**Example:**

```bash
/trackwallet 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh8U3dW1VQ 1000
```

#### 2. List Tracked Wallets

```bash
/listtrackedwallets
```

View all tracked wallets.

#### 3. Remove Tracked Wallet

```bash
/removetrackedwallet <wallet_address>
```

Stop tracking a wallet.

#### 4. Wallet Status

```bash
/walletstatus <wallet_address>
```

Get current wallet status and analysis.

## Error Handling

### Common Error Codes

- `400`: Bad Request - Invalid parameters
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: number;
    message: string;
    details?: any;
  };
}
```

## Rate Limiting

- API calls are limited to 100 requests per minute
- Bot commands are limited to 20 per minute per user

## Best Practices

1. Always validate wallet addresses before making API calls
2. Implement proper error handling for API responses
3. Cache frequently accessed data
4. Use appropriate timeouts for API calls
5. Monitor API usage and implement backoff strategies
