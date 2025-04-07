// src/bots/botHandler.ts
import TelegramBot from "node-telegram-bot-api";
import { getConfig } from "../config/config";
import { VybeApiService } from "../services/vybeAPI";
import { TopTokenHandler } from "./topHolderHandler";
import { RecentTransferHandler } from "./recentTransfersHandler";
import { BOT_MESSAGES } from "../utils/messageTemplates";

export class BotHandler {
    private readonly bot: TelegramBot;
    private readonly api: VybeApiService;

    // Handler instances
    private tokenHolderHandler: TopTokenHandler;
    private recentTransferHandler: RecentTransferHandler;

    constructor() {
        const config = getConfig();
        this.bot = new TelegramBot(config.bot.botToken, {});
        this.api = new VybeApiService();

        this.tokenHolderHandler = new TopTokenHandler(this.bot, this.api);
        this.recentTransferHandler = new RecentTransferHandler(this.bot, this.api);
        this.setUpCommands();
    }

    getBot(): TelegramBot {
        return this.bot;
    }

    private setUpCommands() {
        const cmds = [
            { cmd: /\/start/, handler: this.handleStart.bind(this) },
            { cmd: /\/holder/, handler: this.tokenHolderHandler.handleTopToken.bind(this.tokenHolderHandler) },
            { cmd: /\/transfers/, handler: this.recentTransferHandler.handleTransfers.bind(this.recentTransferHandler) },
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