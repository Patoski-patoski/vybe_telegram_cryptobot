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
```
/start - Initialize the bot and see available commands
/help - Display help information and command details
```

### Whale Watch Commands
```
/whale_alert <token_mint_address> <min_amount> - Set up alerts for large transfers
/listwhalealerts - View your active whale alerts
/removewhalealert <token_mint_address> - Remove a whale alert
/checkwhales <token_mint_address> <min_amount> [limit] - Check recent whale transfers
```

### Wallet Tracking Commands
```
/track_wallet <wallet_address> <min_value_usd> - Start tracking a wallet
/listtrackedwallets - List all tracked wallets
/removetrackedwallet <wallet_address> - Stop tracking a wallet
/walletstatus <wallet_address> - Get current wallet status
```

### Price Commands
```
/price <token_mint_address> - Get current price information
/pricealert <token_mint_address> <threshold> <high/low> - Set price alerts
/pricechange <token_mint_address> - Get hourly price changes
```

### NFT Commands
```
/nftportfolio [wallet_address] - View NFT portfolio
/registernftwallet <wallet_address> - Register wallet for NFT tracking
/listnftwallets - List registered NFT wallets
/removenftwallet <wallet_address> - Remove wallet from tracking
/nftcollection <wallet_address>, <collection_name> - View collection details
```

### Token Analysis
```
/analyze <symbol> - Get detailed token information
Example: /analyze JUP

Features:
- View token details and current price
- See token logo and category
- Access 7-day price chart with one click
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

### Docker Deployment

```bash
docker-compose up -d
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