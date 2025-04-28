import { createClient, RedisClientType } from 'redis';
import {
    PriceAlert,
    WhaleAlertSettings,
    NftCollection,
    WalletAlertSettings,
    ProgramActiveUser
} from '../interfaces/vybeApiInterface';
import logger from '../config/logger';

export class RedisService {
    private client: RedisClientType;
    private static instance: RedisService;

    private constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.client.on('error', (err: any) => {
            logger.error('Redis Client Error:', err);
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
            logger.info('Connected to Redis');
        } catch (error) {
            logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    // Price Alerts
    async setPriceAlert(userId: number, alert: PriceAlert): Promise<void> {
        try {
            await this.client.hSet(`price_alerts:${userId}`, {
                tokenMint: alert.tokenMint,
                threshold: alert.threshold.toString(),
                isHigh: alert.isHigh.toString()
            });
        } catch (error) {
            logger.error('Failed to set price alert:', error);
            throw error;
        }
    }

    async getPriceAlerts(userId: number): Promise<PriceAlert[]> {
        try {
            const alerts = await this.client.hGetAll(`price_alerts:${userId}`);
            return Object.entries(alerts).map(([key, value]) => ({
                tokenMint: key,
                threshold: parseFloat(value.split(':')[0]),
                isHigh: value.split(':')[1] === 'true',
                userId
            }));
        } catch (error) {
            logger.error('Failed to get price alerts:', error);
            throw error;
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

    async getAllUserIds(): Promise<string[]> {
        try {
            // Get user IDs from multiple key patterns
            const [whaleAlertKeys, trackedWalletKeys] = await Promise.all([
                this.client.keys('whale_alerts:*'),
                this.client.keys('tracked_wallets:*')
            ]);

            // Combine, extract user IDs, and deduplicate
            const allKeys = [...whaleAlertKeys, ...trackedWalletKeys];
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
            await this.client.set(`program_info:${programId}`, JSON.stringify(programInfo), { EX: 86400 }); // Expire after 24 hours
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
    async setCachedResponse(key: string, data: any, ttl: number = 300): Promise<void> {
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