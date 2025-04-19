export const BOT_MESSAGES = {
        WELCOME: `
🚀 Welcome to Vybe's Analytical Bot!


Here are some command suggestions based on the Vybe API's features, categorised for clarity

💳 *Wallet Management:*
- /trackwallet - Track wallet activity
- /listtrackedwallets - List tracked wallets
- /removetrackedwallet - Remove tracked wallet
- /walletstatus - View wallet status

💰 *Token Analysis:*
- /analyze  - Analyze token
- /series - Token time series analysis
- /holder\\_distribution - Token holder distribution

🐋 *Whale Watching:*
- /whalealert - Set whale alert
- /listwhalealerts - List whale alerts
- /removewhalealert - Remove whale alert
- /checkwhales - Check recent whale movements

🔍 *Recent Transfers:*
- /transfers - Recent transfers

👤 *Top Holders:*
- /top\\_holders - Top holders


To see a full details of a specific command, use <command> help
e.g /analyze help

`,


        PROFILE_TEMPLATE: `👤 *User Profile*

*🆔 Copperx ID:* %id%

*💌 Email:* %email%

*👤 Role:* %role%

*🔒 Status:* %status%

*🏦 Relayer Address:* %relayerAddress%

*💳 Wallet Address:* %walletAddress%

*💳 Wallet Account Type:* %walletAccountType%`,

        COMMANDS_MESSAGE: `

🚀 *Quick Start Guide:*

1️⃣ Use /login to connect your account.
2️⃣ Use /logout — Logout of your account
3️⃣ Check /help for all available commands.  

🛠️ *Available Commands:*

🎯 *Wallet Management:*
- 💰 /balance — Check wallet balances
- 🏦 /wallets — View all wallets
- ⭐ /default — View default wallet


🎯 *Transactions:*
- ✈️ /send — Send funds
- 🏧 /withdraw — Create Offramp transfer
- 📦 /bulk — Bulk transfer funds
- ➕ /add\\_recipient — Add recipient to bulk transfer
- 🔍 /review — Review bulk transfer list

🎯 *Account Information:*
- 🆔 /profile — View Copperx profile
- 🏷️ /kyc — Check KYC status
- 📜 /history — View transaction history
- ❓ /help — Show help message



📣 Contact Support: https://t.me/copperxcommunity/2183`,


        WALLET_BALANCE_TEMPLATE: `💰 *Wallet Balances*
%balances%
WalletId: %walletId%
Network: %network%
Walletaddress: %walletAddress%
Balance: %balance%
Symbol: %symbol%`,


        TRANSFER_EMAIL_INTRO: `📤 *Send Funds by Email*

Send funds to any email address. The recipient will be notified to claim the funds.

Please follow these steps:
1. Enter recipient email
2. Enter amount to send
3. Select purpose
4. Review and confirm`,


        TOPTOKENHOLDERS_HELP: `*Usage:* /top_holders <token_mint_address> [limit]\n" +
                "*DESCRIPTION*: Shows the top token holders for a specific token.\n\n" +
                "*SYNOPSIS*: /top_holders <token_mint_address> [limit]\n" +
                "*ARGUMENTS*: <token_mint_address> The Solana token mint address to check holders for\n" +
                "*USER STORY*: \n" +
                "As a user, I want to analyze the top token holders for a specific token.\n" +
                "I want to be able to see the top holders for a specific token.\n\n" +
                "*EXAMPLES*: \n" +
                "/top_holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN\n" +
                "/top_holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 10\n" +
                "[limit] Optional limit for the number of top holders to display (default: 10)\n" +
                "Limit: 1-100"
                
                *OUTPUT*:

💰 Transfer Summary

👤 From: mmkyprqAN3ukTQF78ck8F9K5UfN8t9qQLet8RRVTcaC

📥 To: HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe

💸 Transfer Amount(SOL): 0.000002 SOL

🕒 Block Time: 13 hours ago

🔗 🔍 View on Solscan`,

        TOKENHOLDERANALYSIS_HELP: ` *Usage:* /holders <token_mint_address> [timeframe]

*DESCRIPTION*: Analyzes token holder and volume trends over time,
including correlation analysis.

*USER STORY*:
As a user, I want to analyze the token holder and volume trends over time,
including correlation analysis.

*SYNOPSIS*: /holders <token_mint_address> [timeframe]

*ARGUMENTS*: <token_mint_address> The Solana token mint address to analyze

[timeframe] Optional timeframe in YYYY/MM/DD format

Example: /holders 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 2025/03/26 2025/03/30

Output:

📊 Token Holder Analysis

Token: mmkyprqAN3ukTQF78ck8F9K5UfN8t9qQLet8RRVTcaC
Timeframe: 24h

Current Holders: 1500
Change in Holders: 100 (6.67%)

Top Holders:
1. mmkyprqAN3ukTQF78ck8F9K5UfN8t9qQLet8RRVTcaC
   Balance: 1000
   Percentage: 6.67%

2. HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe
   Balance: 500
   Percentage: 3.33%

Data as of 24 hours ago
                `,

        TOKEN_HOLDER: `📊 *Rank*: %index%

* Owner Name:* %ownerName%

* Address:* %ownerAddress%
* Token Balance:* %formattedBalance%

* Total % supply held:* %formattedSupply%

* Token balance* %formattedValue%`,

        WITHDRAWAL_MESSAGE: `💳 * Confirm Withdrawal Summary*

*🏧 Amount to Withdraw:* %amount%

*💲 Currency:* %currency%

*🚕 Fee Percentage:* %feePercentage%

*✅ Total Fee:* %totalFee%

*🏦 Transfer Method:* %transferMethod%

*🏦 Withdraw from Bank:* %bankName%

*📤 Withdrawer Account Number:* %accountNumber%

*⏳ ArrivalTime:* %arrivalTime%


* ⚠ Total amount to withdraw \\+ Fee/Charges Applied:*

* %toAmount% *


*Note*: Please ensure that the details are correct before proceeding with the withdrawal`,

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
        HOLDER_DISTRIBUTION_HELP: `📊 *Holder Distribution Command (/holder_distribution)*

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
        CHECK_WHALES_USAGE: "Usage: /checkwhales <mint_address> <min_amount> [<limit>]\n\nExample: /checkwhales 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 10000\n\nExample: /checkwhales 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN 10000 10",

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
        // RECENT_TRANSFERS_USAGE: "Usage: /transfers <token_mint_address>\n\nExample: /transfers 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        RECENT_TRANSFERS_USAGE: "Usage: /transfers wa_wallet_address [limit]\n\nExample: /transfers 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q\n\nExample: /transfers 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q 10",
        RECENT_TRANSFERS_HELP: `🔄 *Recent Transfers Command (/transfers)*

*DESCRIPTION*
Shows recent token transfers for a specific token.

*SYNOPSIS*
/transfers <wallet_address>

*ARGUMENTS*
<wallet_address>    The Solana wallet address to check transfers for

*USER STORY*:
As a user, I want to see recent token transfers for a specific token.

*EXAMPLES*
/transfers 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

*OUTPUT*
- Recent transfer list
- Transfer amounts
- Source and destination addresses
- Timestamps

*TROUBLESHOOTING*
- No recent transfers found
- Invalid token address
- Network connectivity issues
- Check the space between the commands

*SEE ALSO*
/whalealert, /checkwhales`,

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

        PROGRAMS_HELP: `📚 *Programs Explorer Commands*

*DESCRIPTION*
Explore and search through known Solana programs.

*COMMANDS*
/programs - List all programs
/programs <search_term> - Search programs by name, description, or labels
/program <program_id> - Get detailed information about a specific program

*EXAMPLES*
/programs
/programs gaming
/programs defi
/program SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6

*FEATURES*
- Paginated program listing
- Search by name, description, or labels
- Detailed program information
- Links to websites, Twitter, and IDL files
- Program categories and labels

*TROUBLESHOOTING*
- Program not found
- Invalid program ID
- Search returned no results`,

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
};