// src/bots/programActiveUsersHandler.ts

import TelegramBot from "node-telegram-bot-api";
import { BaseHandler } from "./baseHandler";
import { VybeApiService } from "../services/vybeAPI";
import { ProgramActiveUser } from "../interfaces/vybeApiInterface";
import logger from "../config/logger";
import { deleteDoubleSpace } from "../utils/utils";


export class ProgramActiveUsersHandler extends BaseHandler {
    private activeUsersCache: Map<string, { users: ProgramActiveUser[], timestamp: number }> = new Map();
    private readonly CACHE_TTL = 1000 * 60 * 30; // 30 minutes in milliseconds
    private minTransactionsForWhale = 200_000;

    // To store previous day's data for comparison
    private previousDayData: Map<string, { users: ProgramActiveUser[], timestamp: number }> = new Map();

    constructor(bot: TelegramBot, api: VybeApiService) {
        super(bot, api);
    }

    /**
     * Handles the /topusers command to display top active users for a program
     */
    async handleTopUsers(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId, "Usage: /topusers <program_id_or_name> [limit]");
        }

        const identifier = this.capitalizeTheFirstLetter(parts.slice(1).join(" ").trim());


        // Default limit logic
        const limit = parts.length > 2 ? parseInt(parts[2]) : 10;
        const safeLimit = isNaN(limit) || limit <= 0 ? 10 : limit;

        try {
            // Get program info first to resolve the identifier
            const programInfo = await this.api.getProgramInfoByIdOrName(identifier);
            if (!programInfo || programInfo.length === 0) {
                return this.bot.sendMessage(chatId, "❌ Program not found. Please check the program ID or name and try again.");
            }

            const programId = programInfo[0].programId;
            const activeUsers = await this.getActiveUsersWithCache(programId, safeLimit);

            if (!activeUsers || activeUsers.length === 0) {
                return this.bot.sendMessage(chatId, "❌ No active users found for this program.");
            }

            // Format message
            const message = this.formatTopUsersMessage(activeUsers, identifier);

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });
        } catch (error) {
            logger.error(`Error fetching top users for program ${identifier}:`, error);
            await this.bot.sendMessage(chatId, "❌ Error fetching program active users. Please check the program ID or name and try again.");
        }
    }

    /**
     * Handles the /usersinsights command to provide insights about program users
     */
    async handleUserInsights(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId, "Usage: /usersinsights <program_id_or_name>");
        }

        const identifier = this.capitalizeTheFirstLetter(parts.slice(1).join(" ").trim());

        try {
            // Get program info first to resolve the identifier
            const programInfo = await this.api.getProgramInfoByIdOrName(identifier);
            if (!programInfo || programInfo.length === 0) {
                return this.bot.sendMessage(chatId, "❌ Program not found. Please check the program ID or name and try again.");
            }

            const programId = programInfo[0].programId;
            const programName = this.capitalizeTheFirstLetter(programInfo[0].name);
            const activeUsers = await this.getActiveUsersWithCache(programId, 20);

            if (!activeUsers || activeUsers.length === 0) {
                return this.bot.sendMessage(chatId, "❌ No active users found for this program.");
            }

            // Calculate insights
            const totalTransactions = activeUsers.reduce((sum, user) => sum + user.transactions, 0);
            const averageTransactions = Math.round(totalTransactions / activeUsers.length);
            const maxTransactions = Math.max(...activeUsers.map(user => user.transactions));
            const minTransactions = Math.min(...activeUsers.map(user => user.transactions));

            // Check for whales (users with transactions > 100,000)
            const whales = activeUsers.filter(user => user.transactions > 100000);

            // Format message
            let message = `*📊 User Insights for ${programName}*\n\n`;
            message += `*Total Users Analyzed:* ${activeUsers.length}\n`;
            message += `*Total Transactions:* ${totalTransactions.toLocaleString()}\n`;
            message += `*Average Transactions:* ${averageTransactions.toLocaleString()}\n`;
            message += `*Transaction Range:* From ${minTransactions.toLocaleString()} to ${maxTransactions.toLocaleString()}\n\n`;

            if (whales.length > 0) {
                message += `*🐋 Whale Wallets (${whales.length}):*\n`;
                whales.slice(0, 5).forEach((whale, index) => {
                    message += `${index + 1}. \`${whale.wallet}\` — ${whale.transactions.toLocaleString()} txs\n`;
                });
                if (whales.length > 5) {
                    message += `_...and ${whales.length - 5} more_\n`;
                }
            }

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });
        } catch (error) {
            logger.error(`Error fetching user insights for program ${identifier}:`, error);
            await this.bot.sendMessage(chatId, "❌ Error analyzing program users. Please check the program ID or name and try again.");
        }
    }

    /**
     * Handles the /activitychange command to track changes in program activity
     */
    async handleActivityChange(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /activitychange <program_id_or_name>\n" +
                "Example: /activitychange 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8\n" +
                "Example: /activitychange Raydium Liquidity Pool V4"
            );
        }

        const identifier = this.capitalizeTheFirstLetter(parts.slice(1).join(" ").trim());
        try {
            // Get program info first to resolve the identifier
            const programInfo = await this.api.getProgramInfoByIdOrName(identifier);
            if (!programInfo || programInfo.length === 0) {
                return this.bot.sendMessage(chatId, "❌ Program not found. Please check the program ID or name and try again.");
            }

            const programId = programInfo[0].programId;
            // Get current data
            const currentData = await this.getActiveUsersWithCache(programId, 20);

            if (!currentData || currentData.length === 0) {
                return this.bot.sendMessage(chatId, "❌ No active users found for this program.");
            }

            // Check if we have previous data
            const previousData = this.previousDayData.get(programId)?.users;

            if (!previousData) {
                // Store current data for future comparison
                this.previousDayData.set(programId, {
                    users: currentData,
                    timestamp: Date.now()
                });

                return this.bot.sendMessage(
                    chatId,
                    "⏳ First time tracking this program. Activity changes will be available next time you run this command. Current data has been stored for comparison.",
                    { parse_mode: "Markdown" }
                );
            }

            // Calculate changes
            const changes = this.calculateActivityChanges(previousData, currentData);

            // Format message
            const message = this.formatActivityChangesMessage(changes, programInfo[0].name);

            // Update previous day data
            this.previousDayData.set(programId, {
                users: currentData,
                timestamp: Date.now()
            });

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });
        } catch (error) {
            logger.error(`Error tracking activity changes for program ${identifier}:`, error);
            await this.bot.sendMessage(chatId, "❌ Error tracking activity changes. Please check the program ID or name and try again.");
        }
    }



    /**
     * Handles the /checkwhaleusers command
     */
    async handleCheckWhaleUsers(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const parts = deleteDoubleSpace(msg.text?.split(" ") ?? []);

        if (parts.length < 2) {
            return this.bot.sendMessage(chatId,
                "Usage: /checkprogramwhaleusers <program_id_or_name> [min_transactions]\n" +
                "Example: /checkprogramwhaleusers 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 100000" +
                "Example: /checkprogramwhaleusers Raydium Liquidity Pool V4 100000"
            );
        }

        const identifier = this.capitalizeTheFirstLetter(parts.slice(1).join(" ").trim());

        // Default limit logic
        const limit = parts.length > 2 ? parseInt(parts[2]) : 10;
        const safeLimit = isNaN(limit) || limit <= 0 ? 10 : limit;


        try {
            // Get program info first to resolve the identifier
            const programInfo = await this.api.getProgramInfoByIdOrName(identifier);
            const programName = this.capitalizeTheFirstLetter(programInfo[0].name);
            if (!programInfo || programInfo.length === 0) {
                return this.bot.sendMessage(chatId, "❌ Program not found. Please check the program ID or name and try again.");
            }

            const programId = programInfo[0].programId;
            const activeUsers = await this.getActiveUsersWithCache(programId, safeLimit); // Get more data for whale analysis

            if (!activeUsers || activeUsers.length === 0) {
                return this.bot.sendMessage(chatId, "❌ No active users found for this program.");
            }

            // Filter whales
            const whales = activeUsers.filter(user => user.transactions >= this.minTransactionsForWhale);

            if (whales.length === 0) {
                return this.bot.sendMessage(
                    chatId,
                    `No whale users found with ≥ ${this.minTransactionsForWhale.toLocaleString()} transactions.`,
                    { parse_mode: "Markdown" }
                );
            }

            // Format message
            let message = `*🐋 Whale Users for *\n\`${programName}\`\n\n`;
            message += `*Threshold:* ≥ ${this.minTransactionsForWhale.toLocaleString()} transactions\n\n`;

            whales.forEach((whale, index) => {
                message += `${index + 1}. \`${whale.wallet}\`\n`;
                message += `   • *Transactions:* ${whale.transactions.toLocaleString()}\n`;
            });

            message += `\n_Total whale users: ${whales.length}_`;

            await this.bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });
        } catch (error) {
            logger.error(`Error checking whale users for program ${identifier}:`, error);
            await this.bot.sendMessage(chatId, "❌ Error checking whale users. Please check the program ID or name and try again.");
        }
    }

    /**
     * Helper method to get active users with caching
     */
    private async getActiveUsersWithCache(programId: string, limit: number = 10): Promise<ProgramActiveUser[]> {
        // Check cache first
        const cached = this.activeUsersCache.get(programId);
        const now = Date.now();

        if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
            logger.info(`Cache hit for active users of program ${programId}`);
            return cached.users;
        }

        logger.info(`Cache miss for active users of program ${programId}, fetching from API`);

        try {
            const activeUsers = await this.api.getProgramActiveUsers(programId, limit);
            // Update cache
            this.activeUsersCache.set(programId, {
                users: activeUsers.data,
                timestamp: now
            });

            // Set cache expiration
            setTimeout(() => {
                if (this.activeUsersCache.has(programId)) {
                    this.activeUsersCache.delete(programId);
                    logger.info(`Cache entry expired for program active users ${programId}`);
                }
            }, this.CACHE_TTL);

            return activeUsers.data;
        } catch (error) {
            logger.error(`Error fetching active users for program ${programId}:`, error);
            throw error;
        }
    }

    /**
     * Format top users message
     */
    private formatTopUsersMessage(users: ProgramActiveUser[], programName: string): string {
        let message = `*👑 Top Active Users of ${programName}*\n\n`;

        users.forEach((user, index) => {
            // Add whale emoji for users with > 100k transactions
            const whaleTag = user.transactions > this.minTransactionsForWhale ? "🐋 " : "";
            message += `${index + 1}. ${whaleTag} \`${user.wallet}\`\nTransactions: ${user.transactions.toLocaleString()}\n\n`;
        });

        message += `\n_Data retrieved at: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}_`;

        return message;
    }

    /**
     * Calculate changes between previous and current data
     */
    private calculateActivityChanges(previous: ProgramActiveUser[], current: ProgramActiveUser[]) {
        const changes = {
            newUsers: [] as ProgramActiveUser[],
            increasedActivity: [] as Array<{ user: ProgramActiveUser, increase: number, percentage: number }>,
            decreasedActivity: [] as Array<{ user: ProgramActiveUser, decrease: number, percentage: number }>,
            stableUsers: [] as ProgramActiveUser[],
        };

        // Create maps for easy lookup
        const previousMap = new Map<string, ProgramActiveUser>();
        previous.forEach(user => previousMap.set(user.wallet, user));

        // Check each current user
        current.forEach(user => {
            const previousUser = previousMap.get(user.wallet);

            if (!previousUser) {
                // New user
                changes.newUsers.push(user);
            } else {
                const txDifference = user.transactions - previousUser.transactions;
                const percentageChange = previousUser.transactions > 0
                    ? (txDifference / previousUser.transactions) * 100
                    : 100;

                if (txDifference > 0 && percentageChange > 5) {
                    // Significant increase (>5%)
                    changes.increasedActivity.push({
                        user,
                        increase: txDifference,
                        percentage: percentageChange
                    });
                } else if (txDifference < 0 && Math.abs(percentageChange) > 5) {
                    // Significant decrease (>5%)
                    changes.decreasedActivity.push({
                        user,
                        decrease: Math.abs(txDifference),
                        percentage: Math.abs(percentageChange)
                    });
                } else {
                    // Stable user (change within ±5%)
                    changes.stableUsers.push(user);
                }
            }
        });

        // Sort by change magnitude
        changes.increasedActivity.sort((a, b) => b.percentage - a.percentage);
        changes.decreasedActivity.sort((a, b) => b.percentage - a.percentage);

        return changes;
    }

    /**
     * Format activity changes message
     */
    private formatActivityChangesMessage(changes: any, programName: string): string {
        let message = `*📈 Activity Changes for ${programName}*\n\n`;

        // New users in top list
        if (changes.newUsers.length > 0) {
            message += `*🆕 New Users (${changes.newUsers.length}):*\n`;
            changes.newUsers.slice(0, 3).forEach((user: ProgramActiveUser, index: number) => {
                message += `${index + 1}. \`${user.wallet}\` — ${user.transactions.toLocaleString()} txs\n`;
            });
            if (changes.newUsers.length > 3) {
                message += `_...and ${changes.newUsers.length - 3} more_\n`;
            }
            message += '\n';
        }

        // Increased activity
        if (changes.increasedActivity.length > 0) {
            message += `*⬆️ Increased Activity (${changes.increasedActivity.length}):*\n`;
            changes.increasedActivity.slice(0, 3).forEach((item: any, index: number) => {
                message += `${index + 1}. \`${item.user.wallet}\` — +${Math.round(item.percentage)}% (${item.increase.toLocaleString()} txs)\n`;
            });
            if (changes.increasedActivity.length > 3) {
                message += `_...and ${changes.increasedActivity.length - 3} more_\n`;
            }
            message += '\n';
        }

        // Decreased activity
        if (changes.decreasedActivity.length > 0) {
            message += `*⬇️ Decreased Activity (${changes.decreasedActivity.length}):*\n`;
            changes.decreasedActivity.slice(0, 3).forEach((item: any, index: number) => {
                message += `${index + 1}. \`${item.user.wallet}\` — -${Math.round(item.percentage)}% (${item.decrease.toLocaleString()} txs)\n`;
            });
            if (changes.decreasedActivity.length > 3) {
                message += `_...and ${changes.decreasedActivity.length - 3} more_\n`;
            }
            message += '\n';
        }

        message += `_Data compared with previous tracking point_\n`;
        message += `_Updated at: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}_`;

        return message;
    }

    /**
     * Capitalizes the first letter of a string
     */
    private capitalizeTheFirstLetter(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}