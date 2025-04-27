export const BOT_MESSAGES = {
        WELCOME: `
🚀 Welcome to Vybe's Analytical Bot!

Here are all available commands, organized by category:

💳 *Wallet Management:*
- /track\\_wallet <address> <min_value> - Track wallet activity
- /list\\_tracked\\_wallets - List tracked wallets
- /remove\\_tracked\\_wallet <address> - Remove tracked wallet
- /analyze\\_wallet <address> - Detailed wallet analysis

💰 *Token Analysis:*
- /analyze <symbol> - Analyze token (e.g., /analyze JUP)
- /series <symbol> - Token time series analysis
- /holder\\_distribution <symbol> - Token holder distribution
- /price <symbol> - Get current token price
- /price\\_alert <symbol> <threshold> <high/low> - Set price alerts
- /price\\_change <symbol> - Get price changes

🐋 *Whale Watching:*
- /whale\\_alert <token> <amount> - Set whale alert
- /list\\_whale\\_alerts - List whale alerts
- /remove\\_whale\\_alert <token> - Remove whale alert
- /check\\_whales <token> <amount> - Check recent whale movements

🖼️ *NFT Portfolio:*
- /nft\\_portfolio [address] - View NFT portfolio
- /register\\_nft\\_wallet <address> - Register wallet for NFT tracking
- /list\\_nft\\_wallets - List registered NFT wallets
- /remove\\_nft\\_wallet <address> - Remove NFT wallet
- /nft\\_collection <address>, <name> - View collection details

🔍 *Program Analysis:*
- /program\\_info <id> - Get program information
- /explore <id> - Explore program details
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

For support or questions, please contact our team.
`,


        WALLET_BALANCE_TEMPLATE: `💰 *Wallet Balances*
%balances%
WalletId: %walletId%
Network: %network%
Walletaddress: %walletAddress%
Balance: %balance%
Symbol: %symbol%`,


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
/analyze, /holder_distribution, /series`,

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
/analyze, /holder_distribution, /series`,

        TOKEN_HOLDER: `📊 *Rank*: %index%

* Owner Name:* %ownerName%

* Address:* %ownerAddress%
* Token Balance:* %formattedBalance%

* Total % supply held:* %formattedSupply%

* Token balance* %formattedValue%`,

        // Token Analysis Commands
        TOKEN_ANALYSIS_USAGE: "Usage: /analyze <token_mint_address>\n\nExample: /analyze 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        TOKEN_ANALYSIS_HELP: `📊 *Token Analysis Command (/analyze)*

*DESCRIPTION*
Analyzes a token's current state, including price, market cap, and portfolio metrics.

*SYNOPSIS*
/analyze <token_mint_address>

*ARGUMENTS*
<token\\_mint\\_address>   The Solana token mint address to analyze

*EXAMPLES*
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
- Check the space between the command and the token address

*SEE ALSO*
/holders, /holder\\_distribution`,

        TOKEN_TIME_SERIES_USAGE: "Usage: /series <token_mint_address> [start_date] [end_date]\n\nExample: /series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN\n\nExample: /series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09\n\nExample: /series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09 2025-03-30",
        TOKEN_TIME_SERIES_HELP: `📊 *Token Time Series Analysis Command (/series)*

*DESCRIPTION*
Analyzes token holder and volume trends over time, including correlation analysis.

*SYNOPSIS*
/series <token_mint_address> [start_date] [end_date]

*ARGUMENTS*
<token_mint_address>    The Solana token mint address to analyze
[start_date]            Optional start date in YYYY-MM-DD format
[end_date]              Optional end date in YYYY-MM-DD format

*EXAMPLES*
/series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN
/series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09
/series 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025-04-09 2025-03-30

*USER STORY*:
As a user, I want to analyze token holder and volume trends over time, including correlation analysis.

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
- Check the space between the command and the token address

*SEE ALSO*
/analyze, /holder\\_distribution`,

        HOLDER_DISTRIBUTION_USAGE: "Usage: /holder_distribution <token_mint_address>\n\nExample: /holder_distribution 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        HOLDER_DISTRIBUTION_HELP: `📊 *Holder Distribution Command (/holder\\_distribution)*

*DESCRIPTION*
Analyzes the distribution of token holders across different balance ranges.

*SYNOPSIS*:
/holder\\_distribution <token_mint_address>

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
        WHALE_ALERT_USAGE: "Usage: /whalealert <token_mint_address> <threshold>\n\nExample: /whalealert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 1000",
        WHALE_ALERT_HELP: `🐋 *Whale Alert Command (/whalealert)*

*DESCRIPTION*
Sets up alerts for large token transfers (whale movements).

*SYNOPSIS*
/whalealert <token_mint_address> <threshold>

*ARGUMENTS*
<token_mint_address>    The Solana token mint address to monitor
<threshold>             Minimum transfer amount to trigger alert

*EXAMPLES*
/whalealert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 1000

*USER STORY*:
As a user, I want to set up alerts for large token transfers (whale movements).

*OUTPUT*
- Confirmation of alert setup
- Alert notifications for large transfers

*TROUBLESHOOTING*
- Ensure valid token address
- Set appropriate threshold
- Check alert status with /listwhalealerts

*SEE ALSO*
/listwhalealerts, /removewhalealert, /checkwhales`,

        LIST_WHALE_ALERTS_HELP: `📋 *List Whale Alerts Command (/listwhalealerts)*

*DESCRIPTION*
Lists all active whale alerts for your account.

*SYNOPSIS*
/listwhalealerts

*EXAMPLES*
/listwhalealerts

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
/whalealert, /removewhalealert, /checkwhales`,

        REMOVE_WHALE_ALERT_HELP: `❌ *Remove Whale Alert Command (/removewhalealert)*

*DESCRIPTION*
Removes a whale alert for a specific token.

*SYNOPSIS*
/removewhalealert <token_mint_address>

*ARGUMENTS*
<token_mint_address>    The Solana token mint address to remove alert for

*EXAMPLES*
/removewhalealert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN

*USER STORY*:
As a user, I want to remove a whale alert for a specific token.

*OUTPUT*
- Confirmation of alert removal
- Updated alert list

*TROUBLESHOOTING*
- Alert not found
- Invalid token address
- Check the space between the commands

*SEE ALSO*
/whalealert, /listwhalealerts, /checkwhales`,
        CHECK_WHALES_USAGE: "Usage: /checkwhales <mint_address> <min_amount> [<limit>]\n\nExample: /checkwhales 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN \n\nExample: /checkwhales 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 10",

        CHECK_WHALES_HELP: `🔍 *Check Whales Command (/checkwhales)*

*DESCRIPTION*
Manually checks for recent whale movements across all monitored tokens.

*SYNOPSIS*
/checkwhales <mint_address> <min_amount>

*ARGUMENTS*
<mint_address>    The Solana token mint address to check whales for
<min_amount>      The minimum amount to trigger a whale alert

*OUTPUT*
- Recent whale movements
- Transfer details
- Impact analysis

*EXAMPLES*
/checkwhales 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 10000

*TROUBLESHOOTING*
- No recent whale movements
- Network connectivity issues
- Check the space between the command and the token address

*SEE ALSO*
/whalealert, /listwhalealerts, /removewhalealert`,

        TRACK_WALLET_HELP: `👛 *Track Wallet Command (/trackwallet)*

*DESCRIPTION*
Monitors a wallet for balance changes and sends alerts when significant changes occur.

*SYNOPSIS*
/trackwallet <wallet_address> <min_value_usd>

*ARGUMENTS*
<wallet_address>    The Solana wallet address to monitor
<min_value_usd>     Minimum USD value to trigger alerts

*OUTPUT*
- Balance change alerts
- New token acquisitions
- Token removals
- Value changes in USD

*EXAMPLES*
/trackwallet 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q 1000

*TROUBLESHOOTING*
- Invalid wallet address
- Network connectivity issues
- Check the space between the command and the wallet address

*SEE ALSO*
/listtrackedwallets, /removetrackedwallet, /walletstatus`,

        LIST_TRACKED_WALLETS_HELP: `📋 *List Tracked Wallets Command (/listtrackedwallets)*

*DESCRIPTION*
Lists all wallets you are currently tracking.

*SYNOPSIS*
/listtrackedwallets

*OUTPUT*
- List of tracked wallets
- Minimum value thresholds
- Last check times

*EXAMPLES*
/listtrackedwallets

*TROUBLESHOOTING*
- No tracked wallets found
- Check if you've set up any wallet tracking

*SEE ALSO*
/trackwallet, /removetrackedwallet, /walletstatus`,

        REMOVE_TRACKED_WALLET_HELP: `❌ *Remove Tracked Wallet Command (/removetrackedwallet)*

*DESCRIPTION*
Stops tracking a specific wallet.

*SYNOPSIS*
/removetrackedwallet <wallet_address>

*ARGUMENTS*
<wallet_address>    The wallet address to stop tracking

*EXAMPLES*
/removetrackedwallet 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

*TROUBLESHOOTING*
- Wallet not found in tracking list
- Invalid wallet address
- Check the space between the command and the wallet address

*SEE ALSO*
/trackwallet, /listtrackedwallets, /walletstatus`,

        WALLET_STATUS_HELP: `📊 *Wallet Status Command (/walletstatus)*

*DESCRIPTION*
Shows detailed information about a wallet's current state.

*SYNOPSIS*
/walletstatus <wallet_address>

*ARGUMENTS*
<wallet_address>    The wallet address to check

*OUTPUT*
- Total wallet value
- Token balances
- 24h changes
- Token categories
- Verification status

*EXAMPLES*
/walletstatus 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

*TROUBLESHOOTING*
- Invalid wallet address
- Network connectivity issues
- Check the space between the command and the wallet address

*SEE ALSO*
/trackwallet, /listtrackedwallets, /removetrackedwallet`,

        // Recent Transfers Command
        RECENT_TRANSFERS_USAGE: "Usage: /transfers wa_wallet_address [limit]\n\nExample: /transfers 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q\n\nExample: /transfers 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q 10",
        RECENT_TRANSFERS_HELP: `🔄 *Recent Transfers Command (/transfers)*

*DESCRIPTION*
Shows recent token transfers for a specific wallet, including transaction details and value changes.

*SYNOPSIS*
/transfers <wallet_address> [limit]

*ARGUMENTS*
<wallet_address>    The Solana wallet address to check transfers for
[limit]            Optional limit for number of transfers to display (default: 10)

*EXAMPLES*
/transfers 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q
/transfers 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q 20

*USER STORY*
As a user, I want to monitor recent token transfers for a specific wallet to track activity and value changes.

*OUTPUT*
- Transfer list with:
  * Transaction signature
  * Amount transferred
  * Source and destination addresses
  * Timestamp
  * Value in USD
  * Transaction status

*TROUBLESHOOTING*
- Invalid wallet address
- No recent transfers found
- Network connectivity issues
- Check the space between command and arguments

*SEE ALSO*
/whalealert, /checkwhales, /analyze_wallet`,

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

        PROGRAM_INFO_HELP: `🔍 *Program Info Command (/programinfo)*

*DESCRIPTION*
Look up information about a specific Solana program.

*SYNOPSIS*
/programinfo <program_id>

*ARGUMENTS*
<program_id>    The Solana program ID to look up

*EXAMPLES*
/programinfo SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6

*OUTPUT*
- Program Name
- Labels
- Description
- Website (if available)
- Logo URL (if available)
- Main Category

*TROUBLESHOOTING*
- Program ID not found
- Invalid program ID format
- Check the space between the command and the program ID`,

        PRICE_USAGE: "Usage: /price <token_mint_address>\n\nExample: /price 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        PRICE_HELP: `💰 *Price Command (/price)*

*DESCRIPTION*
Shows current price information for a token, including last close, 24h high/low, and volume.

*SYNOPSIS*
/price <token_mint_address>

*ARGUMENTS*
<token_mint_address>    The Solana token mint address to check price for

*EXAMPLES*
/price 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN

*OUTPUT*
- Last Close Price
- 24h High
- 24h Low
- Volume
- Price Change

*TROUBLESHOOTING*
- Invalid token address
- Network connectivity issues
- Check the space between the command and the token address`,

        PRICE_ALERT_USAGE: "Usage: /pricealert <token_mint_address> <threshold> <high/low>\n\nExample: /pricealert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 7.5 high\n\n This will alert when USDC price goes above $1.50",
        PRICE_ALERT_HELP: `⚠️ *Price Alert Command (/pricealert)*

*DESCRIPTION*
Sets up price alerts for a token. You'll be notified when the price crosses your specified threshold.

*SYNOPSIS*
/pricealert <token_mint_address> <threshold> <high/low>

*ARGUMENTS*
<token_mint_address>    The Solana token mint address to monitor
<threshold>             Price threshold to trigger alert
<high/low>             Whether to alert on price going above (high) or below (low) threshold

*EXAMPLES*

/pricealert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 7.5 high
/pricealert 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 7.0 low

*OUTPUT*
- Confirmation of alert setup
- Alert notifications when price crosses threshold

*TROUBLESHOOTING*
- Invalid token address
- Invalid threshold value
- Invalid high/low parameter
- Check the space between the command and arguments`,

        PRICE_CHANGE_USAGE: "Usage: /pricechange <token_mint_address>\n\nExample: /pricechange 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        PRICE_CHANGE_HELP: `📊 *Price Change Command (/pricechange)*

*DESCRIPTION*
Shows the hourly price change percentage for a token.

*SYNOPSIS*
/pricechange <token_mint_address>

*ARGUMENTS*
<token\\_mint\\_address>   The Solana token mint address to check price change for

*EXAMPLES*
/pricechange 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 

*OUTPUT*
- Hourly price change percentage
- Direction indicator (up/down)

*TROUBLESHOOTING*
- Invalid token address
- Network connectivity issues
- Check the space between the command and the token address`,

        // NFT Commands Help
        NFT_PORTFOLIO_USAGE: "Usage: /nftportfolio [wallet_address]\n\nExample: /nftportfolio 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q",
        NFT_PORTFOLIO_HELP: `🖼️ *NFT Portfolio Command (/nftportfolio)*

*DESCRIPTION*
Shows the NFT portfolio for a wallet, including total value, collections, and individual NFTs.

*SYNOPSIS*
/nftportfolio [wallet_address]

*ARGUMENTS*
[wallet_address]    Optional Solana wallet address. If not provided, uses your registered wallet.

*EXAMPLES*
/nftportfolio 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

*OUTPUT*
- Total portfolio value
- Number of collections
- Top collections by value
- Collection details with floor prices

*TROUBLESHOOTING*
- Invalid wallet address
- No NFTs found
- Network connectivity issues`,

        NFT_REGISTER_USAGE: "Usage: /registernftwallet <wallet_address>\n\nExample: /registernftwallet 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q",
        NFT_REGISTER_HELP: `📝 *Register NFT Wallet Command (/registernftwallet)*

*DESCRIPTION*
Registers a wallet for NFT tracking. You can then use /nftportfolio without specifying the wallet address.

*SYNOPSIS*
/registernftwallet <wallet_address>

*ARGUMENTS*
<wallet_address>    The Solana wallet address to register

*EXAMPLES*
/registernftwallet 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

*OUTPUT*
- Confirmation of wallet registration
- List of registered wallets

*TROUBLESHOOTING*
- Invalid wallet address
- Wallet already registered
- Network connectivity issues`,

        NFT_LIST_USAGE: "Usage: /listnftwallets",
        NFT_LIST_HELP: `📋 *List NFT Wallets Command (/listnftwallets)*

*DESCRIPTION*
Lists all wallets you have registered for NFT tracking.

*SYNOPSIS*
/listnftwallets

*OUTPUT*
- List of registered wallet addresses
- Number of wallets registered

*TROUBLESHOOTING*
- No wallets registered
- Network connectivity issues`,

        NFT_REMOVE_USAGE: "Usage: /removenftwallet <wallet_address>\n\nExample: /removenftwallet 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q",
        NFT_REMOVE_HELP: `❌ *Remove NFT Wallet Command (/removenftwallet)*

*DESCRIPTION*
Removes a wallet from NFT tracking.

*SYNOPSIS*
/removenftwallet <wallet_address>

*ARGUMENTS*
<wallet_address>    The Solana wallet address to remove

*EXAMPLES*
/removenftwallet 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

*OUTPUT*
- Confirmation of wallet removal
- Updated list of registered wallets

*TROUBLESHOOTING*
- Invalid wallet address
- Wallet not registered
- Network connectivity issues`,

        NFT_COLLECTION_USAGE: "Usage: /nftcollection <wallet_address>, <collection_name>\n\nExample: /nftcollection 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q, Solana Monkey Business",
        NFT_COLLECTION_HELP: `🏛️ *NFT Collection Command (/nftcollection)*

*DESCRIPTION*
Shows detailed information about a specific NFT collection in a wallet.

*SYNOPSIS*
/nftcollection <wallet_address>, <collection_name>

*ARGUMENTS*
<wallet_address>    The Solana wallet address
<collection_name>   The name of the NFT collection

*EXAMPLES*
/nftcollection 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q, Solana Monkey Business

*OUTPUT*
- Collection name and address
- Number of items owned
- Total value
- Floor price
- Collection logo (if available)

*TROUBLESHOOTING*
- Invalid wallet address
- Collection not found
- Network connectivity issues`,

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
  * List of programs found for the specified category
  * Program names with brief descriptions
  * Links to detailed program information

- Example Output:
  Programs found for GAMING label

  ⋆ Star Atlas SAGE
  ⋆ Star Atlas - PROFILE ACTION
  ⋆ Star Atlas - CRAFTING
  ⋆ Star Atlas Proxy Rewarder
  ⋆ Star Atlas - CARGO
  ⋆ Bonkswap
  ⋆ Star Atlas Score
  ⋆ STEPN Dooar Swap
  ⋆ Genopets Habitat Management
  ⋆ Star Atlas Marketplace

  To view more information about a program, use:
  /program_info <program_name>

*TROUBLESHOOTING*
- Invalid category name
- No programs found in category
- Network connectivity issues
- Check the space between command and category

*SEE ALSO*
/program_info, /programs, /top_users`,
};