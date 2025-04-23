# Vybe Telegram Bot

A powerful Telegram bot for monitoring Solana wallets, whale transactions, token prices, and NFT portfolios, built with TypeScript and Node.js.

## Features

### 🐋 Whale Watch

- Monitor large token transfers across Solana
- Set custom thresholds for different tokens
- Receive real-time alerts for significant transactions
- Track whale movements and market impact

### 👛 Wallet Tracking

- Monitor specific wallet addresses
- Track wallet balances and value changes
- Analyze wallet risk scores and categories
- Monitor PnL (Profit and Loss) over time
- Track protocol interactions

### 📊 Analytics

- Wallet categorization (CEX/DEX/NFT/Protocol)
- Risk scoring based on multiple factors
- PnL analysis with win rates and trade metrics
- Protocol interaction tracking
- Token holding analysis

### 💰 Price Tracking

- Real-time token price monitoring
- Price alerts for specific thresholds
- Hourly price change tracking
- Volume and market data analysis
- Historical price trends

### 🖼️ NFT Portfolio

- Track NFT collections and holdings
- Monitor portfolio value changes
- View collection details and floor prices
- Register multiple wallets for tracking
- Get detailed NFT analytics

## Commands

### Whale Watch Commands

- `/whalealert <token_mint_address> <min_amount>` - Set up alerts for large transfers
- `/listwhalealerts` - View your active whale alerts
- `/removewhalealert <token_mint_address>` - Remove a whale alert
- `/checkwhales <token_mint_address> <min_amount> [limit]` - Check recent whale transfers

### Wallet Tracking Commands

- `/trackwallet <wallet_address> <min_value_usd>` - Start tracking a wallet
- `/listtrackedwallets` - List all tracked wallets
- `/removetrackedwallet <wallet_address>` - Stop tracking a wallet
- `/walletstatus <wallet_address>` - Get current wallet status

### Price Commands

- `/price <token_mint_address>` - Get current price information
- `/pricealert <token_mint_address> <threshold> <high/low>` - Set price alerts
- `/pricechange <token_mint_address>` - Get hourly price changes

### NFT Commands

- `/nftportfolio [wallet_address]` - View NFT portfolio
- `/registernftwallet <wallet_address>` - Register wallet for NFT tracking
- `/listnftwallets` - List registered NFT wallets
- `/removenftwallet <wallet_address>` - Remove wallet from tracking
- `/nftcollection <wallet_address>, <collection_name>` - View collection details

## Technical Architecture

### Core Components

- `BaseHandler` - Base class for all bot handlers
- `WhaleWatcherHandler` - Handles whale transaction monitoring
- `WalletTrackerHandler` - Manages wallet tracking functionality
- `WalletAnalysisService` - Provides wallet analytics
- `VybeApiService` - Interfaces with Vybe Network API

### Data Storage

- JSON-based storage for alerts and settings
- Persistent tracking across bot restarts
- Efficient Map-based data structures

### API Integration

- Real-time data from Vybe Network
- Token balance tracking
- Transaction monitoring
- Wallet analytics

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Telegram Bot Token
- Vybe Network API Key

### Installation

1. Clone the repository

```bash
git clone https://github.com/Patoski-patoski/vybe_telegram_cryptobot
cd vybe-telegram-bot
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables
   Create a `.env` file with:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
VYBE_API_KEY=your_vybe_api_key
```

4. Build the project

```bash
npm run build
```

5. Start the bot

```bash
npm start
```

## Development

### Project Structure

```bash
src/
├── bots/               # Bot handlers
├── config/             # Configuration files
├── interfaces/         # TypeScript interfaces
├── services/           # Core services
├── utils/              # Utility functions
└── data/               # Data storage
```

### Adding New Features

1. Create new handler class extending `BaseHandler`
2. Implement required interfaces
3. Add command handlers
4. Update message templates
5. Test with real data

### Testing

```bash
npm test
```

## API Documentation

### Vybe Network API Endpoints

- `getTokenBalance` - Get wallet token balances
- `getWhaleTransfers` - Get large token transfers
- `getRecentTransfers` - Get recent transactions
- `getWalletPnL` - Get wallet PnL analysis

### Response Formats

See `src/interfaces/vybeApiInterface.ts` for detailed interface definitions.

## Error Handling

- Comprehensive error logging
- User-friendly error messages
- Automatic retry mechanisms
- Graceful degradation

## Security

- API key management
- Input validation
- Rate limiting
- Error masking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Vybe Network for the API
- Telegram Bot API
- Solana blockchain
