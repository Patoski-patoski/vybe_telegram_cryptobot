# Vybe Telegram Bot 🤖

<div align="center">
  <img src="/img/logo.jpg" alt="Vybe Bot Logo" width="150"/>
  <h3>Real-time Solana Analytics in your Telegram</h3>
  <p><b>Bot URL:</b> <a href="https://t.me/vybe_tel_bot">https://t.me/vybe_tel_bot</a></p>
</div>

## 🔍 Overview

Vybe Telegram Bot delivers powerful, real-time analytics for Solana blockchain directly in Telegram. Track whale movements, monitor wallets, analyze token metrics, and manage your NFT portfolio—all from a simple chat interface.

Powered by Vybe Network APIs, this bot provides institutional-grade analytics in a user-friendly format that anyone can use.

## 🚀 Features

### 🐋 Whale Watch System
- Monitor large token transfers across Solana in real-time
- Set custom thresholds for different tokens 
- Receive instant notifications for significant market-moving transactions
- Query recent whale movements on demand

### 👛 Smart Wallet Tracking
- Track specific wallet addresses with custom alerts
- Monitor balance changes and portfolio value fluctuations
- Analyze wallet risk scores and categorization
- Track profit and loss metrics over time
- Monitor protocol interactions

### 📊 Token Analytics
- Comprehensive token data analysis
- Risk scoring based on multiple factors
- Win rate calculations and trade metrics
- Protocol interaction tracking
- Detailed holding analysis

### 💰 Price Intelligence
- Real-time token price monitoring
- Custom price alerts with threshold settings
- Time-based price change tracking
- Volume and market data analysis
- Historical price trend visualization

### 🖼️ NFT Portfolio Management
- Track NFT collections and holdings across wallets
- Monitor portfolio value changes in real-time
- View collection details and floor prices
- Register multiple wallets for comprehensive tracking
- Access detailed NFT analytics

## 📘 Command Reference

### Getting Started

```bash
/start - Initialize the bot and see available commands
/help - Display help information and command details
```

### Token Commands

```bash
/token_holder <token_mint_address> - View a token top holders
/holder_distribution <token_mint_address> - View a token holder distribution 
/series <token_mint_address> - View a token time series
/analyze_token <token_mint_address> - Comprehensive Token analysis
```

### Whale Watch Commands

```bash
/set_whale_alert <token_mint_address> <min_amount> - Set up alerts for large transfers
/list_whale_alerts - View your active whale alerts
/remove_whale_alert <token_mint_address> - Remove a whale alert
/check_whales <token_mint_address> <min_amount> [limit] - Check recent whale transfers
```

### Wallet Tracking Commands

```bash
/track_wallet <wallet_address> <min_value_usd> - Start tracking a wallet
/list_tracked_wallets - List all tracked wallets
/remove_tracked_wallet <wallet_address> - Stop tracking a wallet
/analyze_wallet <wallet_address> - Analyze a wallet address and its holdings
```

### Price Commands

```bash
/check_price <token_mint_address> - Get current price information
/set_price_alert <token_mint_address> <threshold> <high/low> - Set price alerts
/remove_price_alert <token_mint_address> - Remove price alerts for a token
/list_price_alert <token_mint_address> - A List of all set price
```

### NFT Commands

```bash
/nft_portfolio [wallet_address] - View NFT portfolio
/register_nft_wallet <wallet_address> - Register wallet for NFT tracking
/list_nft_wallets - List registered NFT wallets
/remove_nft_wallet <wallet_address> - Remove wallet from nft tracking
/nft_collection <wallet_address>, <collection_name> - View collection details
```

### Program commands

```bash
/top_users <program_id_or_name> - View top active users for a program
/program_info <program_id_or_name> - View a program info,
/explore  <label> - Explore a program
/users_insights <program_id_or_name> - Get insights about program users,
/activity_change <program_id_or_name> - Track changes in program activity ,
/check_program_whale_users <program_id_or_name> - Check whale users for a program,

```


## 🛠️ Technical Architecture

### Core Components

- `BaseHandler` - Base class for all bot handlers
- `WhaleWatcherHandler` - Handles whale transaction monitoring
- `WalletTrackerHandler` - Manages wallet tracking functionality
- `WalletAnalysisService` - Provides wallet analytics
- `VybeApiService` - Interfaces with Vybe Network API

### Data Storage

- Redis server for primary storage and caching
- JSON-based backup storage for alerts and settings
- Persistent tracking across bot restarts
- Efficient Map-based data structures for in-memory processing

### API Integration

- Real-time data from Vybe Network
- Token balance tracking
- Transaction monitoring
- Wallet analytics

## 🏗️ Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Redis server (optional but recommended)
- Telegram Bot Token (from BotFather)
- Vybe Network API Key

### Quick Start

1. Clone the repository

```bash
git clone https://github.com/patoski-patoski/vybe-telegram-bot
cd vybe-telegram-bot
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your credentials:
# TELEGRAM_BOT_TOKEN=your_telegram_bot_token
# VYBE_API_KEY=your_vybe_api_key
```

4. Start the bot

```bash
npm run start
```

For development:

```bash
npm run dev
```

<!-- ### Docker Deployment

```bash
docker-compose up -d -->
```

## 📊 Project Structure

```bash
src/
├── bots/              # Bot handlers
├── config/            # Configuration files
├── interfaces/        # TypeScript interfaces
├── services/          # Core services
├── utils/             # Utility functions
└── data/              # Data storage
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📘 Documentation

- [API Documentation](API.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🔒 Security

- API key management
- Input validation
- Rate limiting protection
- Error handling
- User authentication

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Vybe Network](https://vybenetwork.xyz) for their powerful APIs
- Telegram Bot API
- The Solana blockchain community

---

<div align="center">
  <p>Built with ☕ and ❤️ for the Vybe Network Hackathon</p>
</div>