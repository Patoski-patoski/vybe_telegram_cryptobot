// File: src/services/redisService.ts

import { createClient, RedisClientType } from 'redis';
import {
    PriceAlert,
    WhaleAlertSettings,
    NftCollection,
    WalletAlertSettings,
    ProgramActiveUser
} from '../interfaces/vybeApiInterface';
import logger from '../config/logger';
import config from '../config/config';

export class RedisService {
    private client: RedisClientType;
    private static instance: RedisService;
    public THREE_MIN = 180;  // 3 minutes in seconds
    public THIRTY_MIN = 1800
    public ONE_HOUR = 3600
    public TWO_HOUR = 7200
    public FIVE_HOUR = 18000
    public ONE_DAY = 86400 // 1 day in seconds

    public constructor() {

        const redisConfig = config.redis;
        if (!redisConfig) {
            throw new Error('Redis configuration is missing');
        }

        this.client = createClient({
            url: `redis://default:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}` || process.env.REDIS_URL,
            socket: {
                tls: redisConfig.tls,
                reconnectStrategy: (retries) => {

                    const delay = Math.min(
                        redisConfig.reconnectStrategy * Math.pow(2, retries),
                        30000 // Max 30 seconds
                    );
                    return delay
                },
            },
        });
        

        this.client.on('error', (err: any) => {
            logger.error('Redis Client Error:', err);
        });

        this.client.on('connect', () => {
            logger.info('Redis Client Connected');
        });

        this.client.on('reconnecting', () => {
            logger.info('Redis Client Reconnecting...');
        });
    }

    public static async getInstance(): Promise<RedisService> {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
            await RedisService.instance.connect();
        }
        return RedisService.instance;
    }

    private async connect() {
        try {
            await this.client.connect();
            logger.info(`Connected to Redis at ${config.redis.port}`);
        } catch (error) {
            logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    // NFT Wallet Management
    /**
     * Get registered NFT wallet addresses for a chat ID
     * @param chatId Telegram chat ID
     * @returns Array of registered wallet addresses
     */
    async getNFTWallets(chatId: number): Promise<string[]> {
        try {
            const key = `nft_wallets:${chatId}`;
            const walletsData = await this.client.get(key);
            return walletsData ? JSON.parse(walletsData) : [];
        } catch (error) {
            logger.error(`Failed to get NFT wallets for chat ID ${chatId} from Redis`, { error });
            return [];
        }
    }

    /**
     * Save NFT wallet addresses for a chat ID
     * @param chatId Telegram chat ID
     * @param wallets Array of wallet addresses
     */
    async saveNFTWallets(chatId: number, wallets: string[]): Promise<void> {
        try {
            const key = `nft_wallets:${chatId}`;
            await this.client.set(key, JSON.stringify(wallets));
        } catch (error) {
            logger.error(`Failed to save NFT wallets for chat ID ${chatId} to Redis`, { error });
            throw error;
        }
    }

    /**
     * Add a new NFT wallet address for a chat ID
     * @param chatId Telegram chat ID
     * @param walletAddress Wallet address to add
     * @returns Boolean indicating success
     */
    async addNFTWallet(chatId: number, walletAddress: string): Promise<boolean> {
        try {
            // Get existing wallets
            const existingWallets = await this.getNFTWallets(chatId);

            // Check if wallet already exists
            if (existingWallets.includes(walletAddress)) {
                return false;
            }

            // Add new wallet and save
            existingWallets.push(walletAddress);
            await this.saveNFTWallets(chatId, existingWallets);
            return true;
        } catch (error) {
            logger.error(`Failed to add NFT wallet ${walletAddress} for chat ID ${chatId}`, { error });
            throw error;
        }
    }

    /**
     * Remove an NFT wallet address for a chat ID
     * @param chatId Telegram chat ID
     * @param walletAddress Wallet address to remove
     * @returns Boolean indicating if a wallet was removed
     */
    async removeNFTWallet(chatId: number, walletAddress: string): Promise<boolean> {
        try {
            // Get existing wallets
            const existingWallets = await this.getNFTWallets(chatId);

            // Filter out the wallet to remove
            const updatedWallets = existingWallets.filter(w => w !== walletAddress);

            // Check if a wallet was removed
            if (existingWallets.length === updatedWallets.length) {
                return false;
            }

            // Save updated wallets
            await this.saveNFTWallets(chatId, updatedWallets);
            return true;
        } catch (error) {
            logger.error(`Failed to remove NFT wallet ${walletAddress} for chat ID ${chatId}`, { error });
            throw error;
        }
    }

    // Price Alerts
    async setPriceAlert(userId: number, alert: PriceAlert): Promise<void> {
        try {
            const alertKey = `${alert.tokenMint}`;
            const alertData = {
                tokenMint: alert.tokenMint,
                threshold: alert.threshold,
                isHigh: alert.isHigh,
                userId: alert.userId
            };
            await this.client.hSet(`price_alerts:${userId}`, alertKey, JSON.stringify(alertData));
        } catch (error) {
            logger.error('Failed to set price alert:', error);
            throw error;
        }
    }

    async getPriceAlerts(userId: number): Promise<PriceAlert[]> {
        try {
            const alertsData = await this.client.hGetAll(`price_alerts:${userId}`);
            if (!alertsData || Object.keys(alertsData).length === 0) {
                return [];
            }

            const alerts: PriceAlert[] = [];

            for (const [tokenMint, alertStr] of Object.entries(alertsData)) {
                try {
                    const parsedAlert = JSON.parse(alertStr);

                    // Ensure we have all required properties
                    if (parsedAlert.threshold === undefined) {
                        throw new Error(`Missing threshold in alert data for token ${tokenMint}`);
                    }

                    alerts.push({
                        tokenMint: parsedAlert.tokenMint || tokenMint, // Fallback to key if tokenMint is missing
                        threshold: parsedAlert.threshold,
                        isHigh: parsedAlert.isHigh,
                        userId: parsedAlert.userId || userId // Fall back to userId if missing
                    });
                } catch (e) {
                    logger.error(`Failed to parse price alert data for token ${tokenMint}:`, e);
                }
            }

            return alerts;
        } catch (error) {
            logger.error('Failed to get price alerts:', error);
            return [];
        }
    }
    async removePriceAlert(userId: number, tokenMint: string): Promise<void> {
        try {
            await this.client.hDel(`price_alerts:${userId}`, tokenMint);
        } catch (error) {
            logger.error('Failed to remove price alert:', error);
            throw error;
        }
    }

    // Whale Alerts
    async setWhaleAlert(chatId: number, alert: WhaleAlertSettings): Promise<void> {
        try {
            // Use tokenMint as the key for each alert
            const tokens = Array.isArray(alert.tokens) ? alert.tokens : [alert.tokens];

            for (const token of tokens) {
                const alertKey = `${token}`;
                await this.client.hSet(`whale_alerts:${chatId}`, alertKey, JSON.stringify({
                    minAmount: alert.minAmount.toString(),
                    tokens: JSON.stringify([token])
                }));
            }
        } catch (error) {
            logger.error('Failed to set whale alert:', error);
            throw error;
        }
    }

    async getWhaleAlerts(chatId: number): Promise<WhaleAlertSettings[]> {
        try {
            const alerts = await this.client.hGetAll(`whale_alerts:${chatId}`);
            if (!alerts || Object.keys(alerts).length === 0) {
                return [];
            }

            const whaleAlerts: WhaleAlertSettings[] = [];

            for (const [token, valueStr] of Object.entries(alerts)) {
                try {
                    const parsedValue = JSON.parse(valueStr);
                    whaleAlerts.push({
                        chatId,
                        minAmount: parseFloat(parsedValue.minAmount),
                        tokens: parsedValue.tokens ? JSON.parse(parsedValue.tokens) : [token]
                    });
                } catch (e) {
                    logger.error(`Failed to parse whale alert data for token ${token}:`, e);
                }
            }

            return whaleAlerts;
        } catch (error) {
            logger.error('Failed to get whale alerts:', error);
            return [];
        }
    }

    async removeWhaleAlert(chatId: number, tokenMint: string): Promise<void> {
        try {
            await this.client.hDel(`whale_alerts:${chatId}`, tokenMint);
        } catch (error) {
            logger.error('Failed to remove whale alert:', error);
            throw error;
        }
    }

    // NFT Portfolio Data
    async setNFTPortfolio(chatId: number, data: { walletAddress: string, collections: NftCollection[] }): Promise<void> {
        try {
            await this.client.hSet(`nft_portfolio:${chatId}`, {
                walletAddress: data.walletAddress,
                collections: JSON.stringify(data.collections)
            });
            await this.client.expire(`nft_portfolio:${chatId}`, 3600); // Expire after 1 hour
        } catch (error) {
            logger.error('Failed to set NFT portfolio:', error);
            throw error;
        }
    }

    async getNFTPortfolio(chatId: number): Promise<{ walletAddress: string, collections: NftCollection[] } | null> {
        try {
            const data = await this.client.hGetAll(`nft_portfolio:${chatId}`);
            if (!data || Object.keys(data).length === 0) return null;
            return {
                walletAddress: data.walletAddress,
                collections: JSON.parse(data.collections)
            };
        } catch (error) {
            logger.error('Failed to get NFT portfolio:', error);
            throw error;
        }
    }

    // Wallet Tracking
    async setTrackedWallet(chatId: number, walletAddress: string, settings: WalletAlertSettings): Promise<void> {
        try {
            await this.client.hSet(`tracked_wallets:${chatId}`, {
                [walletAddress]: JSON.stringify(settings)
            });
        } catch (error) {
            logger.error('Failed to set tracked wallet:', error);
            throw error;
        }
    }

    async getTrackedWallets(chatId: number): Promise<Map<string, WalletAlertSettings>> {
        try {
            const data = await this.client.hGetAll(`tracked_wallets:${chatId}`);
            const wallets = new Map();

            for (const [address, settingsStr] of Object.entries(data)) {
                const settings = JSON.parse(settingsStr);
                // Ensure lastBalances is properly reconstructed
                if (settings.lastBalances) {
                    settings.lastBalances = settings.lastBalances; // It will be converted to a Map in the caller
                }
                wallets.set(address, settings);
            }

            return wallets;
        } catch (error) {
            logger.error('Failed to get tracked wallets:', error);
            return new Map();
        }
    }

    async removeTrackedWallet(chatId: number, walletAddress: string): Promise<void> {
        try {
            await this.client.hDel(`tracked_wallets:${chatId}`, walletAddress);
        } catch (error) {
            logger.error('Failed to remove tracked wallet:', error);
            throw error;
        }
    }

    // In RedisService class

    // Store historical value with date
    async setHistoricalValueWithDate(walletAddress: string, dateKey: string, value: string) {
        const key = `wallet_history:${walletAddress}:${dateKey}`;
        await this.client.set(key, value);
        // Set expiry to 90 days
        await this.client.expire(key, 90 * 24 * 60 * 60);
    }

    // Get historical value by date
    async getHistoricalValueByDate(walletAddress: string, dateKey: string): Promise<string | null> {
        const key = `wallet_history:${walletAddress}:${dateKey}`;
        return this.client.get(key);
    }

    // Get all historical values for a wallet
    async getHistoricalValuesByWallet(walletAddress: string): Promise<Map<string, string>> {
        const keys = await this.client.keys(`wallet_history:${walletAddress}:*`);
        const result = new Map<string, string>();

        for (const key of keys) {
            const dateKey = key.split(':')[2]; // Extract date part from key
            const value = await this.client.get(key);
            if (value) {
                result.set(dateKey, value);
            }
        }

        return result;
    }

    async getAllUserIds(): Promise<string[]> {
        try {
            // Get user IDs from multiple key patterns
            const [whaleAlertKeys, trackedWalletKeys, nftWalletKeys] = await Promise.all([
                this.client.keys('whale_alerts:*'),
                this.client.keys('tracked_wallets:*'),
                this.client.keys('nft_wallets:*')
            ]);

            // Combine, extract user IDs, and deduplicate
            const allKeys = [...whaleAlertKeys, ...trackedWalletKeys, ...nftWalletKeys];
            const userIds = allKeys.map(key => key.split(':')[1]);
            return [...new Set(userIds)]; // Remove duplicates
        } catch (error) {
            logger.error('Failed to get all user IDs:', error);
            return [];
        }
    }

    // Historical Values
    async setHistoricalValues(chatId: number, walletAddress: string, values: Map<string, string>): Promise<void> {
        try {
            await this.client.hSet(`historical_values:${chatId}`, {
                [walletAddress]: JSON.stringify(Array.from(values.entries()))
            });
        } catch (error) {
            logger.error('Failed to set historical values:', error);
            throw error;
        }
    }

    async getHistoricalValues(chatId: number, walletAddress: string): Promise<Map<string, string>> {
        try {
            const data = await this.client.hGet(`historical_values:${chatId}`, walletAddress);
            if (!data) return new Map();
            return new Map(JSON.parse(data));
        } catch (error) {
            logger.error('Failed to get historical values:', error);
            throw error;
        }
    }

    // Program Info Cache
    async setProgramInfo(programId: string, programInfo: any): Promise<void> {
        try {
            await this.client.set(`program_info:${programId}`, JSON.stringify(programInfo), { EX: this.ONE_DAY }); // Expire after 24 hours
        } catch (error) {
            logger.error('Failed to set program info:', error);
            throw error;
        }
    }

    async getProgramInfo(programId: string): Promise<any | null> {
        try {
            const data = await this.client.get(`program_info:${programId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Failed to get program info:', error);
            throw error;
        }
    }

    // API Response Cache
    async setCachedResponse(key: string, data: any, ttl: number = this.THIRTY_MIN): Promise<void> {
        try {
            await this.client.set(`cache:${key}`, JSON.stringify(data), { EX: ttl });
        } catch (error) {
            logger.error('Failed to set cached response:', error);
            throw error;
        }
    }

    async getCachedResponse(key: string): Promise<any | null> {
        try {
            const data = await this.client.get(`cache:${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Failed to get cached response:', error);
            throw error;
        }
    }


    async setPreviousDayData(programId: string, users: ProgramActiveUser[]): Promise<void> {
        try {
            await this.client.set(`previous_day_data:${programId}`, JSON.stringify(users), { EX: 604800 }); // 7 days TTL
        } catch (error) {
            logger.error('Failed to set previous day data:', error);
            throw error;
        }
    }

    async getPreviousDayData(programId: string): Promise<ProgramActiveUser[] | null> {
        try {
            const data = await this.client.get(`previous_day_data:${programId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Failed to get previous day data:', error);
            return null;
        }
    }

    // Top Users Cache
    async setTopUsersCache(programId: string, users: any[]): Promise<void> {
        try {
            await this.client.set(`top_users:${programId}`, JSON.stringify(users), { EX: this.THREE_MIN });
        } catch (error) {
            logger.error('Failed to set top users cache:', error);
            throw error;
        }
    }

    async getTopUsersCache(programId: string): Promise<any[] | null> {
        try {
            const data = await this.client.get(`top_users:${programId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Failed to get top users cache:', error);
            return null;
        }
    }

    // Cleanup
    async cleanup(): Promise<void> {
        try {
            await this.client.quit();
        } catch (error) {
            logger.error('Failed to cleanup Redis connection:', error);
            throw error;
        }
    }
}