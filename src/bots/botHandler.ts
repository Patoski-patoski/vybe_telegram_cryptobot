// src/bots/botHandler.ts
import TelegramBot from "node-telegram-bot-api";
import { getConfig } from "../config/config";
import { VybeApiService } from "../services/vybeAPI";
import { TopTokenHandler } from "./topHolderHandler";
import { RecentTransferHandler } from "./recentTransfersHandler";
import { WhaleWatcherHandler } from "./whaleWatchHandler";
import { TokenTimeSeriesAnalysisHandler } from "./tokenTimeSeriesAnalysis";
import { HolderDistributionHandler } from "./holderDistributionHandler";
import { TokenAnalysisHandler } from "./tokenAnalysisHandler";
import { EnhancedWalletTrackerHandler } from "./walletTrackerHandler";
import { BOT_MESSAGES } from "../utils/messageTemplates";
import { ProgramInfoHandler } from "./programInfoHandler";
import { ProgramActiveUsersHandler } from "./programActiveUsersHandler";
import { NFTPortfolioHandler } from "./nftPortfolioHandler";
import { PriceHandler } from "./priceHandler";
import { RedisService } from "../services/redisService";

export class BotHandler {
    private readonly bot: TelegramBot;
    private readonly api: VybeApiService;
    private readonly redisService: RedisService;

    // Handler instances
    private tokenHolderHandler: TopTokenHandler;
    private recentTransferHandler: RecentTransferHandler;
    private whaleWatcherHandler: WhaleWatcherHandler;
    private tokenTimeSeriesHandler: TokenTimeSeriesAnalysisHandler;
    private holderDistributionHandler: HolderDistributionHandler;
    private tokenAnalysisHandler: TokenAnalysisHandler;
    private walletTrackerHandler: EnhancedWalletTrackerHandler;
    private programInfoHandler: ProgramInfoHandler;
    private programActiveUsersHandler: ProgramActiveUsersHandler;
    private nftPortfolioHandler: NFTPortfolioHandler;
    private priceHandler: PriceHandler;


    constructor(redisService: any) { // Replace 'any' with your actual RedisService type
        const config = getConfig();
        this.bot = new TelegramBot(config.bot.botToken, {});
        this.api = new VybeApiService();
        this.redisService = redisService;
        this.api = new VybeApiService();

        // Handler instances
        this.tokenHolderHandler = new TopTokenHandler(this.bot, this.api);
        this.recentTransferHandler = new RecentTransferHandler(this.bot, this.api);
        this.whaleWatcherHandler = new WhaleWatcherHandler(this.bot, this.api);
        this.tokenTimeSeriesHandler = new TokenTimeSeriesAnalysisHandler(this.bot, this.api);
        this.holderDistributionHandler = new HolderDistributionHandler(this.bot, this.api);
        this.tokenAnalysisHandler = new TokenAnalysisHandler(this.bot, this.api);
        this.walletTrackerHandler = new EnhancedWalletTrackerHandler(this.bot, this.api);
        this.programInfoHandler = new ProgramInfoHandler(this.bot, this.api);
        this.programActiveUsersHandler = new ProgramActiveUsersHandler(this.bot, this.api);
        this.nftPortfolioHandler = new NFTPortfolioHandler(this.bot, this.api);
        this.priceHandler = new PriceHandler(this.bot, this.api);

        // Setup commands and callbacks
        this.setUpCommands();
        this.setupCallbackHandlers();

        // Set up periodic price alert checks
        setInterval(() => {
            this.priceHandler.checkPriceAlerts();
        }, 120_000); // Check every 2 minutes
    }

    /**
     * Returns the TelegramBot instance used by this BotHandler.
     * @returns {TelegramBot} The TelegramBot instance.
     */
    getBot(): TelegramBot {
        return this.bot;
    }

    /**
     * Sets up the bot commands and their respective handlers.
     * @private
     */
    private setUpCommands() {
        const cmds = [
            { cmd: /\/(start)/, handler: this.handleStart.bind(this) },
            { cmd: /\/(help|commands)/, handler: this.handleHelp.bind(this) },

            { cmd: /\/top_holders/, handler: this.tokenHolderHandler.handleTopToken.bind(this.tokenHolderHandler) },
            { cmd: /\/transfers/, handler: this.recentTransferHandler.handleTransfers.bind(this.recentTransferHandler) },

            // Whale commands
            { cmd: /\/set_whale_alert/, handler: this.whaleWatcherHandler.handleSetWhaleAlert.bind(this.whaleWatcherHandler) },
            { cmd: /\/list_whale_alerts/, handler: this.whaleWatcherHandler.handleListWhaleAlerts.bind(this.whaleWatcherHandler) },
            { cmd: /\/remove_whale_alert/, handler: this.whaleWatcherHandler.handleRemoveWhaleAlert.bind(this.whaleWatcherHandler) },
            { cmd: /\/check_whales/, handler: this.whaleWatcherHandler.handleCheckWhales.bind(this.whaleWatcherHandler) },

            // Token Analysis commands
            { cmd: /\/analyze_token/, handler: this.tokenAnalysisHandler.handleTokenAnalysis.bind(this.tokenAnalysisHandler) },
            { cmd: /\/series/, handler: this.tokenTimeSeriesHandler.handleTokenTimeSeriesAnalysis.bind(this.tokenTimeSeriesHandler) },
            { cmd: /\/holder_distribution/, handler: this.holderDistributionHandler.handleHolderDistribution.bind(this.holderDistributionHandler) },

            // Wallet Tracker commands
            { cmd: /\/track_wallet/, handler: this.walletTrackerHandler.handleTrackWallet.bind(this.walletTrackerHandler) },
            { cmd: /\/list_tracked_wallets/, handler: this.walletTrackerHandler.handleListTrackedWallets.bind(this.walletTrackerHandler) },
            { cmd: /\/remove_tracked_wallet/, handler: this.walletTrackerHandler.handleRemoveTrackedWallet.bind(this.walletTrackerHandler) },
            { cmd: /\/analyze_wallet/, handler: this.walletTrackerHandler.handleWalletAnalysis.bind(this.walletTrackerHandler) },

            // Program Info commands
            { cmd: /\/program_info/, handler: this.programInfoHandler.handleProgramInfo.bind(this.programInfoHandler) },
            { cmd: /\/explore/, handler: this.programInfoHandler.handleExploreProgram.bind(this.programInfoHandler) },

            // Program Active Users commands
            { cmd: /\/top_users/, handler: this.programActiveUsersHandler.handleTopUsers.bind(this.programActiveUsersHandler) },
            { cmd: /\/users_insights/, handler: this.programActiveUsersHandler.handleUserInsights.bind(this.programActiveUsersHandler) },
            { cmd: /\/activity_change/, handler: this.programActiveUsersHandler.handleActivityChange.bind(this.programActiveUsersHandler) },
            { cmd: /\/check_program_whale_users/, handler: this.programActiveUsersHandler.handleCheckWhaleUsers.bind(this.programActiveUsersHandler) },

            // NFT commands
            { cmd: /\/nft_portfolio/, handler: this.nftPortfolioHandler.handleNFTPortfolio.bind(this.nftPortfolioHandler) },
            { cmd: /\/register_nft_wallet/, handler: this.nftPortfolioHandler.handleRegisterNFTWallet.bind(this.nftPortfolioHandler) },
            { cmd: /\/list_nft_wallets/, handler: this.nftPortfolioHandler.handleListNFTWallets.bind(this.nftPortfolioHandler) },
            { cmd: /\/remove_nft_wallet/, handler: this.nftPortfolioHandler.handleRemoveNFTWallet.bind(this.nftPortfolioHandler) },

            // Price commands
            { cmd: /\/check_price/, handler: this.priceHandler.handlePriceCommand.bind(this.priceHandler) },
            { cmd: /\/set_price_alert/, handler: this.priceHandler.handlePriceAlertCommand.bind(this.priceHandler) },
            { cmd: /\/list_price_alert/, handler: this.priceHandler.handleListPriceAlertsCommand.bind(this.priceHandler) },
            { cmd: /\/remove_price_alert/, handler: this.priceHandler.handleRemovePriceAlertCommand.bind(this.priceHandler) },
        ];

        cmds.forEach(({ cmd, handler }) => {
            this.bot.onText(cmd, handler);
        });

        // Add catch-all handler for unknown commands
        this.bot.on('message', (msg) => {
            if (msg.text?.startsWith('/')) {
                // Check if the command matches any known command
                const isKnownCommand = cmds.some(({ cmd }) => cmd.test(msg.text!));

                if (!isKnownCommand) {
                    this.handleUnknownCommand(msg);
                }
            }
        });
    }

    /**
     * Handles unknown commands sent to the bot.
     *
     * @param msg Message object from Telegram
     */
    private async handleUnknownCommand(msg: TelegramBot.Message) {
        const { chat: { id: chatId }, from } = msg;
        const firstName = from?.username || from?.first_name || "User";

        await this.bot.sendMessage(
            chatId,
            BOT_MESSAGES.UNKNOWN_COMMAND.replace("{name}", firstName),
            { parse_mode: 'Markdown' }
        );
    }

    /**
     * Handles the /help command to provide a help message to the user.
     * @param msg - The Telegram message object containing chat and user information.
     */

    private async handleHelp(msg: TelegramBot.Message) {
        const { chat: { id: chatId }, from } = msg;
        await this.bot.sendMessage(
            chatId,
            BOT_MESSAGES.HELP,
            { parse_mode: 'Markdown' }
        );
    }

    /**
     * Handles the /start command to welcome a new or returning user.
     * @param msg - The Telegram message object containing chat and user information.
     */
    private async handleStart(msg: TelegramBot.Message) {
        const { chat: { id: chatId }, from } = msg;
        const firstName = from?.username || from?.first_name || "User";

        const keyboard = {
            inline_keyboard: [[{ text: "💨Commands", callback_data: `command` }]]
        };
        await this.bot.sendMessage(
            chatId,
            BOT_MESSAGES.WELCOME.replace("{name}", firstName),
            {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            }
        );
    }

    /**
     * Sets up a single callback handler to route all callbacks to appropriate handlers.
     * This function is called in the constructor of the BotHandler class.
     * Callbacks are handled by extracting the relevant data from the callback query and using a switch
     * statement to determine which handler to call.
     * Wallet-related callbacks are handled by the walletTrackerHandler.
     * NFT-related callbacks are handled by the nftPortfolioHandler.
     * Price chart callbacks are handled by the tokenAnalysisHandler.
     * Program active users callbacks are handled by the programActiveUsersHandler.
     * The help callback is handled by the handleHelp method of this class.
     * If any error occurs while handling a callback, the callback query is answered with an error message.
     * @remarks
     * The `callback_query` event is emitted when a user presses an inline keyboard button.
     * The `answerCallbackQuery` method is used to respond to the callback query.
     */// In setupCallbackHandlers method in botHandler.ts

    private setupCallbackHandlers() {
        // Single callback handler to route all callbacks to appropriate handlers
        this.bot.on('callback_query', async (callbackQuery) => {
            if (!callbackQuery.data || !callbackQuery.message) return;

            const chatId = callbackQuery.message.chat.id;
            const data = callbackQuery.data;
            const userId = callbackQuery.from.id;

            try {
                // Handle wallet-related callbacks
                if (data.startsWith("view_transactions_") || data.startsWith("view_holdings_")) {
                    let walletAddress = "";

                    if (data.startsWith("view_transactions_")) {
                        walletAddress = data.replace("view_transactions_", '');
                        await this.walletTrackerHandler.handleViewTransactions(chatId, walletAddress);
                    } else if (data.startsWith("view_holdings_")) {
                        walletAddress = data.replace("view_holdings_", '');
                        await this.walletTrackerHandler.handleViewHoldings(chatId, walletAddress);
                    }
                }
                // Handle NFT-related callbacks
                else if (data.startsWith("nft_collection_")) {
                    await this.nftPortfolioHandler.handleCollectionCallback(callbackQuery);
                }
                // Handle price chart callbacks
                else if (data.startsWith('price_chart_')) {
                    await this.tokenAnalysisHandler.handlePriceChartButton(callbackQuery);
                }
                // Handle remove alert callbacks
                else if (data.startsWith('remove_alert_')) {
                    const tokenMint = data.replace("remove_alert_", "");

                    try {
                        await this.redisService.removePriceAlert(userId, tokenMint);

                        // Update the message to indicate the alert has been removed
                        await this.bot.editMessageText(
                            `Alert for token ${tokenMint} has been removed.`,
                            {
                                chat_id: chatId,
                                message_id: callbackQuery.message.message_id
                            }
                        );

                        await this.bot.answerCallbackQuery(callbackQuery.id, {
                            text: "Price alert removed successfully."
                        });
                    } catch (error) {
                        console.error('Error removing price alert:', error);
                        await this.bot.answerCallbackQuery(callbackQuery.id, {
                            text: "Failed to remove price alert. Please try again."
                        });
                    }
                }

                if (data.startsWith("view_top_users_")) {
                    const programName = data.replace("view_top_users_", "");
                    const msg = {
                        chat: { id: callbackQuery.message?.chat.id },
                        text: `/topusers ${programName}`
                    } as TelegramBot.Message;

                    await this.programActiveUsersHandler.handleTopUsers(msg);

                } else if (data.startsWith("check_whale_users_")) {
                    const programName = data.replace("check_whale_users_", "");
                    const msg = {
                        chat: { id: callbackQuery.message?.chat.id },
                        text: `/check_program_whale_users ${programName}`
                    } as TelegramBot.Message;

                    await this.programActiveUsersHandler.handleCheckWhaleUsers(msg);

                } else if (data.startsWith("get_users_insights")) {
                    const programName = data.replace("get_users_insights", "");
                    const msg = {
                        chat: { id: callbackQuery.message?.chat.id },
                        text: `/users_insights ${programName}`
                    } as TelegramBot.Message;

                    await this.programActiveUsersHandler.handleUserInsights(msg);
                }

                if (data === "help" || data === 'command') {
                    const msg = {
                        chat: { id: callbackQuery.message?.chat.id },
                        text: "/help"
                    } as TelegramBot.Message;
                    await this.handleHelp(msg)
                }

                // Always answer the callback query
                await this.bot.answerCallbackQuery(callbackQuery.id);
            } catch (error) {
                console.error("Error handling callback query:", error);
                // Still answer the callback query even if an error occurs
                await this.bot.answerCallbackQuery(callbackQuery.id, {
                    text: "An error occurred. Please try again."
                });
            }
        });
    }
}