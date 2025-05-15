// __tests/bots/walletTrackerHa dler.test.ts

import TelegramBot from 'node-telegram-bot-api';
import { VybeApiService } from '../../src/services/vybeAPI';
import { RedisService } from '../../src/services/redisService';
import { WalletTrackerHandler } from '../../src/bots/walletTrackerHandler';
import { WalletAnalysisService } from '../../src/services/walletAnalysisService';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import logger from '../../src/config/logger';

// Mock all dependencies
jest.mock('node-telegram-bot-api');
jest.mock('../../src/services/vybeAPI');
jest.mock('../../src/services/redisService');
jest.mock('../../src/services/walletAnalysisService');
jest.mock('chartjs-node-canvas');
jest.mock('../../src/config/logger');
jest.mock('fs/promises');

describe('WalletTrackerHandler', () => {
  // Set up mocks
  let mockBot: jest.Mocked<TelegramBot>;
  let mockApi: jest.Mocked<VybeApiService>;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockWalletAnalysis: jest.Mocked<WalletAnalysisService>;
  let walletTracker: WalletTrackerHandler;

  // Constants for testing
  const TEST_WALLET_ADDRESS = 'testWalletAddress123';
  const TEST_CHAT_ID = 123456789;
  const TEST_MIN_VALUE_USD = 100;

  // Sample data for API responses
  const mockTokenBalanceResponse = {
      totalTokenValueUsd: '1000.00',
      date: 876134321,
      ownerAddress: "12rg3dx",
      stakedSolBalanceUsd: "987y",
      stakedSolBalance: "123",
      activeStakedSolBalanceUsd: "123",
      activeStakedSolBalance: "123",
      totalTokenValueUsd1dChange: "123",
      totalTokenCount: 123,
    data: [
      {
            ownerAddress: "4cygw9",
            symbol: "symbol",
            name: "paul",
            mintAddress: "mint3",
            amount: "113",
            priceUsd: "113",
            priceUsd1dChange: "12",
            priceUsd7dTrend: ["12", "13", "14"],
            valueUsd: "113",
            valueUsd1dChange: "1",
            logoUrl: "http://logourl.png",
            category: "DEX",
            decimals: 13.3,
            verified: true,
            slot: 234
      },
      {
          ownerAddress: "4cygw9",
          symbol: "symbol",
          name: "paul",
          mintAddress: "mint3",
          amount: "113",
          priceUsd: "113",
          priceUsd1dChange: "12",
          priceUsd7dTrend: ["12", "13", "14"],
          valueUsd: "113",
          valueUsd1dChange: "1",
          logoUrl: "http://logourl.png",
          category: "DEX",
          decimals: 13.3,
          verified: true,
          slot: 234
      },
      {
          ownerAddress: "4cygw9",
          symbol: "symbol",
          name: "paul",
          mintAddress: "mint3",
          amount: "113",
          priceUsd: "113",
          priceUsd1dChange: "12",
          priceUsd7dTrend: ["12", "13", "14"],
          valueUsd: "113",
          valueUsd1dChange: "1",
          logoUrl: "http://logourl.png",
          category: "DEX",
          decimals: 13.3,
          verified: true,
          slot: 234
      }
    ]
  };

  const topHolders = {
      rank: 1,
      ownerAddress: "98bvyw89",
      ownerName: "Pato",
      ownerLogoUrl: "http://ownerlogurl.png",
      tokenMint: "18786yuui",
      tokenSymbol: "JEST",     
      tokenLogoUrl: "0n9jcd",
      balance: "9817898",
      valueUsd: "123",
      percentageOfSupplyHeld: 12
  }

    const metaData = {
        callingInstructions: [12, 45, 6],
        ixName: "0987yu",
        callingProgram: "POP",
        programName: "Sunny Protocol",
    }

  const mockRecentTransfer = {
      signature: "8765634565778",
      callingMetadata: [metaData],
      senderTokenAccount: "senderTokenAccount",
      senderAddress: "senderAddress",
      receiverTokenAccount: "receiverTokenAccount",
      receiverAddress: "receiverAddress",
      mintAddress: "mintAddress",
      feePayer: "feePayer",
      decimal: 12.3,
      amount: 12000,
      slot: 11111111113,
      blockTime: 678789101,
      price: "122222",
      calculatedAmount: "1444444",
      valueUsd: "12222",
      tokenSymbol: "JEST",
      walletAddress: "walletAddress"
  };

  const mockTopTokenHolder = {
    data: [topHolders]
    };

    const walletPNL = {
        totalPnL: 3750.25,
        realizedPnL: 2150.75,
        unrealizedPnL: 1599.50,
        winRate: 0.65,  // 65% win rate
        tradeCount: 45,
        averageTradeSize: 750.50,
        bestPerformingToken: {
            tokenAddress: "So11111111111111111111111111111111111111112",
            tokenSymbol: "SOL",
            pnlUsd: 1250.75,
            pnlPercentage: 25.5
        },
        worstPerformingToken: {
            tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            tokenSymbol: "USDC",
            pnlUsd: -450.25,
            pnlPercentage: -15.3
        },
        pnlTrend: [
            { date: "1746234000", pnl: 3250},
            { date: "1746234000", pnl: 3250},
            { date: "1746234000", pnl: 3250},
            { date: "1746234000", pnl: 3250},
        ],
        tokenMetrics: [
            {
                tokenAddress: "So11111111111111111111111111111111111111112",
                tokenSymbol: "SOL",
                buysTransactionCount: 15,
                buysTokenAmount: 100.5,
                buysVolumeUsd: 2500.75,
                sellsTransactionCount: 8,
                sellsTokenAmount: 45.3,
                sellsVolumeUsd: 1200.25,
                realizedPnlUsd: 350.50,
                unrealizedPnlUsd: 725.80
            }
        ]
    };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize mocks
    mockBot = new TelegramBot('') as jest.Mocked<TelegramBot>;
    mockApi = new VybeApiService() as jest.Mocked<VybeApiService>;
    mockRedisService = new RedisService() as jest.Mocked<RedisService>;
    mockWalletAnalysis = new WalletAnalysisService(mockApi) as jest.Mocked<WalletAnalysisService>;

    // Mock RedisService.getInstance to return our mock
    (RedisService.getInstance as jest.Mock).mockResolvedValue(mockRedisService);

    // Mock specific API responses
    mockApi.getTokenBalance.mockResolvedValue(mockTokenBalanceResponse);
    mockApi.getWalletRecentTransfers.mockResolvedValue({
      transfers: [mockRecentTransfer]
    });
    mockApi.getTopTokenHolder.mockResolvedValue(mockTopTokenHolder);

    // Mock wallet analysis responses
    mockWalletAnalysis.analyzeWalletCategory.mockResolvedValue({
        type: 'NFT',
        protocols: ['protocol1', 'protocol2'],
        confidence: 12,
        lastUpdated: 19288092,
    });
      mockWalletAnalysis.calculatePnL.mockResolvedValue(walletPNL);

    // Mock ChartJSNodeCanvas
    (ChartJSNodeCanvas as jest.Mock).mockImplementation(() => ({
      renderToBuffer: jest.fn().mockResolvedValue(Buffer.from('mock chart data'))
    }));

    // Setup intervals to be immediately cleared
    jest.useFakeTimers();
    jest.spyOn(global, 'setInterval').mockImplementation((fn: any) => {
      return { unref: jest.fn() } as unknown as NodeJS.Timeout;
    });

    walletTracker = new WalletTrackerHandler(mockBot, mockApi, 10000);
    
    // Manually inject mocked services where needed
    (walletTracker as any).walletAnalysis = mockWalletAnalysis;
    (walletTracker as any).redisService = mockRedisService;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with Redis service', async () => {
      expect(RedisService.getInstance).toHaveBeenCalled();
      expect((walletTracker as any).redisService).toBeDefined();
    });

    it('should handle Redis initialization failure gracefully', async () => {
      // Make Redis initialization fail
      (RedisService.getInstance as jest.Mock).mockRejectedValueOnce(new Error('Redis connection failed'));
      
      // Create new instance
      const handler = new WalletTrackerHandler(mockBot, mockApi);
      
      // Check it initialized with empty maps
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to initialize Redis'), expect.any(Error));
      expect((handler as any).alerts).toEqual(new Map());
      expect((handler as any).historicalValues).toEqual(new Map());
    });
  });

  describe('handleTrackWallet', () => {
    beforeEach(() => {
      // Mock isValidWalletAddress to return true for test wallet
      jest.mock('../../src/utils/utils', () => ({
        isValidWalletAddress: jest.fn().mockReturnValue(true),
        deleteDoubleSpace: jest.fn((arr) => arr),
        formatUsdValue: jest.fn((val) => `$${val}`)
      }));
    });

    it('should respond with help message when help is requested', async () => {
      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: '/track_wallet help'
      } as TelegramBot.Message;

      await walletTracker.handleTrackWallet(msg);
      
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('TRACK_WALLET_HELP'),
        expect.any(Object)
      );
    });

    it('should respond with usage info when parameters are missing', async () => {
      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: '/track_wallet'
      } as TelegramBot.Message;

      await walletTracker.handleTrackWallet(msg);
      
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Usage:'));
    });

    it('should set up tracking for a valid wallet address', async () => {
      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: `/track_wallet ${TEST_WALLET_ADDRESS} ${TEST_MIN_VALUE_USD}`
      } as TelegramBot.Message;

      // Setup utility functions
      const utils = require('../../src/utils/utils');
      utils.isValidWalletAddress = jest.fn().mockReturnValue(true);
      utils.deleteDoubleSpace = jest.fn((arr) => arr.filter(Boolean));
      
      await walletTracker.handleTrackWallet(msg);
      
      // Verify the correct API calls were made
      expect(mockApi.getTokenBalance).toHaveBeenCalledWith(TEST_WALLET_ADDRESS);
      expect(mockApi.getWalletRecentTransfers).toHaveBeenCalled();
      
      // Verify the wallet was saved
      expect(mockRedisService.setTrackedWallet).toHaveBeenCalled();
      
      // Verify a success message was sent
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Successfully set up tracking'),
        expect.any(Object)
      );
    });

    it('should update existing tracking settings if wallet is already tracked', async () => {
      // Setup mock to simulate wallet already being tracked
      (walletTracker as any).alerts = new Map([
        [TEST_WALLET_ADDRESS, new Map([
          [TEST_CHAT_ID, {
            walletAddress: TEST_WALLET_ADDRESS,
            chatId: TEST_CHAT_ID,
            minValueUsd: 50, // Old value
            lastCheckedTime: Math.floor(Date.now() / 1000) - 3600
          }]
        ])]
      ]);

      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: `/track_wallet ${TEST_WALLET_ADDRESS} ${TEST_MIN_VALUE_USD}`
      } as TelegramBot.Message;

      // Setup utility functions
      const utils = require('../../src/utils/utils');
      utils.isValidWalletAddress = jest.fn().mockReturnValue(true);
      utils.deleteDoubleSpace = jest.fn((arr) => arr.filter(Boolean));
      
      await walletTracker.handleTrackWallet(msg);
      
      // Verify redis was updated
      expect(mockRedisService.setTrackedWallet).toHaveBeenCalled();
      
      // Verify the update message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Updated tracking settings'),
        expect.any(Object)
      );
      
      // Verify the min value was updated
      const userAlerts = (walletTracker as any).alerts.get(TEST_WALLET_ADDRESS);
      const settings = userAlerts.get(TEST_CHAT_ID);
      expect(settings.minValueUsd).toBe(TEST_MIN_VALUE_USD);
    });

    it('should enforce wallet limit per user', async () => {
      // Setup mock to simulate user already tracking max wallets
      const mockAlerts = new Map();
      for (let i = 0; i < 5; i++) { // MAX_WALLETS_PER_USER = 5
        const address = `wallet${i}`;
        mockAlerts.set(address, new Map([[TEST_CHAT_ID, {}]]));
      }
      (walletTracker as any).alerts = mockAlerts;

      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: `/track_wallet new_wallet 100`
      } as TelegramBot.Message;

      // Setup utility functions
      const utils = require('../../src/utils/utils');
      utils.isValidWalletAddress = jest.fn().mockReturnValue(true);
      utils.deleteDoubleSpace = jest.fn((arr) => arr.filter(Boolean));
      
      await walletTracker.handleTrackWallet(msg);
      
      // Verify the limit message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining("maximum limit"));
    });
  });

  describe('handleListTrackedWallets', () => {
    it('should display tracked wallets from Redis', async () => {
      // Mock Redis returning tracked wallets
      const trackedWallets = new Map([
          [TEST_WALLET_ADDRESS, {
              walletAddress: TEST_WALLET_ADDRESS,
              chatId: TEST_CHAT_ID,
              minValueUsd: TEST_MIN_VALUE_USD,
              lastCheckedTime: 1234567,
              lastBalances: new Map([['key', 'value']])
          }]
      ]);
      mockRedisService.getTrackedWallets.mockResolvedValue(trackedWallets);

      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: '/list_tracked_wallets'
      } as TelegramBot.Message;

      await walletTracker.handleListTrackedWallets(msg);
      
      // Verify Redis was queried
      expect(mockRedisService.getTrackedWallets).toHaveBeenCalledWith(TEST_CHAT_ID);
      
      // Verify wallet list was sent
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Your Tracked Wallets'),
        expect.any(Object)
      );
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining(TEST_WALLET_ADDRESS),
        expect.any(Object)
      );
    });

    it('should display message when no wallets are tracked', async () => {
      // Mock Redis returning no wallets
      mockRedisService.getTrackedWallets.mockResolvedValue(new Map());
      
      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: '/list_tracked_wallets'
      } as TelegramBot.Message;

      await walletTracker.handleListTrackedWallets(msg);
      
      // Verify appropriate message was sent
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        "You don't have any tracked wallets.");
    });
  });

  describe('handleRemoveTrackedWallet', () => {
    it('should remove a tracked wallet', async () => {
      // Setup mock to simulate wallet being tracked
      (walletTracker as any).alerts = new Map([
        [TEST_WALLET_ADDRESS, new Map([
          [TEST_CHAT_ID, {
            walletAddress: TEST_WALLET_ADDRESS,
            chatId: TEST_CHAT_ID,
            minValueUsd: TEST_MIN_VALUE_USD
          }]
        ])]
      ]);

      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: `/remove_tracked_wallet ${TEST_WALLET_ADDRESS}`
      } as TelegramBot.Message;

      // Setup utility function
      const utils = require('../../src/utils/utils');
      utils.deleteDoubleSpace = jest.fn((arr) => arr.filter(Boolean));
      
      await walletTracker.handleRemoveTrackedWallet(msg);
      
      // Verify Redis was updated
      expect(mockRedisService.removeTrackedWallet).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        TEST_WALLET_ADDRESS
      );
      
      // Verify success message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Removed tracking'),
        expect.any(Object)
      );
      
      // Verify wallet was removed from alerts
      const userAlerts = (walletTracker as any).alerts.get(TEST_WALLET_ADDRESS);
      expect(userAlerts.has(TEST_CHAT_ID)).toBe(false);
    });

    it('should handle removing a non-existent wallet', async () => {
      // Setup mock with empty alerts
      (walletTracker as any).alerts = new Map();

      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: `/remove_tracked_wallet ${TEST_WALLET_ADDRESS}`
      } as TelegramBot.Message;

      // Setup utility function
      const utils = require('../../src/utils/utils');
      utils.deleteDoubleSpace = jest.fn((arr) => arr.filter(Boolean));
      
      await walletTracker.handleRemoveTrackedWallet(msg);
      
      // Verify error message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('No active tracking found'));
    });
  });

  describe('handleWalletAnalysis', () => {
    it('should analyze a wallet and send detailed reports', async () => {
      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: `/analyze_Wallet ${TEST_WALLET_ADDRESS}`
      } as TelegramBot.Message;

      // Setup utility functions
      const utils = require('../../src/utils/utils');
      utils.isValidWalletAddress = jest.fn().mockReturnValue(true);
      utils.deleteDoubleSpace = jest.fn((arr) => arr.filter(Boolean));
      
      // Mock loading message
      mockBot.sendMessage.mockResolvedValueOnce({
        message_id: 123
      } as TelegramBot.Message);
      
      await walletTracker.handleWalletAnalysis(msg);
      
      // Verify loading message was deleted
      expect(mockBot.deleteMessage).toHaveBeenCalledWith(TEST_CHAT_ID, 123);
      
      // Verify API calls
      expect(mockApi.getTokenBalance).toHaveBeenCalledWith(TEST_WALLET_ADDRESS);
      expect(mockWalletAnalysis.calculatePnL).toHaveBeenCalledWith(TEST_WALLET_ADDRESS);
      expect(mockWalletAnalysis.analyzeWalletCategory).toHaveBeenCalledWith(TEST_WALLET_ADDRESS);
      expect(mockApi.getWalletRecentTransfers).toHaveBeenCalled();
      
      // Verify token analysis message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Token Analysis Report'),
        expect.any(Object)
      );
      
      // Verify transfers were sent
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Showing'),
        expect.any(Object)
      );
    });

    it('should handle invalid wallet address', async () => {
      const msg = {
        chat: { id: TEST_CHAT_ID },
        text: `/analyze_Wallet invalid_address`
      } as TelegramBot.Message;

      // Setup utility functions
      const utils = require('../../src/utils/utils');
      utils.isValidWalletAddress = jest.fn().mockReturnValue(false);
      utils.deleteDoubleSpace = jest.fn((arr) => arr.filter(Boolean));
      
      await walletTracker.handleWalletAnalysis(msg);
      
      // Verify error message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Invalid wallet address'));
    });
  });

  describe('Wallet Checking', () => {
    it('should check wallet balances on interval', () => {
      // Directly call the private method
      (walletTracker as any).checkWalletBalances();
      
      // Verify it logs properly
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Starting wallet check cycle'));
    });

    it('should process token list changes', async () => {
      // Setup a wallet with old token list
      const settings = {
        walletAddress: TEST_WALLET_ADDRESS,
        chatId: TEST_CHAT_ID,
        minValueUsd: TEST_MIN_VALUE_USD,
        lastTokenList: ['TOKEN1', 'TOKEN4'], // Different from current
        lastBalances: new Map()
      };
      
      // Call the private method
      await (walletTracker as any).processTokenListChanges(
        TEST_WALLET_ADDRESS,
        settings,
        mockTokenBalanceResponse
      );
      
      // Verify message about token changes
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Token list changed'),
        expect.any(Object)
      );
      
      // Verify list was updated
      expect(settings.lastTokenList).toEqual(['TOKEN1', 'TOKEN2', 'TOKEN3']);
    });

    it('should process wallet value changes and send alerts', async () => {
      // Setup a wallet with value below threshold
      const settings = {
        walletAddress: TEST_WALLET_ADDRESS,
        chatId: TEST_CHAT_ID,
        minValueUsd: 900, // Less than mock value (1000)
        lastTotalValue: 800, // Previous value
        lastBalances: new Map()
      };
      
      // Mock the alert sending
      const sendAlertSpy = jest.spyOn(walletTracker as any, 'sendWalletAlert')
        .mockImplementation(() => Promise.resolve());
      
      // Call the private method
      await (walletTracker as any).processWalletValueChanges(
        TEST_WALLET_ADDRESS,
        settings,
        mockTokenBalanceResponse
      );
      
      // Verify threshold crossing alert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('risen above your set threshold'),
        expect.any(Object)
      );
      
      // Verify percentage change alert (25% change)
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('increased by'),
        expect.any(Object)
      );
      
      // Verify full alert was sent
      expect(sendAlertSpy).toHaveBeenCalledWith(settings, mockTokenBalanceResponse);
      
      // Verify value was updated
      expect(settings.lastTotalValue).toBe(1000);
    });
  });

  describe('handleViewTransactions', () => {
    it('should display recent transactions', async () => {
      await walletTracker.handleViewTransactions(TEST_CHAT_ID, TEST_WALLET_ADDRESS);
      
      // Verify API calls
      expect(mockApi.getWalletRecentTransfers).toHaveBeenCalledWith(
        expect.objectContaining({ senderAddress: TEST_WALLET_ADDRESS, limit: 3 })
      );
      expect(mockApi.getWalletRecentTransfers).toHaveBeenCalledWith(
        expect.objectContaining({ receiverAddress: TEST_WALLET_ADDRESS, limit: 3 })
      );
      
      // Verify message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Recent Transfer Summary'),
        expect.any(Object)
      );
    });
  });

  describe('handleViewHoldings', () => {
    it('should display wallet holdings', async () => {
      await walletTracker.handleViewHoldings(TEST_CHAT_ID, TEST_WALLET_ADDRESS);
      
      // Verify API call
      expect(mockApi.getTokenBalance).toHaveBeenCalledWith(TEST_WALLET_ADDRESS);
      
      // Verify PnL calculation
      expect(mockWalletAnalysis.calculatePnL).toHaveBeenCalledWith(TEST_WALLET_ADDRESS);
      
      // Verify message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('Top Holdings'),
        expect.any(Object)
      );
    });

    it('should handle wallet with no tokens', async () => {
      // Mock empty token list
      mockApi.getTokenBalance.mockResolvedValueOnce({
          totalTokenValueUsd: '0',
          ownerAddress: "string",
          stakedSolBalanceUsd: "string",
          stakedSolBalance: "string",
          activeStakedSolBalanceUsd: "string",
          activeStakedSolBalance: "string",
          totalTokenValueUsd1dChange: "string",
          totalTokenCount: 1,
          date: 978675342,
        data: []
      });
      
      await walletTracker.handleViewHoldings(TEST_CHAT_ID, TEST_WALLET_ADDRESS);
      
      // Verify error message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.stringContaining('No tokens found'));
    });
  });

  describe('Daily Snapshots', () => {
    it('should take daily snapshots and store values', async () => {
      // Call the method directly
      await (walletTracker as any).takeDailySnapshot();
      
      // Verify logging
      expect(logger.info).toHaveBeenCalledWith('Taking daily wallet value snapshot');
      expect(logger.info).toHaveBeenCalledWith('Daily wallet snapshot completed');
    });
  });

  describe('Data Persistence', () => {
    it('should save alerts to Redis', async () => {
      // Setup test data
      (walletTracker as any).alerts = new Map([
        [TEST_WALLET_ADDRESS, new Map([
          [TEST_CHAT_ID, {
            walletAddress: TEST_WALLET_ADDRESS,
            chatId: TEST_CHAT_ID,
            minValueUsd: TEST_MIN_VALUE_USD,
            lastBalances: new Map([['key', 'value']])
          }]
        ])]
      ]);
      
      (walletTracker as any).historicalValues = new Map([
        [TEST_WALLET_ADDRESS, {
          value: '1000',
          timestamp: Math.floor(Date.now() / 1000)
        }]
      ]);
      
      // Call the method
      await (walletTracker as any).saveAlerts();
      
      // Verify Redis calls
      expect(mockRedisService.setTrackedWallet).toHaveBeenCalled();
      expect(mockRedisService.setHistoricalValues).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Successfully saved wallet alerts to Redis');
    });

    it('should load alerts from Redis', async () => {
      // Mock Redis responses
      mockRedisService.getAllUserIds.mockResolvedValue([TEST_CHAT_ID.toString()]);
      
      const trackedWallets = new Map([
        [TEST_WALLET_ADDRESS, {
          walletAddress: TEST_WALLET_ADDRESS,
          chatId: TEST_CHAT_ID,
          minValueUsd: TEST_MIN_VALUE_USD,
          lastCheckedTime: 1234567,
          lastBalances: new Map([['key', 'value']])
        }]
      ]);
      mockRedisService.getTrackedWallets.mockResolvedValue(trackedWallets);
      
      const historicalValues = new Map([
        ['value', '1000'],
        ['timestamp', '123456789']
      ]);
      mockRedisService.getHistoricalValues.mockResolvedValue(historicalValues);
      
      // Call the method
      await (walletTracker as any).loadAlerts();
      
      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Successfully loaded'));
    });
  });
});