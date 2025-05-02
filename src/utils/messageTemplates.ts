export const BOT_MESSAGES = {
        WELCOME: `
                
🚀 *Hello {name},\n\nWelcome to Vybe Analytics Bot!*

Your comprehensive analytics companion for the Solana ecosystem. Here's what I can do:

🐋 *Whale Tracking*
• Monitor large token transfers
• Set custom whale alerts
• Track whale movements
• View whale holder analytics

💰 *Token Analysis*
• Real-time price tracking
• Price alerts and monitoring
• Holder distribution analysis
• Token time series analysis

📊 *Program Analytics*
• View program information
• Track active users
• Monitor program activity
• Analyze whale users

🖼️ *NFT Portfolio*
• Track NFT collections
• Monitor portfolio value
• Register multiple wallets
• View collection details

👛 *Wallet Tracking*
• Monitor wallet activity
• Track transactions
• Analyze holdings
• View wallet insights

💹 *Price Tracking*
• Set price alerts
• Monitor price changes
• View price charts
• Track market data

Type /help to see detailed command usage or click the commands to get started.

_Powered by Vybe Network_
`,
        
        UNKNOWN_COMMAND: `
❌ *Unknown Command*

Sorry {name}, I don't recognize that command. Here are some things you can try:

1️⃣ Use /help to see all available commands
2️⃣ Check your command spelling
3️⃣ Make sure to use the correct format:
   Example: /analyze <token\\_address>

🔍 *Popular Commands:*
• /check\\_price - Get token price
• /whale\\_alert - Set whale alerts
• /nft\\_portfolio - View NFT holdings
• /analyze\\_token - Analyze tokens

Need help? Use /help for a complete command list.
`,
        HELP: `
🚀 Welcome to Vybe's Analytical Bot!

Here are all available commands, organized by category:

💳 *Wallet Management:*
- /track\\_wallet <address> <min\\_value> - Track wallet activity
- /list\\_tracked\\_wallets - List tracked wallets
- /remove\\_tracked\\_wallet <address> - Remove tracked wallet
- /analyze\\_wallet <address> - Detailed wallet analysis

💰 *Token Analysis:*
- /analyze_token <symbol_or_mintAddress> - Analyze token
- /series <symbol> - Token time series analysis
- /holder\\_distribution <symbol> - Token holder distribution
- /set\\_price\\_alert <symbol> <threshold> <high/low> - Set price alerts
- /price\\_change <symbol> - Get price changes

🐋 *Whale Watching:*
- /set\\_whale\\_alert <token> <amount> - Set whale alert
- /list\\_whale\\_alerts - List whale alerts
- /remove\\_whale\\_alert <token> - Remove whale alert
- /check\\_whales <token> <amount> - Check recent whale movements

🖼️ *NFT Portfolio:*
- /nft\\_portfolio [address] - View NFT portfolio
- /register\\_nft\\_wallet <address> - Register wallet for NFT tracking
- /list\\_nft\\_wallets - List registered NFT wallets
- /remove\\_nft\\_wallet <address> - Remove NFT wallet

🔍 *Program Analysis:*
- /program\\_info <program\\_id\\_or\\_name> - Get program information
- /explore <label> - Explore and list Solana programs by category
- /top\\_users <id> - View top program users
- /users\\_insights <id> - Get user insights
- /activity\\_change <id> - Check activity changes
- /check\\_whale\\_users <id> - Check whale users

📊 *General Analysis:*
- /transfers <address> - View recent transfers
- /top\\_holders <token> - View top token holders

To see detailed help for any command, use:
<command> help
Example: /analyze help

For support or questions, please contact us at [Telegram Support](https://t.me/VybeNetwork_Official).
`,


        TOPTOKENHOLDERS_HELP: `📊 *Top Holders Command (/top_holders)*

*DESCRIPTION*
Shows the top token holders for a specific token, including their balances and percentage of total supply.

*SYNOPSIS*
/top_holders <token_mint_address> [limit]

*ARGUMENTS*
<token_mint_address>    The Solana token mint address to check holders for
[limit]                 Optional limit for number of holders to display (default: 10)

*EXAMPLES*
/top_holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN
/top_holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 20

*USER STORY*
As a user, I want to analyze the distribution of token holdings and identify major holders.

*OUTPUT*
- List of top holders with:
  * Holder address
  * Balance amount
  * Percentage of total supply
  * Value in USD
  * Last update time

*TROUBLESHOOTING*
- Invalid token address
- No holders found
- Network connectivity issues
- Check the space between command and arguments

*SEE ALSO*
/analyze, /holder\\_distribution, /series`,

        TOKENHOLDERANALYSIS_HELP: `📊 *Token Holder Analysis Command (/holders)*

*DESCRIPTION*
Analyzes token holder and volume trends over time, including correlation analysis and holder behavior patterns.

*SYNOPSIS*
/holders <token_mint_address> [timeframe]

*ARGUMENTS*
<token_mint_address>    The Solana token mint address to analyze
[timeframe]            Optional timeframe in YYYY/MM/DD format

*EXAMPLES*
/holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN
/holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025/03/26 2025/03/30

*USER STORY*
As a user, I want to understand how token holder behavior changes over time and correlate it with trading volume.

*OUTPUT*
- Current holder count and changes
- Top holders list with balances
- Volume analysis
- Holder-Volume correlation
- Historical trends

*TROUBLESHOOTING*
- Invalid token address
- Invalid date format
- Insufficient historical data
- Network connectivity issues

*SEE ALSO*
/analyze, /holder\\_distribution, /series`,

        TOKEN_HOLDER: `📊 *Rank*: %index%

* Owner Name:* %ownerName%

* Address:* %ownerAddress%
* Token Balance:* %formattedBalance%

* Total % supply held:* %formattedSupply%

* Token balance* %formattedValue%`,

        // Token Analysis Commands
        TOKEN_ANALYSIS_USAGE: "Usage: /analyze token\\_symbol\\_or\\_token\\_mint\\_address>\n\n" +
                "Example: /analyze JUP\n" +
                "Example: /analyze 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        TOKEN_ANALYSIS_HELP: `📊 *Token Analysis Command (/analyze)*

*DESCRIPTION*
Analyzes a token's current state, including price, market cap, and portfolio metrics.

*SYNOPSIS*
/analyze <token\\_symbol\\_or\\_token\\_mint\\_address>

*ARGUMENTS*
<token\\_symbol\\_or\\_token\\_mint\\_address>   The Solana token ssymbol or mint address to analyze

*EXAMPLES*
/analyze JUP
/analyze 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN

*USER STORY*:
As a user, I want to analyze a token's current state, including price, market cap, and portfolio metrics.

*OUTPUT*
- Current Price
- 24h Price Change
- Market Cap
- Portfolio Value
- 24h Portfolio Change
- Token Count
- 7-day Price Trend Chart

*TROUBLESHOOTING*
- Ensure the token mint address is valid
- Check if the token exists on Solana
- Verify network connectivity

*SEE ALSO*
/holders, /holder\\_distribution`,

        TOKEN_TIME_SERIES_USAGE: "Usage: /series <token_mint_address> [start_date] [end_date]\n\nExample: /series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN\n\nExample: /series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09\n\nExample: /series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09 2025-03-30",
        TOKEN_TIME_SERIES_HELP: `📊 *Token Time Series Analysis Command (/series)*

*DESCRIPTION*
Analyzes token holder and volume trends over time, including correlation analysis.

*SYNOPSIS*
/series <token\\_mint\\_address> [start_date] [end_date]

*ARGUMENTS*
<token_mint_address>    The Solana token mint address to analyze
[start_date]            Optional start date in YYYY-MM-DD format
[end_date]              Optional end date in YYYY-MM-DD format

*USER STORY*:
As a user, I want to analyze token holder and volume trends over time, including correlation analysis.

*EXAMPLES*
/series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN
/series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09
/series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09 2025-03-30

*OUTPUT*
- Holder Analysis
  - Current Holder Count
  - Holder Change
  - Holder Change Percentage

- Volume Analysis
  - Latest 24h Volume
  - Average Daily Volume
  - Total Volume

- Correlation Analysis
  - Holder-Volume Correlation

- Historical Data
  - Daily holder counts
  - Daily volumes

*TROUBLESHOOTING*
- Ensure valid date format (YYYY-MM-DD)
- Check if token has sufficient historical data
- Verify network connectivity

*SEE ALSO*
/analyze, /holder\\_distribution`,

        HOLDER_DISTRIBUTION_USAGE: "Usage: /holder_distribution <token_mint_address>\n\nExample: /holder_distribution 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        HOLDER_DISTRIBUTION_HELP: `📊 *Holder Distribution Command (/holder_distribution)*

*DESCRIPTION*
Analyzes the distribution of token holders across different balance ranges.

*SYNOPSIS*:
/holder\\_distribution <token\\_mint\\_address>

*EXAMPLES*:
/holder\\_distribution 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN

*USER STORY*:
As a user, I want to analyze the distribution of token holders across different balance ranges.

*OUTPUT*
- Distribution of holders by balance ranges
- Concentration analysis
- Whale detection
- Holder segmentation

*TROUBLESHOOTING*
- Ensure the token mint address is valid
- Check if the token has holders
- Verify network connectivity

*SEE ALSO*
/analyze, /holders`,

        // Whale Watching Commands
        WHALE_ALERT_USAGE: "Usage: /whalealert <token_mint_address> <threshold>\n\nExample: /whale_alert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 1000",
        WHALE_ALERT_HELP: `🐋 *Whale Alert Command (/set_whale_alert)*

*DESCRIPTION*
Sets up alerts for large token transfers (whale movements).

*SYNOPSIS*
/whale\\_alert <token\\_mint_address> <threshold>

*ARGUMENTS*
<token\\_mint\\_address>    The Solana token mint address to monitor
<threshold>        Minimum transfer amount to trigger alert

*EXAMPLES*
/whale\\_alert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 1000

*USER STORY*:
As a user, I want to set up alerts for large token transfers (whale movements).

*OUTPUT*
- Confirmation of alert setup
- Alert notifications for large transfers

*TROUBLESHOOTING*
- Ensure valid token address
- Set appropriate threshold
- Check alert status with /list\\_whale\\_alerts

*SEE ALSO*
/list\\_whale\\_alerts, /remove\\_whale\\_alert, /check\\_whales`,

        LIST_WHALE_ALERTS_HELP: `📋 *List Whale Alerts Command (/list\\_whale\\_alerts)*

*DESCRIPTION*
Lists all active whale alerts for your account.

*SYNOPSIS*
/list\\_whale\\_alerts

*EXAMPLES*
/list\\_whale\\_alerts

*USER STORY*:
As a user, I want to list all active whale alerts for my account.

*OUTPUT*
- List of active alerts
- Token addresses
- Threshold values
- Alert status

*TROUBLESHOOTING*
- No active alerts found
- Alert list empty
- Check the space between the commands

*SEE ALSO*
/set\\_whale\\_alert, /remove\\_whale\\_alert, /check\\_whales`,

        REMOVE_WHALE_ALERT_HELP: `❌ *Remove Whale Alert Command (/remove_whale_alert)*

*DESCRIPTION*
Removes a whale alert for a specific token.

*SYNOPSIS*
/remove\\_whale\\_alert <token\\_mint\\_address>

*ARGUMENTS*
<token\\_mint\\_address>    The Solana token mint address to remove alert for

*USER STORY*:
As a user, I want to remove a whale alert for a specific token.

*EXAMPLES*
/remove\\_whale\\_alert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN

*OUTPUT*
- Confirmation of alert removal
- Updated alert list

*TROUBLESHOOTING*
- Alert not found
- Invalid token address
- Check the space between the commands

*SEE ALSO*
/whale\\_alert, /list\\_whale\\_alerts, /check\\_whales`,
        CHECK_WHALES_USAGE: "Usage: /check_whales <mint_address> <min_amount> [<limit>]\n\nExample: /check_whales 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN \n\nExample: /check_whales 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 10",

        CHECK_WHALES_HELP: `🔍 *Check Whales Command (/check_whales)*

*DESCRIPTION*
Manually checks for recent whale movements across all monitored tokens.

*SYNOPSIS*
/check\\_whales <mint\\_address> <min\\_amount>

*ARGUMENTS*
<mint\\_address>    The Solana token mint address to check whales for
<min\\_amount>      The minimum amount to trigger a whale alert

*USER STORY*
As a user, I want to manually check for recent whale movements across all monitored tokens.

*EXAMPLES*
/check\\_whales 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 10000

*OUTPUT*
- Recent whale movements
- Transfer details
- Impact analysis

*TROUBLESHOOTING*
- No recent whale movements
- Network connectivity issues

*SEE ALSO*
/whale\\_alert, /list\\_whale\\_alerts, /remove\\_whale\\_alert`,

        TRACK_WALLET_HELP: `👛 *Track Wallet Command (/track_wallet)*

*DESCRIPTION*
Monitors a wallet for balance changes and sends alerts when significant changes occur.

*SYNOPSIS*
/track\\_wallet <wallet\\_address> <min\\_value\\_usd>

*ARGUMENTS*
<wallet\\_address>    The Solana wallet address to monitor
<min\\_value\\_usd>     Minimum USD value to trigger alerts

*USER STORY*
As a user, I want to track wallets for balance changes and receive alerts for significant changes.

*EXAMPLES*
/track\\_wallet 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 1000

*OUTPUT*
- Balance change alerts
- New token acquisitions
- Token removals
- Value changes in USD


*TROUBLESHOOTING*
- Invalid wallet address
- Network connectivity issues

*SEE ALSO*
/list\\_tracked\\_wallets, /remove\\_tracked\\_wallet, /wallet\\_status`,

        LIST_TRACKED_WALLETS_HELP: `📋 *List Tracked Wallets Command (/list_tracked_wallets)*

*DESCRIPTION*
Lists all wallets you are currently tracking.

*SYNOPSIS*
/list\\_tracked\\_wallets


*USER STORY*
As a user, I want to see all wallets I am currently tracking for balance changes.

*EXAMPLES*
/list\\_tracked\\_wallets

*OUTPUT*
- List of tracked wallets
- Minimum value thresholds
- Last check times

*TROUBLESHOOTING*
- No tracked wallets found
- Check if you've set up any wallet tracking

*SEE ALSO*
/track\\_wallet, /remove\\_tracked\\_wallet, /wallet\\_status`,

        REMOVE_TRACKED_WALLET_HELP: `❌ *Remove Tracked Wallet Command (/remove\\_tracked\\_wallet)*

*DESCRIPTION*
Stops tracking a specific wallet.

*SYNOPSIS*
/remove\\_tracked\\_wallet <wallet_address>

*ARGUMENTS*
<wallet\\_address>    The wallet address to stop tracking

*EXAMPLES*
/remove\\_tracked\\_wallet 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

*TROUBLESHOOTING*
- Wallet not found in tracking list
- Invalid wallet address

*SEE ALSO*
/track\\_wallet, /list\\_tracked\\_wallets, /wallet\\_status`,

        WALLET_STATUS_HELP: `📊 *Wallet Status Command (/wallet_status)*

*DESCRIPTION*
Shows detailed information about a wallet's current state.

*SYNOPSIS*
/wallet\\_status <wallet_address>

*ARGUMENTS*
<wallet_address>    The wallet address to check

*OUTPUT*
- Total wallet value
- Token balances
- 24h changes
- Token categories
- Verification status

*EXAMPLES*
/wallet\\_status 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

*TROUBLESHOOTING*
- Invalid wallet address
- Network connectivity issues

*SEE ALSO*
/track\\_wallet, /list\\_tracked\\_wallets, /remove\\_tracked\\_wallet`,

        // Recent Transfers Command
        RECENT_TRANSFERS_USAGE: "Usage: /transfers wa_wallet_address [limit]\n\nExample: /transfers 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q\n\nExample: /transfers 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q 10",
        RECENT_TRANSFERS_HELP: `🔄 *Recent Transfers Command (/transfers)*

*DESCRIPTION*
Shows recent token transfers for a specific wallet, including transaction details and value changes.

*SYNOPSIS*
/transfers <wallet\\_address> [limit]

*ARGUMENTS*
<wallet\\_address>    The Solana wallet address to check transfers for
[limit]            Optional limit for number of transfers to display (default: 10)

*EXAMPLES*
/transfers 5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9
/transfers 5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9 10

*USER STORY*
As a user, I want to monitor recent token transfers for a specific wallet to track activity and value changes.

*OUTPUT*
- Transfer list with:
  - Transaction signature
  - Amount transferred
  - Source and destination addresses
  - Timestamp
  - Value in USD
  - Transaction status

*TROUBLESHOOTING*
- Invalid wallet address
- No recent transfers found
- Network connectivity issues

*SEE ALSO*
/whale\\_alert, /check\\_whales, /analyze\\_wallet`,

        // Top Holders Command
        TOP_HOLDERS_USAGE: "Usage: /top_holders <token_mint_address>\n\nExample: /top_holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        TOP_HOLDERS_HELP: `*Top Holders Command (/top_holders)*

*DESCRIPTION*
Shows the top token holders for a specific token.

*SYNOPSIS*
/top\\_holders <token_mint_address>

*ARGUMENTS*
<token\\_mint\\_address>   The Solana token mint address to check holders for

*USER STORY*:
As a user, I want to see the top token holders for a specific token.

*EXAMPLES*
/top\\_holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN

*OUTPUT*

- Top holder list
- Holder addresses
- Balance amounts
- Percentage of total supply

*TROUBLESHOOTING*

- No holders found
- Invalid token address
- Network connectivity issues
- Check the space between the commands

*SEE ALSO*
/holder\\_distribution, /series, /analyze

`,

        PROGRAMS_HELP: `🔍 *Programs Explorer Command (/programs)*

*DESCRIPTION*
Explore and search through known Solana programs, including their details, usage statistics, and user information.

*SYNOPSIS*
/programs [search_term]
/program <program_id>

*ARGUMENTS*
[search_term]    Optional search term to filter programs
<program_id>     Specific program ID to view details

*EXAMPLES*
/programs
/programs gaming
/programs defi
/program SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6

*USER STORY*
As a user, I want to explore Solana programs and get detailed information about their usage, users, and activity.

*OUTPUT*
- Program listing with:
  * Program name and ID
  * Description and category
  * Usage statistics
  * User information
  * Activity metrics
  * Links to resources

*TROUBLESHOOTING*
- Program not found
- Invalid program ID
- Search returned no results
- Network connectivity issues

*SEE ALSO*
/program_info, /top_users, /users_insights`,

        PROGRAM_INFO_HELP: `🔍 *Program Info Command (/program_info)*

*DESCRIPTION*
Provides detailed information about a specific Solana program, including its name, entity, labels, description, and logo.

*SYNOPSIS*
/program\\_info <program\\_id\\_or\\_name>

*ARGUMENTS*
<program\\_name>    The name of the program to get information about (e.g., 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN, Bonkswap)

*EXAMPLES*
/program\\_info Monaco Protocol
/program\\_info Bonkswap
/program\\_info 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN

*USER STORY*
As a user, I want to get detailed information about a specific Solana program to understand its purpose and features.

*OUTPUT*
- Program Information:
  - Program Name
  - Entity Name
  - Labels (e.g., DEFI, AGGREGATOR, STAKING, DEX, AMM)
  - Description
  - Logo URL

*TROUBLESHOOTING*
- Invalid program name
- Program not found
- Network connectivity issues

*SEE ALSO*
/explore, /top_users, /users_insights`,

        CHECK_PRICE_USAGE: "Usage: /check_price <token_mint_address>\n\nExample: /check_price 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        CHECK_PRICE_HELP: `💰 *Price Command (/check_price)*

*DESCRIPTION*
Shows current price information for a token, including last close, 24h high/low, and volume.

*SYNOPSIS*
/check\\_price <token\\_mint\\_address>

*ARGUMENTS*
<token\\_mint\\_address>    The Solana token mint address to check price for


*USER STORY*
As a user, I want to get detailed information about a specific Solana token, including it's trading view, volume,
24h high and low and its current price.

*EXAMPLES*
/check\\_price 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN

*OUTPUT*
- Token Name
- Last Close Price
- 24h High
- 24h Low
- Volume
- Number of Trade
- Price Change
- More...

*TROUBLESHOOTING*
- Invalid token address
- Network connectivity issues`,

        PRICE_ALERT_USAGE: "Usage: /set_price_alert <token_mint_address> <threshold> <high/low>\n\n" +
                "Example: /set_price_alert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 7.5 high\n\n This will alert when USDC price goes above $7.50",
        PRICE_ALERT_HELP: `⚠️ *Price Alert Command (/set_price_alert)*

*DESCRIPTION*
Sets up price alerts for a token. You'll be notified when the price crosses your specified threshold.

*SYNOPSIS*
/set\\_price\\_alert <token_mint_address> <threshold> <high/low>

*ARGUMENTS*
<token\\_mint\\_address>    The Solana token mint address to monitor
<threshold>             Price threshold to trigger alert
<high/low>             Whether to alert on price going above (high) or below (low) threshold

*EXAMPLES*

/set\\_price\\_alert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 7.5 high
/set\\_price\\_alert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 7.0 low


*USER STORY*
As a user, I want to set an alert, similar to a stop-loss, that alerts me when a token prices hit the threshold.

*OUTPUT*
- Confirmation of alert setup
- Alert notifications when price crosses threshold

*TROUBLESHOOTING*
- Invalid token address
- Invalid threshold value
- Invalid high/low parameter

*SEE ALSO*
/remove\\_price\\_alert, list\\_price\\_alert, /check\\_price`,


        LIST_PRICE_ALERT_USAGE: "Usage: /list_price_alert\n\nExample: /list_price_alert",
        LIST_PRICE_ALERT_HELP: `📋 *List Price Alerts Command (/list_price_alert)*

*DESCRIPTION*
Lists all active price alerts you have set up for different tokens.

*SYNOPSIS*
/list_price_alert

*EXAMPLES*
/list_price_alert

*USER STORY*
As a user, I want to view all my active price alerts to manage my token price monitoring.

*OUTPUT*
- List of active price alerts including:
  * Token mint address
  * Price threshold
  * Alert type (high/low)
  * Current price status

*TROUBLESHOOTING*
- No active alerts found
- Network connectivity issues

*SEE ALSO*
/price_alert, /remove_price_alert`,

        REMOVE_PRICE_ALERT_USAGE: "Usage: /remove_price_alert <token_mint_address>\n\nExample: /remove_price_alert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        REMOVE_PRICE_ALERT_HELP: `❌ *Remove Price Alert Command (/remove_price_alert)*

*DESCRIPTION*
Removes a price alert for a specific token.

*SYNOPSIS*
/remove_price_alert <token_mint_address>

*ARGUMENTS*
<token_mint_address>    The Solana token mint address to remove alert for

*EXAMPLES*
/remove_price_alert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN

*USER STORY*
As a user, I want to remove a price alert for a token I no longer want to monitor.

*OUTPUT*
- Confirmation of alert removal
- Updated list of active alerts

*TROUBLESHOOTING*
- Alert not found
- Invalid token address
- Network connectivity issues

*SEE ALSO*
/price_alert, /list_price_alert`,

        // NFT Commands Help
        // NFT_PORTFOLIO_USAGE: "Usage: /nft_portfolio [wallet_address]\n\nExample: /nftportfolio 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q",
        NFT_PORTFOLIO_HELP: `🖼️ *NFT Portfolio Command (/nft_portfolio)*

*DESCRIPTION*
Shows the NFT portfolio for a wallet, including total value, collections, and individual NFTs.

*SYNOPSIS*
/nft\\_portfolio [wallet_address]

*ARGUMENTS*
[wallet\\_address]    Optional Solana wallet address. If not provided, uses your registered wallet.

*EXAMPLES*
/nft\\_portfolio 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN


*OUTPUT*
- Total portfolio value
- Number of collections
- Top collections by value
- Collection details with floor prices

*TROUBLESHOOTING*
- Invalid wallet address
- No NFTs found
- Network connectivity issues`,

        NFT_REGISTER_USAGE: "Usage: /register_nft_wallet <wallet_address>\n\nExample: /register\\_nft\\_wallet 5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
        NFT_REGISTER_HELP: `📝 *Register NFT Wallet Command (/register_nft_wallet)*

*DESCRIPTION*
Registers a wallet for NFT tracking. You can then use /nft\\_portfolio without specifying the wallet address.

*SYNOPSIS*
/register\\_nft\\_wallet <wallet\\_address>

*ARGUMENTS*
<wallet\\_address>   The Solana wallet address to register

*USER STORY*
As a User, I want to register a wallet for NFT tracking so that I can easily monitor my NFTs.

*EXAMPLES*
/register\\_nft\\_wallet 5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9

*OUTPUT*
- Confirmation of wallet registration
- List of registered wallets

*TROUBLESHOOTING*
- Invalid wallet address
- Wallet already registered
- Network connectivity issues


* SEE ALSO *
/nft\\_portfolio, /remove\\_nft\\_wallet, /list\\_nft\\_wallets`,


        NFT_LIST_HELP: `📋 *List NFT Wallets Command (/list_nft_wallets)*

*DESCRIPTION*
Lists all wallets you have registered for NFT tracking.

*SYNOPSIS*
/list\\_nft\\_wallets

*ARGUMENTS*
</list\\_nft\\_wallets>    No arguments required

*USER STORY*
As a User, I want to see all the wallets I have registered for NFT tracking.

*EXAMPLES*
</list\\_nft\\_wallets>

*OUTPUT*
- List of registered wallet addresses
- Number of wallets registered

*TROUBLESHOOTING*
- No wallets registered
- Network connectivity issues

* SEE ALSO *
/ nft\\_portfolio, /remove\\_nft\\_wallet`,        

        NFT_REMOVE_USAGE: "Usage: /removenftwallet <wallet_address>\n\nExample: /removenftwallet 5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
        NFT_REMOVE_HELP: `❌ *Remove NFT Wallet Command (/remove_nft_wallet)*

*DESCRIPTION*
Removes a wallet from NFT tracking.

*SYNOPSIS*
/remove\\_nft\\_wallet <wallet\\_address>

*ARGUMENTS*
<wallet\\_address>    The Solana wallet address to remove

*USER STORY*
As a User, I want to remove a wallet from NFT tracking so that I can manage my registered wallets.

*EXAMPLES*
/remove\\_nft\\_wallet 5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9

*OUTPUT*
- Confirmation of wallet removal
- Updated list of registered wallets

*TROUBLESHOOTING*
- Invalid wallet address
- Wallet not registered
- Network connectivity issues

* SEE ALSO *
/nft\\_portfolio, /list\\_nft\\_wallets`,


        EXPLORE_HELP: `🔍 *Explore Programs (/explore)*

*DESCRIPTION*
Explores and lists Solana programs by category (e.g., GAMING, DEFI, NFT), providing a comprehensive overview of programs in each category.

*SYNOPSIS*
/explore <category>

*ARGUMENTS*
<category>    The category to explore (e.g., gaming, defi, nft)

*EXAMPLES*
/explore gaming
/explore defi
/explore nft

*USER STORY*
As a user, I want to discover Solana programs by category to understand what's available in each ecosystem.

*OUTPUT*
- Category Overview:
  - List of programs found for the specified category
  - Program names with brief descriptions
  - Links to detailed program information

*TROUBLESHOOTING*
- Invalid category name
- No programs found in category
- Network connectivity issues

*SEE ALSO*
/program\\_info, /programs, /top\\_users`,

        TOP_USERS_HELP: `👑 *Top Users Command (/top_users)*

*DESCRIPTION*
Shows the top active users of a specific Solana program, ranked by their transaction count and activity level.

*SYNOPSIS*
/top_users <program\\_id\\_or\\_name>

*ARGUMENTS*
<program\\_id\\_or\\_name>    The name of the program to get top users for
(e.g., Bonkswap, 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8)

*EXAMPLES*
/top\\_users Bonkswap
/top\\_users 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
/top\\_users SPQR4kT3q2oUKEJes2L6NNSBCiPW9SfuhkuqC9bp6Sx

*USER STORY*
As a user, I want to identify the most active users of a Solana program to understand user engagement and activity patterns.

*OUTPUT*
- Top Users List:
  - Ranked list of top 10 users
  - User wallet addresses
  - Transaction counts
  - Timestamp of data retrieval

*TROUBLESHOOTING*
- Invalid program id/name
- Program not found
- No user data available
- Network connectivity issues

*SEE ALSO*
/program\\_info, /users\\_insights, /activity\\_change`,

        USERS_INSIGHTS_HELP: `📊 *Users Insights Command (/users_insights)*

*DESCRIPTION*
Provides detailed insights about users of a specific Solana program, including transaction statistics and whale wallet analysis.

*SYNOPSIS*
/users\\_insights <program\\_id\\_or\\_name>

*ARGUMENTS*
<program\\_id\\_or\\_name>   The name of the program to get user insights for
(e.g., Monaco Protocol, 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8)

*EXAMPLES*
/users\\_insights Monaco Protocol
/users\\_insights Bonkswap
/users\\_insights 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8

*USER STORY*
As a user, I want to understand the user base and transaction patterns of a Solana program to analyze its adoption and usage.

*OUTPUT*
- User Statistics:
  - Total Users Analyzed
  - Total Transactions
  - Average Transactions per User
  - Transaction Range

- Whale Analysis:
  - List of top whale wallets
  - Transaction counts for each whale
  - Percentage of total transactions


*TROUBLESHOOTING*
- Invalid program name
- Program not found
- No user data available
- Network connectivity issues

*SEE ALSO*
/program\\_info, /top\\_users, /activity\\_change`,

        CHECK_PROGRAM_WHALE_USERS: `🐋 *Check Program Whale Users Command (/check\\_program\\_whale\\_users)*

*DESCRIPTION*
Identifies and displays whale users of a specific Solana program based on their transaction activity, using a predefined threshold. 

*SYNOPSIS*
/check\\_program\\_whale\\_users <program\\_id\\_or\\_name>

*ARGUMENTS*
<program\\_id\\_or\\_name>   The name of the program to check whale users for
(e.g., Monaco Protocol, SPQR4kT3q2oUKEJes2L6NNSBCiPW9SfuhkuqC9bp6Sx)

*EXAMPLES*
/activity\\_change Monaco Protocol
/activity\\_change Bonkswap
/activity\\_change SPQR4kT3q2oUKEJes2L6NNSBCiPW9SfuhkuqC9bp6Sx

*USER STORY*
As a user, I want to identify whale users of a Solana program to understand the distribution of activity and potential market impact.

*OUTPUT*
- Whale Users List:
  - Program name
  - Transaction threshold
  - Ranked list of whale wallets
  - Transaction counts for each whale
  - Total whale user count

*TROUBLESHOOTING*
- Invalid program name
- Program not found
- No whale users found
- Network connectivity issues

*SEE ALSO*
/program\\_info, /users\\_insights, /top\\_users`,
        ACTIVITY_CHANGE_HELP: `🐋 *Activity change Command (/activity\\_change)*

*DESCRIPTION*
Identifies and displays any notable changes in user activity for Solana programs over time.

*SYNOPSIS*
/activity\\_change) <program\\_id\\_or\\_name>


*ARGUMENTS*
<program\\_id\\_or\\_name>   The name of the program to track it's activity whale
(e.g., Monaco Protocol, SPQR4kT3q2oUKEJes2L6NNSBCiPW9SfuhkuqC9bp6Sx)

*EXAMPLES*
/activity\\_change Monaco Protocol
/activity\\_change Bonkswap
/activity\\_change SPQR4kT3q2oUKEJes2L6NNSBCiPW9SfuhkuqC9bp6Sx

*USER STORY*
As a user, I want to track and compare user activity data for Solana programs over time

*OUTPUT*
- Whale Users List:
  - Program name
  - Transaction activities e.g A new user
  - Increased activity,
  - Decreased activity

*TROUBLESHOOTING*
- Invalid program name
- Program not found
- Network connectivity issues

*SEE ALSO*
/check\\_program\\_whale\\_users, /users\\_insights, /top\\_users`,

                HANDLE_NFT_PORTFOLIO_USAGE:
                        "Usage: /nft_portfolio [wallet_address]\n\n" +
                        "Example: /nft_portfolio GZfYZiH6zHrwpzJNnV7PEF9GWJEr3kRKz7Rj5umKDhbj\n" +
                        "Example: /nft_portfolio (uses your registered wallet if available)",

                HANDLE_NFT_PORTFOLIO_HELP:
                        `🖼️ *NFT Portfolio Analysis Command (/nft_portfolio)*

*DESCRIPTION*
Displays detailed information about NFT holdings in a wallet, including collection values, floor prices, and total portfolio worth.

*SYNOPSIS*
/nft\\_portfolio [wallet\\_address]

*ARGUMENTS*
[wallet\\_address]    Optional Solana wallet address. If omitted, uses your registered wallet

*USER STORY*
As a user, I want to analyze NFT holdings in a wallet to understand portfolio value and collection distribution.

*OUTPUT*
- Total Portfolio Value (USD & SOL)
- Number of Collections
- Total NFTs Owned
- Top Collections by Value:
  * Collection Names
  * Items Owned
  * Collection Values
  * Floor Prices

*EXAMPLES*
/nft\\_portfolio GZfYZiH6zHrwpzJNnV7PEF9GWJEr3kRKz7Rj5umKDhbj
/nft\\_portfolio (uses registered wallet)

*TROUBLESHOOTING*
- Invalid wallet address format
- No NFTs found in wallet
- Network connectivity issues
- Redis caching errors


*SEE ALSO*
/register\\_nft_wallet, /list\\_nft\\_wallets, /nft\\_collection`,
        
                HANDLE_NFT_COLLECTION_USAGE:
                        "Usage: /nft_collection <wallet_address>, <collection_name>\n\n" +
                        "Example: /nft_collection GZfYZiH6zHrwpzJNnV7PEF9GWJEr3kRKz7Rj5umKDhbj, Solana Monkey Business",
};