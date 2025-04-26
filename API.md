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

#### 5. Token Price OHLCV

```typescript
GET / price / { mintAddress } / token - ohlcv;
```

Get OHLCV (Open, High, Low, Close, Volume) data for a token.

**Parameters:**

- `mintAddress`: Token mint address

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

#### 6. NFT Balance

```typescript
GET / account / nft - balance / { ownerAddress };
```

Get NFT portfolio data for a wallet.

**Parameters:**

- `ownerAddress`: Wallet address

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

#### 7. Token Analysis

```typescript
GET / token / analysis / { symbol };
```

Get detailed token information including price, metadata, and category.

**Parameters:**

- `symbol`: Token symbol (e.g., "SOL", "JUP")

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

### Price Commands

#### 1. Get Price

```bash
/price <token_mint_address>
```

Get current price information for a token.

**Parameters:**

- `token_mint_address`: Token's mint address

**Example:**

```bash
/price EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

#### 2. Set Price Alert

```bash
/pricealert <token_mint_address> <threshold> <high/low>
```

Set up price alerts for a token.

**Parameters:**

- `token_mint_address`: Token's mint address
- `threshold`: Price threshold
- `high/low`: Alert direction

**Example:**

```bash
/pricealert EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v 7.5 high
```

#### 3. Get Price Change

```bash
/pricechange <token_mint_address>
```

Get hourly price change for a token.

**Parameters:**

- `token_mint_address`: Token's mint address

**Example:**

```bash
/pricechange EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### NFT Commands

#### 1. View NFT Portfolio

```bash
/nftportfolio [wallet_address]
```

View NFT portfolio for a wallet.

**Parameters:**

- `wallet_address`: Optional wallet address

**Example:**

```bash
/nftportfolio 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q
```

### Token Analysis Commands

#### 1. Analyze Token

```bash
/analyze <symbol>
```

Get detailed token analysis including price, category, and interactive chart.

**Parameters:**

- `symbol`: Token symbol (e.g., "JUP", "SOL")

**Example:**

```bash
/analyze JUP
```

**Response Format:**

```bash
📊 Token Analysis

Token Symbol: JUP (Jupiter)
Token name: Jupiter
Token Address: [mint_address]

Amount owned: 0.000
Current Price: $1.23
Total Value: $0.00
Price Change (24h): +5.67%

Category: DeFi
[Logo URL]

[📈 View Price Chart for JUP]
```

**Special Cases:**

- SOL token analysis uses Wrapped SOL (wSOL) as price reference
- Maintains native SOL branding in output
- Shows accurate price data while displaying as native SOL

**Interactive Features:**

- Click "📈 View Price Chart for [SYMBOL]" to view 7-day price trend
- Chart includes daily points, trend line, and clear labels

## Error Handling

### Common Error Codes

- `

### Adding New Features

1. Create a New Handler

```typescript
import { BaseHandler } from "./baseHandler";

export class NewFeatureHandler extends BaseHandler {
  constructor(bot: TelegramBot, api: VybeApiService) {
    super(bot, api);
  }

  // Add command handlers
  async handleNewCommand(msg: TelegramBot.Message) {
    // Implementation
  }
}
```

2. Add Command Registration

Update `src/bot.ts` to register new commands:

```typescript
const newFeatureHandler = new NewFeatureHandler(bot, api);
bot.onText(/\/newcommand/, (msg) => newFeatureHandler.handleNewCommand(msg));
```

3. Add Message Templates

Update `src/utils/messageTemplates.ts`:

```typescript
export const BOT_MESSAGES = {
  // ... existing messages
  NEW_COMMAND_USAGE: "Usage: /newcommand <args>",
  NEW_COMMAND_HELP: `*New Command Help*
    
*DESCRIPTION*
Description of the new command

*SYNOPSIS*
/newcommand <args>

*ARGUMENTS*
<args>    Description of arguments

*EXAMPLES*
/newcommand example

*OUTPUT*
- Expected output format
- Additional details

*TROUBLESHOOTING*
- Common issues
- Solutions`,****
};
```

4. Add Response Interfaces

Update `src/interfaces/vybeApiInterface.ts`:

```typescript
export interface TokenAnalysisResponse {
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

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
  }>;
}
```
