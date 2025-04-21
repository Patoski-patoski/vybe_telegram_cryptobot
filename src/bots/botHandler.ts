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

export class BotHandler {
    private readonly bot: TelegramBot;
    private readonly api: VybeApiService;

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

    constructor() {
        const config = getConfig();
        this.bot = new TelegramBot(config.bot.botToken, {});
        this.api = new VybeApiService();

        //Handler instances
        this.tokenHolderHandler = new TopTokenHandler(this.bot, this.api);
        this.recentTransferHandler = new RecentTransferHandler(this.bot, this.api);
        this.whaleWatcherHandler = new WhaleWatcherHandler(this.bot, this.api);
        this.tokenTimeSeriesHandler = new TokenTimeSeriesAnalysisHandler(this.bot, this.api);
        this.holderDistributionHandler = new HolderDistributionHandler(this.bot, this.api);
        this.tokenAnalysisHandler = new TokenAnalysisHandler(this.bot, this.api);
        this.walletTrackerHandler = new EnhancedWalletTrackerHandler(this.bot, this.api);
        this.programInfoHandler = new ProgramInfoHandler(this.bot, this.api);
        this.programActiveUsersHandler = new ProgramActiveUsersHandler(this.bot, this.api);

        // Setup commands
        this.setUpCommands();
    }

    getBot(): TelegramBot {
        return this.bot;
    }

    private setUpCommands() {
        const cmds = [
            { cmd: /\/start/, handler: this.handleStart.bind(this) },
            { cmd: /\/top_holders/, handler: this.tokenHolderHandler.handleTopToken.bind(this.tokenHolderHandler) },
            { cmd: /\/transfers/, handler: this.recentTransferHandler.handleTransfers.bind(this.recentTransferHandler) },

            // Whale commands
            { cmd: /\/whalealert/, handler: this.whaleWatcherHandler.handleSetWhaleAlert.bind(this.whaleWatcherHandler) },
            { cmd: /\/listwhalealerts/, handler: this.whaleWatcherHandler.handleListWhaleAlerts.bind(this.whaleWatcherHandler) },
            { cmd: /\/removewhalealert/, handler: this.whaleWatcherHandler.handleRemoveWhaleAlert.bind(this.whaleWatcherHandler) },
            { cmd: /\/checkwhales/, handler: this.whaleWatcherHandler.handleCheckWhales.bind(this.whaleWatcherHandler) },

            // Token Analysis commands
            { cmd: /\/analyze/, handler: this.tokenAnalysisHandler.handleTokenAnalysis.bind(this.tokenAnalysisHandler) },
            { cmd: /\/series/, handler: this.tokenTimeSeriesHandler.handleTokenTimeSeriesAnalysis.bind(this.tokenTimeSeriesHandler) },
            { cmd: /\/holder_distribution/, handler: this.holderDistributionHandler.handleHolderDistribution.bind(this.holderDistributionHandler) },

            // Wallet Tracker commands
            { cmd: /\/trackwallet/, handler: this.walletTrackerHandler.handleTrackWallet.bind(this.walletTrackerHandler) },
            { cmd: /\/listtrackedwallets/, handler: this.walletTrackerHandler.handleListTrackedWallets.bind(this.walletTrackerHandler) },
            { cmd: /\/removetrackedwallet/, handler: this.walletTrackerHandler.handleRemoveTrackedWallet.bind(this.walletTrackerHandler) },
            { cmd: /\/analyzewallet/, handler: this.walletTrackerHandler.handleWalletAnalysis.bind(this.walletTrackerHandler) },

            // Program Info commands
            { cmd: /\/programinfo/, handler: this.programInfoHandler.handleProgramInfo.bind(this.programInfoHandler) },
            { cmd: /\/explore/, handler: this.programInfoHandler.handleExploreProgram.bind(this.programInfoHandler) },

            // Program Active Users commands (New!)
            { cmd: /\/topusers/, handler: this.programActiveUsersHandler.handleTopUsers.bind(this.programActiveUsersHandler) },
            { cmd: /\/usersinsights/, handler: this.programActiveUsersHandler.handleUserInsights.bind(this.programActiveUsersHandler) },
            { cmd: /\/activitychange/, handler: this.programActiveUsersHandler.handleActivityChange.bind(this.programActiveUsersHandler) },
            { cmd: /\/checkwhaleusers/, handler: this.programActiveUsersHandler.handleCheckWhaleUsers.bind(this.programActiveUsersHandler) },
        ]

        cmds.forEach(({ cmd, handler }) => {
            this.bot.onText(cmd, handler);
        });

        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    }

    private async handleStart(msg: TelegramBot.Message) {
        const { chat: { id: chatId } } = msg;
        await this.bot.sendMessage(
            chatId,
            BOT_MESSAGES.WELCOME,
            { parse_mode: 'Markdown' }
        );
    }

    async handleCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
        const chatId = callbackQuery.message?.chat.id;
        const data = callbackQuery.data;

        let walletAddress = "";
        if (!chatId || !data) return;

        const isViewTransactions = data.startsWith("view_transactions");
        const isViewHoldings = data.startsWith("view_holdings");

        if (isViewTransactions) {
            walletAddress = data.replace("view_transactions_", '');
        } else if (isViewHoldings) {
            walletAddress = data.replace("view_holdings_", '');
        }

        if (isViewHoldings && walletAddress) {
            await this.walletTrackerHandler.handleViewHoldings(chatId, walletAddress);
        } else if (isViewTransactions && walletAddress) {
            await this.walletTrackerHandler.handleViewTransactions(chatId, walletAddress);
        }

        await this.bot.answerCallbackQuery(callbackQuery.id);
    }
}