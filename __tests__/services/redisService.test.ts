
import { RedisService } from '../../src/services/redisService';
import { WalletAlertSettings } from '../../src/interfaces/vybeApiInterface';

const mockRedisClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    hSet: jest.fn().mockResolvedValue('OK'),
    hGet: jest.fn(),
    hGetAll: jest.fn(),
    hDel: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue(undefined),
    expire: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
};

// Mock the redis module
jest.mock('redis', () => ({
    createClient: jest.fn(() => mockRedisClient)
}));


describe('RedisService', () => {
    let redisService: RedisService;

    beforeEach(async () => {
        // Clear all mocks
        jest.clearAllMocks();

        // Get instance
        redisService = await RedisService.getInstance();
    });

    describe('NFT Wallet Management', () => {
        it('should add new NFT wallet', async () => {
            const chatId = 123;
            const walletAddress = 'test-wallet';

            mockRedisClient.get.mockResolvedValueOnce('[]');
            mockRedisClient.set.mockResolvedValueOnce('OK');

            const result = await redisService.addNFTWallet(chatId, walletAddress);
            expect(result).toBe(true);
            expect(mockRedisClient.get).toHaveBeenCalledWith(`nft_wallets:${chatId}`);
            expect(mockRedisClient.set).toHaveBeenCalledWith(
                `nft_wallets:${chatId}`,
                JSON.stringify([walletAddress])
            );

        });

        it('should not add duplicate NFT wallet', async () => {
            const chatId = 123;
            const walletAddress = 'existing-wallet';

            // Mock that the wallet already exists
            mockRedisClient.get.mockResolvedValueOnce(JSON.stringify([walletAddress]));

            const result = await redisService.addNFTWallet(chatId, walletAddress);

            expect(result).toBe(false);
            expect(mockRedisClient.get).toHaveBeenCalledWith(`nft_wallets:${chatId}`);
            // The set method should not be called since wallet already exists
            expect(mockRedisClient.set).not.toHaveBeenCalled();
        });
    });

    describe('Wallet Tracking', () => {
        it('should set tracked wallet', async () => {
            const chatId = 123;
            const walletAddress = 'test-wallet';
            const minValueUsd = 50;
         
            const settings: WalletAlertSettings = {
                walletAddress,
                chatId,
                minValueUsd,
                lastCheckedTime: Math.floor(Date.now() / 1000),
                lastBalances: new Map(),
                errorCount: 0
            };

            mockRedisClient.hSet.mockResolvedValueOnce('OK');

            await redisService.setTrackedWallet(chatId, walletAddress, settings);

            expect(mockRedisClient.hSet).toHaveBeenCalledWith(
                `tracked_wallets:${chatId}`,
                {
                    [walletAddress]: JSON.stringify(settings)
                }
            );
        });

        it('should handle error when setting tracked wallet', async () => {
            const chatId = 123;
            const walletAddress = 'test-wallet';
            const minValueUsd = 50;

            const settings: WalletAlertSettings = {
                walletAddress,
                chatId,
                minValueUsd,
                lastCheckedTime: Math.floor(Date.now() / 1000),
                lastBalances: new Map(),
                errorCount: 0
            };

            const error = new Error('Redis error');
            mockRedisClient.hSet.mockRejectedValueOnce(error);

            await expect(redisService.setTrackedWallet(chatId, walletAddress, settings))
                .rejects.toThrow('Redis error');
        });
    });

    describe('Program Info Cache', () => {
        it('should get program info from cache', async () => {
            const programId = 'test-program';
            const programInfo = { name: 'Test Program', description: 'This is a test program' };

            mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(programInfo));

            const result = await redisService.getProgramInfo(programId);

            expect(result).toEqual(programInfo);
            expect(mockRedisClient.get).toHaveBeenCalledWith(`program_info:${programId}`);
        });

        it('should return null when program info is not in cache', async () => {
            const programId = 'non-existent-program';

            mockRedisClient.get.mockResolvedValueOnce(null);

            const result = await redisService.getProgramInfo(programId);

            expect(result).toBeNull();
            expect(mockRedisClient.get).toHaveBeenCalledWith(`program_info:${programId}`);
        });

        it('should set program info in cache with expiration', async () => {
            const programId = 'test-program';
            const programInfo = { name: 'Test Program', description: 'This is a test program' };

            mockRedisClient.set.mockResolvedValueOnce('OK');

            await redisService.setProgramInfo(programId, programInfo);

            expect(mockRedisClient.set).toHaveBeenCalledWith(
                `program_info:${programId}`,
                JSON.stringify(programInfo),
                { EX: redisService.ONE_DAY }
            );
        });
    });

    describe('Previous Day Data', () => {
        it('should get previous day data', async () => {
            const programId = 'test-program';
            const users = [
                { wallet: 'user1', transactions: 10 },
                { wallet: 'user2', transactions: 5 }
            ];

            mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(users));

            const result = await redisService.getPreviousDayData(programId);

            expect(result).toEqual(users);
            expect(mockRedisClient.get).toHaveBeenCalledWith(`previous_day_data:${programId}`);
        });

        it('should return null when previous day data is not available', async () => {
            const programId = 'test-program';

            mockRedisClient.get.mockResolvedValueOnce(null);

            const result = await redisService.getPreviousDayData(programId);

            expect(result).toBeNull();
            expect(mockRedisClient.get).toHaveBeenCalledWith(`previous_day_data:${programId}`);
        });

        it('should handle error when getting previous day data', async () => {
            const programId = 'test-program';

            const error = new Error('Redis error');
            mockRedisClient.get.mockRejectedValueOnce(error);

            const result = await redisService.getPreviousDayData(programId);

            expect(result).toBeNull();
        });

        it('should set previous day data with TTL', async () => {
            const programId = 'test-program';
            const users = [
                {
                    wallet: 'user1',
                    transactions: 10, 
                    instructions: 3,
                    programId: "test-program"
                },
                {
                    wallet: 'user2',
                    transactions: 5, 
                    instructions: 7,
                    programId: "test-program"
                },
            ];

            mockRedisClient.set.mockResolvedValueOnce('OK');

            await redisService.setPreviousDayData(programId, users);

            expect(mockRedisClient.set).toHaveBeenCalledWith(
                `previous_day_data:${programId}`,
                JSON.stringify(users),
                { EX: 604800 } // 7 days TTL
            );
        });
    });
});