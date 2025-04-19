import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import logger from "../config/logger";
import { Program } from "../interfaces/vybeApiInterface";
import { VybeApiService } from "../services/vybeAPI";
export class ProgramInfoHandler extends BaseHandler {
    private programs: Program[] = [];

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
        this.loadPrograms();
    }

    private async loadPrograms() {
        try {
            // Initialize with empty programs array
            this.programs = [];
            logger.info("Programs array initialized");
        } catch (error) {
            logger.error("Error initializing programs:", error);
            this.programs = []; // Reset programs array on error
        }
    }

    async handleProgramInfo(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = msg.text?.split(" ") ?? [];

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId, "Usage: /programinfo <program_id>");
        }

        const programId = parts[1];
        try {
            console.log(programId);
            const programs = await this.api.getProgramInfo(programId);

            if (!programs.length) {
                await this.bot.sendMessage(chatId, "❌ No program found for that ID.");
                return;
            }

            for (const program of programs) {
                let message = `*${program.name}*\n\n`;
                message += `*Labels:* ${program.labels.join(", ")}\n`;
                message += `*Description:* ${program.programDescription}\n`;

                if (program.siteUrl) {
                    message += `*Website:* ${program.siteUrl}\n`;
                }

                if (program.logoUrl) {
                    message += `*Logo:* ${program.logoUrl}\n`;
                }

                const mainCategory = this.getMainCategory(program.labels);
                message += `*Category:* ${mainCategory}\n`;

                await this.bot.sendMessage(chatId, message, {
                    parse_mode: "Markdown",
                    disable_web_page_preview: true
                });
            }
        } catch (error) {
            logger.error(`Error fetching program info for ${programId}:`, error);
            await this.bot.sendMessage(chatId, "❌ Error fetching program information. Please check the program ID and try again.");
        }
    }

    private getMainCategory(labels: string[]): string {
        const categories = ["GAMING", "NFT", "DEFI", "INFRA", "ORACLE", "MARKETPLACE", "PERPS", "OPTIONS", "BORROW/LEND", "DePIN"];
        const foundCategory = labels.find(label => categories.includes(label));
        return foundCategory || "OTHER";
    }
} 