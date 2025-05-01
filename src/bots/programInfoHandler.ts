// src/bots/programInfoHandler.ts

import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import logger from "../config/logger";
import { Program } from "../interfaces/vybeApiInterface";
import { VybeApiService } from "../services/vybeAPI";
import { deleteDoubleSpace } from "../utils/utils";
import { RedisService } from "../services/redisService";
import { BOT_MESSAGES } from "../utils/messageTemplates";

export class ProgramInfoHandler extends BaseHandler {
    private programs: Program[] = [];
    private programCache: Map<string, Program> = new Map();
    private exploreCache: Map<string, Program[]> = new Map();
    private readonly CACHE_TTL = 1000 * 60 * 60 * 24; // 1 day in milliseconds
    private redisService: RedisService | null = null;

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
        this.initRedis();
    }

    private async initRedis() {
        try {
            this.redisService = await RedisService.getInstance();
            await this.loadPrograms();
            logger.info("Redis initialized for ProgramInfoHandler");
        } catch (error) {
            logger.error("Failed to initialize Redis:", error);
            // Fallback to in-memory cache
            this.programs = [];
            this.programCache.clear();
            this.exploreCache.clear();
        }
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
        if (ID === 'help') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.PROGRAM_INFO_HELP,
                { parse_mode: "Markdown" }
            );
        }

        try {
            // Check Redis cache first
            let program: Program | null = null;
            if (this.redisService) {
                program = await this.redisService.getProgramInfo(ID);
            }

            // If not in Redis, check in-memory cache
            if (!program) {
                const cachedProgram = this.programCache.get(ID);
                if (cachedProgram) {
                    program = cachedProgram;
                }
            }

            if (!program) {
                logger.info(`Cache miss for program ${ID}, fetching from API`);
                const programs = await this.api.getProgramInfoByIdOrName(ID);
                if (programs.length > 0) {
                    program = programs[0];

                    // Save to Redis if available
                    if (this.redisService) {
                        await this.redisService.setProgramInfo(ID, program);
                    }

                    // Also save to in-memory cache
                    this.programCache.set(ID, program);
                }
            } else {
                logger.info(`Cache hit for program ${ID}`);
            }

            if (!program) {
                return this.bot.sendMessage(chatId, "❌ Program not found. Please check the program ID and try again.");
            }
            const keyboard = {
                inline_keyboard: [
                    [
                        {
                            text: "🔝 View Programs Top Users",
                            callback_data: `view_top_users_${program.name}`
                        },
                        {
                            text: "🐋 View Program's Whale Users",
                            callback_data: `check_whale_users_${program.name}`
                        }
                    ],
                    [
                        {
                            text: "👀 Get Programs Users insight",
                            callback_data: `get_users_insights${program.name}`
                        },
                        {
                            text: "💨 View commands",
                            callback_data: `command`
                        },
                    ]
                ]
            };

            let message = this.formatProgramMessage(program);
            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                reply_markup: keyboard

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
        if (label === 'HELP') {
            return this.bot.sendMessage(chatId,
                BOT_MESSAGES.EXPLORE_HELP,
                { parse_mode: "Markdown" }
            );
        }
        try {
            // Check Redis cache first
            let programs: Program[] | null = null;
            if (this.redisService) {
                programs = await this.redisService.getCachedResponse(`explore:${label}`);
            }

            // If not in Redis, check in-memory cache
            if (!programs) {
                const cachedPrograms = this.exploreCache.get(label);
                if (cachedPrograms) {
                    programs = cachedPrograms;
                }
            }

            if (!programs) {
                logger.info(`Cache miss for explore label ${label}, fetching from API`);
                const apiResponse = await this.api.exploreProgram(label);

                if (!apiResponse || apiResponse[0]?.message === "Query returned no results") {
                    return this.bot.sendMessage(chatId, "❌ No programs found for the given label.");
                }

                programs = apiResponse;

                // Save to Redis if available
                if (this.redisService) {
                    await this.redisService.setCachedResponse(`explore:${label}`, programs, 7200); // 2 hours
                }

                // Also save to in-memory cache
                this.exploreCache.set(label, programs);
            } else {
                logger.info(`Cache hit for explore label ${label}`);
            }

            // Format and send messages for each program
            let message = "";
            let count = 0;
            for (const program of programs) {
                if (program.labels.includes(label)) {
                    if (program.name) {
                        if (count === 0) {
                            message += `*Programs found for ${label} label*\n\n`;
                            count++;
                        }
                        message += `⋆ ${program.name}\n`;
                    }
                }

            }
            message += "\nTo view more information about a program, use\n"
            message += "/program\\_info Bonkswap\n/program\\_info Monaco Protocol"
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
        message += `**Description:** ${program.programDescription}\n\n`;

        if (program.siteUrl) {
            message += `*Website:* ${program.siteUrl}\n`;
        }
        if (program.logoUrl) {
            message += `*Logo:* [Logo URL](${program.logoUrl})\n`;
        }
        if (program.twitterUrl) {
            message += `*Twitter:* [Twitter URL](${program.twitterUrl})\n`;
        }

        return message;
    }

} 