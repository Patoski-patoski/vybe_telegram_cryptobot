// src/bots/botHandler.ts
import TelegramBot from "node-telegram-bot-api";
import { getConfig } from "../config/config";
import { VybeApiService } from "../services/vybeAPI";
import { TopTokenHandler } from "./topHolderHandler";
import { RecentTransferHandler } from "./recentTransfersHandler";
import { WhaleWatcherHandler } from "./whaleWatchHandler";
import { TokenHolderAnalysisHandler } from "./holderTimeSeries";
import { HolderDistributionHandler } from "./holderDistributionHandler";
import { TokenAnalysisHandler } from "./tokenAnalysisHandler";
import { BOT_MESSAGES } from "../utils/messageTemplates";

export class BotHandler {
    private readonly bot: TelegramBot;
    private readonly api: VybeApiService;

    // Handler instances
    private tokenHolderHandler: TopTokenHandler;
    private recentTransferHandler: RecentTransferHandler;
    private whaleWatcherHandler: WhaleWatcherHandler;
    private tokenHolderAnalysisHandler: TokenHolderAnalysisHandler;
    private holderDistributionHandler: HolderDistributionHandler;
    private tokenAnalysisHandler: TokenAnalysisHandler;

    constructor() {
        const config = getConfig();
        this.bot = new TelegramBot(config.bot.botToken, {});
        this.api = new VybeApiService();

        //Handler instances
        this.tokenHolderHandler = new TopTokenHandler(this.bot, this.api);
        this.recentTransferHandler = new RecentTransferHandler(this.bot, this.api);
        this.whaleWatcherHandler = new WhaleWatcherHandler(this.bot, this.api);
        this.tokenHolderAnalysisHandler = new TokenHolderAnalysisHandler(this.bot, this.api);
        this.holderDistributionHandler = new HolderDistributionHandler(this.bot, this.api);
        this.tokenAnalysisHandler = new TokenAnalysisHandler(this.bot, this.api);

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
            { cmd: /\/holders/, handler: this.tokenHolderAnalysisHandler.handleTokenAnalysis.bind(this.tokenHolderAnalysisHandler) },
            { cmd: /\/holder_distribution/, handler: this.holderDistributionHandler.handleHolderDistribution.bind(this.holderDistributionHandler) },
        ]

        cmds.forEach(({ cmd, handler }) => {
            this.bot.onText(cmd, handler);
        });
    }

    private async handleStart(msg: TelegramBot.Message) {
        const { chat: { id: chatId } } = msg;
        await this.bot.sendMessage(
            chatId,
            BOT_MESSAGES.WELCOME,
            { parse_mode: 'Markdown' }
        );
    }
}