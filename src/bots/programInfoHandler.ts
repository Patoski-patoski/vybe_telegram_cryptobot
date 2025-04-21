import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import logger from "../config/logger";
import { Program } from "../interfaces/vybeApiInterface";
import { VybeApiService } from "../services/vybeAPI";
import { deleteDoubleSpace } from "../utils/utils";

export class ProgramInfoHandler extends BaseHandler {
    private programs: Program[] = [];
    private programCache: Map<string, Program> = new Map();
    private exploreCache: Map<string, Program[]> = new Map();
    private readonly CACHE_TTL = 1000 * 60 * 60 * 24; // 1 day in milliseconds

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
        this.loadPrograms();
    }

    private async loadPrograms() {
        try {
            // Initialize with empty programs array
            this.programs = [];
            this.programCache.clear();
            this.exploreCache.clear();
            logger.info("Programs array and caches initialized");
        } catch (error) {
            logger.error("Error initializing programs:", error);
            this.programs = []; // Reset programs array on error
            this.programCache.clear();
            this.exploreCache.clear();
        }
    }

    async handleProgramInfo(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /programinfo <program_id_or_name>\n" +
                "Example: /programinfo 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8\n" +
                "Example: /programinfo Raydium Liquidity Pool V4");
        }
        const ID = parts.slice(1).join(" ").trim();

        try {
            // Check cache first
            let program = this.programCache.get(ID);

            if (!program) {
                logger.info(`Cache miss for program ${ID}, fetching from API`);
                const programs = await this.api.getProgramInfoByIdOrName(ID);
                if (programs.length > 0) {
                    program = programs[0];
                    this.programCache.set(ID, program);
                }

                // Set cache expiration
                setTimeout(() => {
                    this.programCache.delete(ID);
                    logger.info(`Cache entry expired for program ${ID}`);
                }, this.CACHE_TTL);

            } else {
                logger.info(`Cache hit for program ${ID}`);
            }

            if (!program) {
                return this.bot.sendMessage(chatId, "❌ Program not found. Please check the program ID and try again.");
            }

            let message = this.formatProgramMessage(program);

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
            });

        } catch (error) {
            logger.error(`Error fetching program info for ${ID}:`, error);
            await this.bot.sendMessage(chatId, "❌ Error fetching program information. Please check the program ID and try again.");
        }
    }

    async handleExploreProgram(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId, "Usage: /explore <label>\nExample: /explore DEX");
        }

        const label = parts[1].toUpperCase();
        try {
            // Check cache first
            let programs = this.exploreCache.get(label);

            if (!programs) {
                logger.info(`Cache miss for explore label ${label}, fetching from API`);
                const apiResponse = await this.api.exploreProgram(label);

                if (!apiResponse || apiResponse[0]?.message === "Query returned no results") {
                    return this.bot.sendMessage(chatId, "❌ No programs found for the given label.");
                }

                programs = apiResponse;
                this.exploreCache.set(label, programs);

                // Set cache expiration
                setTimeout(() => {
                    this.exploreCache.delete(label);
                    logger.info(`Explore cache entry expired for label ${label}`);
                }, this.CACHE_TTL);
            } else {
                logger.info(`Cache hit for explore label ${label}`);
            }

            // Format and send messages for each program
            let message = "*Programs found for label " + label + "*\n\n";
            for (const program of programs) {
                if (program.labels.includes(label)) {
                    if (program.name) {
                        message += `⋆ ${program.name}\n`;
                    }
                }
            }
            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
            });
        } catch (error) {
            logger.error(`Error exploring program for ${label}:`, error);
            await this.bot.sendMessage(chatId, "❌ Error exploring program. Please try again.");
        }
    }

    private formatProgramMessage(program: Program): string {
        let message = `*Program Name:* ${program.name}\n\n`;
        if (program.entityName) {
            message += `*Entity Name:* ${program.entityName}\n\n`;
        }
        message += `*Labels:* ${program.labels.join(", ")}\n\n`;
        message += `>💡 **Description:** ${program.programDescription}\n\n`;

        if (program.siteUrl) message += `*Website:* ${program.siteUrl}\n`;
        if (program.logoUrl) message += `*Logo:* [Logo URL](${program.logoUrl})\n`;
        if (program.twitterUrl) message += `*Twitter:* [Twitter URL](${program.twitterUrl})\n`;

        return message;
    }
} 