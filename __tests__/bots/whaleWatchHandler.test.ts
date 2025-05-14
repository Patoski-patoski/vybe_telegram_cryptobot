//__tests__/bots/whaleWatcherHandler.test.ts

import { WhaleWatcherHandler } from '../../src/bots/whaleWatchHandler';
import TelegramBot from 'node-telegram-bot-api';
import { VybeApiService } from '../../src/services/vybeAPI';
import { RedisService } from '../../src/services/redisService';
import { WhaleAlertSettings, RecentTransfer } from '../../src/interfaces/vybeApiInterface';

// Mock dependencies
jest.mock('node-telegram-bot-api');
jest.mock('../../src/services/vybeAPI');
jest.mock('../../src/services/redisService');
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('WhaleWatcherHandler', () => {
  let handler: WhaleWatcherHandler;
  let mockBot: jest.Mocked<TelegramBot>;
  let mockApi: jest.Mocked<VybeApiService>;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-05-14T10:00:00Z'));
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock bot
    mockBot = new TelegramBot('fake-token') as jest.Mocked<TelegramBot>;
    mockBot.sendMessage = jest.fn().mockResolvedValue({} as TelegramBot.Message);
    mockBot.deleteMessage = jest.fn().mockResolvedValue(true);
    
    // Mock API
    mockApi = new VybeApiService() as jest.Mocked<VybeApiService>;
    
    // Mock Redis Service
    mockRedisService = {
      getInstance: jest.fn().mockReturnThis(),
      setWhaleAlert: jest.fn().mockResolvedValue(undefined),
      getWhaleAlerts: jest.fn().mockResolvedValue([]),
      removeWhaleAlert: jest.fn().mockResolvedValue(undefined),
      getAllUserIds: jest.fn().mockResolvedValue(['123456']),
    } as unknown as jest.Mocked<RedisService>;
    
    // Mock RedisService.getInstance to return our mock
    (RedisService.getInstance as jest.Mock).mockResolvedValue(mockRedisService);
    
    // Create handler instance
    handler = new WhaleWatcherHandler(mockBot, mockApi);
    
    // Mock private methods and properties
    Object.defineProperty(handler, 'redisService', {
      get: jest.fn().mockReturnValue(mockRedisService),
      set: jest.fn(),
    });
    
    Object.defineProperty(handler, 'alerts', {
      get: jest.fn().mockReturnValue(new Map()),
      set: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('handleSetWhaleAlert', () => {
    it('should set a new whale alert', async () => {
      // Setup
      const chatId = 123456;
      const message = {
        chat: { id: chatId },
        text: '/set_whale_alert EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v 1000',
      } as TelegramBot.Message;
      
      let alertsMap = new Map();
      Object.defineProperty(handler, 'alerts', {
        get: jest.fn().mockReturnValue(alertsMap),
        set: jest.fn((value) => alertsMap = value),
      });
      
      // Act
      await handler.handleSetWhaleAlert(message);
      
      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('✅  Whale alert set!!'),
        expect.any(Object)
      );
      
      const alertId = `${chatId}-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`;
      expect(alertsMap.has(alertId)).toBeTruthy();
      expect(mockRedisService.setWhaleAlert).toHaveBeenCalledWith(
        chatId,
        expect.objectContaining({
          chatId,
          minAmount: 1000,
          tokens: ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']
        })
      );
    });

    it('should update an existing whale alert', async () => {
      // Setup
      const chatId = 123456;
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const message = {
        chat: { id: chatId },
        text: `/set_whale_alert ${mintAddress} 2000`,
      } as TelegramBot.Message;
      
      let alertsMap = new Map();
      const alertId = `${chatId}-${mintAddress}`;
      alertsMap.set(alertId, {
        chatId,
        minAmount: 1000,
        tokens: [mintAddress]
      });
      
      Object.defineProperty(handler, 'alerts', {
        get: jest.fn().mockReturnValue(alertsMap),
        set: jest.fn((value) => alertsMap = value),
      });
      
      // Act
      await handler.handleSetWhaleAlert(message);
      
      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('🟡 Updated whale alert!!'),
        expect.any(Object)
      );
      
      expect(alertsMap.get(alertId).minAmount).toBe(2000);
      expect(mockRedisService.setWhaleAlert).toHaveBeenCalledWith(
        chatId,
        expect.objectContaining({
          chatId,
          minAmount: 2000,
          tokens: [mintAddress]
        })
      );
    });

    it('should handle invalid min amount input', async () => {
      // Setup
      const chatId = 123456;
      const message = {
        chat: { id: chatId },
        text: '/set_whale_alert EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v invalid',
      } as TelegramBot.Message;
      
      // Act
      await handler.handleSetWhaleAlert(message);
      
      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('⛔ Minimum amount must be a positive number')
      );
    });

    it('should show help message when requested', async () => {
      // Setup
      const chatId = 123456;
      const message = {
        chat: { id: chatId },
        text: '/set_whale_alert help',
      } as TelegramBot.Message;
      
      // Act
      await handler.handleSetWhaleAlert(message);
      
      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.any(String),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });
  });

  describe('handleListWhaleAlerts', () => {
    it('should list active whale alerts', async () => {
      // Setup
      const chatId = 123456;
      const message = {
        chat: { id: chatId },
        text: '/list_whale_alerts',
      } as TelegramBot.Message;
      
      const mockAlerts: WhaleAlertSettings[] = [
        {
          chatId,
          minAmount: 1000,
          tokens: ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']
        },
        {
          chatId,
          minAmount: 2000,
          tokens: ['So11111111111111111111111111111111111111112']
        }
      ];
      
      mockRedisService.getWhaleAlerts.mockResolvedValue(mockAlerts);
      
      // Act
      await handler.handleListWhaleAlerts(message);
      
      // Assert
      expect(mockRedisService.getWhaleAlerts).toHaveBeenCalledWith(chatId);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('Your Active Whale Alerts'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });

    it('should handle no active alerts', async () => {
      // Setup
      const chatId = 123456;
      const message = {
        chat: { id: chatId },
        text: '/list_whale_alerts',
      } as TelegramBot.Message;
      
      mockRedisService.getWhaleAlerts.mockResolvedValue([]);
      
      // Act
      await handler.handleListWhaleAlerts(message);
      
      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining("You don't have any active whale alerts"),
      );
    });
    
    it('should show help message when requested', async () => {
      // Setup
      const chatId = 123456;
      const message = {
        chat: { id: chatId },
        text: '/list_whale_alerts help',
      } as TelegramBot.Message;
      
      // Act
      await handler.handleListWhaleAlerts(message);
      
      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.any(String),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });
  });

  describe('handleRemoveWhaleAlert', () => {
    it('should remove an existing whale alert', async () => {
      // Setup
      const chatId = 123456;
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const message = {
        chat: { id: chatId },
        text: `/remove_whalealert ${mintAddress}`,
      } as TelegramBot.Message;
      
      const alertsMap = new Map();
      const alertId = `${chatId}-${mintAddress}`;
      alertsMap.set(alertId, {
        chatId,
        minAmount: 1000,
        tokens: [mintAddress]
      });
      
      Object.defineProperty(handler, 'alerts', {
        get: jest.fn().mockReturnValue(alertsMap),
        set: jest.fn(),
      });
      
      // Mock delete to actually remove from the map
      alertsMap.delete = jest.fn((key) => {
        const result = Map.prototype.has.call(alertsMap, key);
        Map.prototype.delete.call(alertsMap, key);
        return result;
      });
      
      // Act
      await handler.handleRemoveWhaleAlert(message);
      
      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('✅ Successfully removed whale alert'),
        expect.any(Object)
      );
      
      expect(alertsMap.has(alertId)).toBeFalsy();
      expect(mockRedisService.removeWhaleAlert).toHaveBeenCalledWith(chatId, mintAddress);
    });

    it('should handle non-existent whale alert', async () => {
      // Setup
      const chatId = 123456;
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const message = {
        chat: { id: chatId },
        text: `/remove_whalealert ${mintAddress}`,
      } as TelegramBot.Message;
      
      const alertsMap = new Map();
      
      Object.defineProperty(handler, 'alerts', {
        get: jest.fn().mockReturnValue(alertsMap),
        set: jest.fn(),
      });
      
      // Act
      await handler.handleRemoveWhaleAlert(message);
      
      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('❌ No active whale alert found'),
        expect.any(Object)
      );
    });
  });

  describe('handleCheckWhales', () => {
    it('should check top whale holders successfully', async () => {
      // Setup
      const chatId = 123456;
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const message = {
        chat: { id: chatId },
        text: `/check_whales ${mintAddress} 3`,
      } as TelegramBot.Message;
      
      const mockLoadingMsg = { message_id: 100 } as TelegramBot.Message;
      mockBot.sendMessage.mockImplementation(async (chatId, text) => {
        if (text.includes('Searching')) {
          return mockLoadingMsg;
        }
        return {} as TelegramBot.Message;
      });
      
      const mockHolders = {
        data: [
          {
            ownerAddress: '0x123',
            ownerName: 'Whale 1',
            balance: '10000',
            tokenSymbol: 'USDC',
            valueUsd: '10000.00',
            percentageOfSupplyHeld: 10
          },
          {
            ownerAddress: '0x456',
            ownerName: null,
            balance: '5000',
            tokenSymbol: 'USDC',
            valueUsd: '5000.00',
            percentageOfSupplyHeld: 5
          },
          {
            ownerAddress: '0x789',
            ownerName: 'Whale 3',
            balance: '2500',
            tokenSymbol: 'USDC',
            valueUsd: '2500.00',
            percentageOfSupplyHeld: 2.5
          }
        ]
      };
      
      mockApi.getTopTokenHolder = jest.fn().mockResolvedValue(mockHolders);
      
      // Act
      await handler.handleCheckWhales(message);
      
      // Assert
      expect(mockBot.deleteMessage).toHaveBeenCalledWith(chatId, mockLoadingMsg.message_id);
      expect(mockApi.getTopTokenHolder).toHaveBeenCalledWith(mintAddress);
      
      // Should send summary message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('Top 3 Whale Holders'),
        expect.any(Object)
      );
      
      // Should send 3 holder messages
      expect(mockBot.sendMessage).toHaveBeenCalledTimes(5); // loading + summary + 3 holders
    });

    it('should show help message when requested', async () => {
      // Setup
      const chatId = 123456;
      const message = {
        chat: { id: chatId },
        text: '/check_whales help',
      } as TelegramBot.Message;
      
      // Act
      await handler.handleCheckWhales(message);
      
      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.any(String),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });

    it('should handle API errors gracefully', async () => {
      // Setup
      const chatId = 123456;
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const message = {
        chat: { id: chatId },
        text: `/check_whales ${mintAddress}`,
      } as TelegramBot.Message;
      
      const mockLoadingMsg = { message_id: 100 } as TelegramBot.Message;
      mockBot.sendMessage.mockImplementation(async (chatId, text) => {
        if (text.includes('Searching')) {
          return mockLoadingMsg;
        }
        return {} as TelegramBot.Message;
      });
      
      mockApi.getTopTokenHolder = jest.fn().mockRejectedValue(new Error('API Error'));
      
      // Act
      await handler.handleCheckWhales(message);
      
      // Assert
      expect(mockBot.deleteMessage).toHaveBeenCalledWith(chatId, mockLoadingMsg.message_id);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId, 
        expect.stringContaining('Failed to fetch whale holders')
      );
    });
  });

  describe('checkWhaleTransactions', () => {
    it('should check whale transactions and send alerts for transfers above threshold', async () => {
      // Setup
      const chatId = 123456;
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const minAmount = 1000;
      
      const alertsMap = new Map();
      const alertId = `${chatId}-${mintAddress}`;
      const alert: WhaleAlertSettings = {
        chatId,
        minAmount,
        tokens: [mintAddress]
      };
      alertsMap.set(alertId, alert);
      
      Object.defineProperty(handler, 'alerts', {
        get: jest.fn().mockReturnValue(alertsMap),
        set: jest.fn(),
      });
      
      const mockTransfers = {
        transfers: [
          {
            mintAddress,
            signature: '5Wsd3fmoNzGQLZ47chLmAu17zHrRW7FPKbdfTGAqfavzbCJ3Z2tK1XgdH5fJ9kUqJqNNQZ8jZxEchSNJv562KGbs',
            calculatedAmount: '1500',
            valueUsd: '1500.00',
            senderAddress: '0xSender123',
            receiverAddress: '0xReceiver456',
            blockTime: Math.floor(Date.now() / 1000) - 120, // 2 minutes ago
          } as RecentTransfer
        ]
      };
      
      mockApi.getWhaleTransfers = jest.fn().mockResolvedValue(mockTransfers);
      mockApi.getTopTokenHolder = jest.fn().mockResolvedValue({
        data: [{ tokenSymbol: 'USDC' }]
      });
      
      // Expose private method for testing
      const checkWhaleTransactions = jest.spyOn(
        Object.getPrototypeOf(handler) as any, 
        'checkWhaleTransactions'
      );
      
      // Make it accessible for the test
      // @ts-ignore - accessing private method
      handler.checkWhaleTransactions = checkWhaleTransactions.bind(handler);
      
      // Act
      // @ts-ignore - accessing private method
      await handler.checkWhaleTransactions();
      
      // Assert
      expect(mockApi.getWhaleTransfers).toHaveBeenCalledWith(expect.objectContaining({
        mintAddress,
        minAmount,
      }));
      
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('WHALE ALERT'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });
    
    it('should not send alerts for transfers below threshold', async () => {
      // Setup
      const chatId = 123456;
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const minAmount = 1000;
      
      const alertsMap = new Map();
      const alertId = `${chatId}-${mintAddress}`;
      const alert: WhaleAlertSettings = {
        chatId,
        minAmount,
        tokens: [mintAddress]
      };
      alertsMap.set(alertId, alert);
      
      Object.defineProperty(handler, 'alerts', {
        get: jest.fn().mockReturnValue(alertsMap),
        set: jest.fn(),
      });
      
      const mockTransfers = {
        transfers: [
          {
            mintAddress,
            signature: '5Wsd3fmoNzGQLZ47chLmAu17zHrRW7FPKbdfTGAqfavzbCJ3Z2tK1XgdH5fJ9kUqJqNNQZ8jZxEchSNJv562KGbs',
            calculatedAmount: '500', // Below threshold
            valueUsd: '500.00',
            senderAddress: '0xSender123',
            receiverAddress: '0xReceiver456',
            blockTime: Math.floor(Date.now() / 1000) - 120,
          } as RecentTransfer
        ]
      };
      
      mockApi.getWhaleTransfers = jest.fn().mockResolvedValue(mockTransfers);
      
      // Expose private method for testing
      const checkWhaleTransactions = jest.spyOn(
        Object.getPrototypeOf(handler) as any, 
        'checkWhaleTransactions'
      );
      
      // Make it accessible for the test
      // @ts-ignore - accessing private method
      handler.checkWhaleTransactions = checkWhaleTransactions.bind(handler);
      
      // Act
      // @ts-ignore - accessing private method
      await handler.checkWhaleTransactions();
      
      // Assert
      expect(mockApi.getWhaleTransfers).toHaveBeenCalled();
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('initRedis and loading/saving alerts', () => {
    it('should load alerts from Redis on initialization', async () => {
      // Setup
      const chatId = 123456;
      const mockAlerts: WhaleAlertSettings[] = [
        {
          chatId,
          minAmount: 1000,
          tokens: ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']
        }
      ];
      
      mockRedisService.getAllUserIds.mockResolvedValue([chatId.toString()]);
      mockRedisService.getWhaleAlerts.mockResolvedValue(mockAlerts);
      
      // Expose private method for testing
      const loadAlerts = jest.spyOn(
        Object.getPrototypeOf(handler) as any, 
        'loadAlerts'
      );
      
      // Make it accessible for the test
      // @ts-ignore - accessing private method
      handler.loadAlerts = loadAlerts.bind(handler);
      
      const alertsMap = new Map();
      
      Object.defineProperty(handler, 'alerts', {
        get: jest.fn().mockReturnValue(alertsMap),
        set: jest.fn((val) => {
          Object.defineProperty(handler, 'alerts', {
            get: jest.fn().mockReturnValue(val),
            set: jest.fn(),
          });
        }),
      });
      
      // Act
      // @ts-ignore - accessing private method
      await handler.loadAlerts();
      
      // Assert
      expect(mockRedisService.getAllUserIds).toHaveBeenCalled();
      expect(mockRedisService.getWhaleAlerts).toHaveBeenCalledWith(chatId);
      
      // Check that alerts were properly loaded
      const alertId = `${chatId}-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`;
      expect(handler['alerts'].has(alertId)).toBeTruthy();
    });
    
    it('should save alerts to Redis', async () => {
      // Setup
      const chatId = 123456;
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      
      const alertsMap = new Map();
      const alertId = `${chatId}-${mintAddress}`;
      const alert: WhaleAlertSettings = {
        chatId,
        minAmount: 1000,
        tokens: [mintAddress]
      };
      alertsMap.set(alertId, alert);
      
      Object.defineProperty(handler, 'alerts', {
        get: jest.fn().mockReturnValue(alertsMap),
        set: jest.fn(),
      });
      
      // Expose private method for testing
      const saveAlerts = jest.spyOn(
        Object.getPrototypeOf(handler) as any, 
        'saveAlerts'
      );
      
      // Make it accessible for the test
      // @ts-ignore - accessing private method
      handler.saveAlerts = saveAlerts.bind(handler);
      
      // Act
      // @ts-ignore - accessing private method
      await handler.saveAlerts();
      
      // Assert
      expect(mockRedisService.setWhaleAlert).toHaveBeenCalledWith(chatId, alert);
    });
  });
});