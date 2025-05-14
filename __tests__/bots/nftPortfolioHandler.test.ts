// __tests__/bots/nftPortfolioHandler.test.ts

import TelegramBot from 'node-telegram-bot-api';
import { NFTPortfolioHandler } from '../../src/bots/nftPortfolioHandler';
import { VybeApiService } from '../../src/services/vybeAPI';
import { RedisService } from '../../src/services/redisService';
import { NftCollection } from '../../src/interfaces/vybeApiInterface';

// Mock dependencies
jest.mock('node-telegram-bot-api');
jest.mock('../../src/services/vybeAPI');
jest.mock('../../src/services/redisService');
jest.mock('../../src/config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../src/utils/utils', () => ({
  isValidWalletAddress: jest.fn().mockImplementation((address) => 
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  ),
  deleteDoubleSpace: jest.fn().mockImplementation((text) => text.replace(/\s+/g, ' ')),
  formatUsdValue: jest.fn().mockImplementation((value) => `$${parseFloat(value).toFixed(2)}`),
  sendAndDeleteMessage: jest.fn(),
}));

// Mock data
const mockWalletAddress = '5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CmPEwKgVWr8';
const mockInvalidWalletAddress = 'invalid-wallet-address';
const mockChatId = 123456789;

const mockNftCollections: NftCollection[] = [
  {
    collectionAddress: '8nVMVLCJtfTKKDKx9kSQyPMXVdvrbUQwP5L6YVdSA9LM',
    name: 'Test Collection 1',
    logoUrl: 'https://example.com/logo1.png',
    totalItems: 3,
    valueSol: '10.5',
    valueUsd: '1050.00',
    priceSol: '3.5',
    priceUsd: '350.00',
    slot: 1
  },
  {
    collectionAddress: '9kQBgvn64n2FWP2Uhs8NKSVnhrSXzBFnAqKr3WvdGMxu',
    name: 'Test Collection 2',
    logoUrl: 'https://example.com/logo2.png',
    totalItems: 2,
    valueSol: '5.2',
    valueUsd: '520.00',
    priceSol: '2.6',
    priceUsd: '260.00',
    slot: 2
  }
];

const mockNftBalanceResponse = {
  data: mockNftCollections,
  totalUsd: '1570.00',
  totalSol: '15.7',
  totalNftCollectionCount: 2,
  date: Date.now(),
  ownerAddress: mockWalletAddress
};

describe('NFTPortfolioHandler', () => {
  let handler: NFTPortfolioHandler;
  let mockBot: jest.Mocked<TelegramBot>;
  let mockApi: jest.Mocked<VybeApiService>;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockBot = new TelegramBot('') as jest.Mocked<TelegramBot>;
    mockApi = new VybeApiService() as jest.Mocked<VybeApiService>;
    mockRedisService = {
      getInstance: jest.fn().mockResolvedValue({}),
      getNFTWallets: jest.fn(),
      addNFTWallet: jest.fn(),
      saveNFTWallets: jest.fn(),
      removeNFTWallet: jest.fn(),
      setNFTPortfolio: jest.fn(),
      getNFTPortfolio: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    // Mock the static getInstance method
    (RedisService.getInstance as jest.Mock).mockResolvedValue(mockRedisService);
    
    // Mock VybeApiService methods
    mockApi.getNFTBalance = jest.fn().mockResolvedValue(mockNftBalanceResponse);

    // Create instance of handler
    handler = new NFTPortfolioHandler(mockBot, mockApi);
    
    // Set the RedisService property directly for testing
    (handler as any).redisService = mockRedisService;
  });

  describe('handleNFTPortfolio', () => {
    it('should send help message when command argument is "help"', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: '/nft_portfolio help'
      } as TelegramBot.Message;

      await handler.handleNFTPortfolio(msg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.any(String),
        { parse_mode: 'Markdown' }
      );
    });

    it('should prompt to provide wallet address when no args and no registered wallets', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: '/nft_portfolio'
      } as TelegramBot.Message;

      mockRedisService.getNFTWallets.mockResolvedValue([]);

      await handler.handleNFTPortfolio(msg);

      expect(mockRedisService.getNFTWallets).toHaveBeenCalledWith(mockChatId);
      expect(require('../../src/utils/utils').sendAndDeleteMessage).toHaveBeenCalledWith(
        mockBot,
        msg,
        expect.stringContaining('provide a wallet address')
      );
    });

    it('should use first registered wallet when no args provided', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: '/nft_portfolio'
      } as TelegramBot.Message;

      mockRedisService.getNFTWallets.mockResolvedValue([mockWalletAddress]);
      mockBot.sendMessage.mockResolvedValue({} as TelegramBot.Message);

      await handler.handleNFTPortfolio(msg);

      expect(mockRedisService.getNFTWallets).toHaveBeenCalledWith(mockChatId);
      expect(mockApi.getNFTBalance).toHaveBeenCalledWith(mockWalletAddress);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('Fetching NFT portfolio'),
        expect.anything()
      );
    });

    it('should reject invalid wallet addresses', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: `/nftportfolio ${mockInvalidWalletAddress}`
      } as TelegramBot.Message;

      await handler.handleNFTPortfolio(msg);

      expect(require('../../src/utils/utils').sendAndDeleteMessage).toHaveBeenCalledWith(
        mockBot,
        msg,
        expect.stringContaining('Invalid wallet address')
      );
      expect(mockApi.getNFTBalance).not.toHaveBeenCalled();
    });

    it('should fetch and display NFT portfolio for valid wallet address', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: `/nft_portfolio ${mockWalletAddress}`
      } as TelegramBot.Message;

      mockBot.sendMessage.mockResolvedValue({} as TelegramBot.Message);
      
      await handler.handleNFTPortfolio(msg);

      expect(mockApi.getNFTBalance).toHaveBeenCalledWith(mockWalletAddress);
      expect(mockRedisService.setNFTPortfolio).toHaveBeenCalledWith(
        mockChatId,
        {
          walletAddress: mockWalletAddress,
          collections: mockNftCollections
        }
      );
      // Check for summary message
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('NFT Portfolio Summary'),
        expect.anything()
      );
      // Check for collections keyboard
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('Select a collection'),
        expect.objectContaining({
          reply_markup: expect.any(Object)
        })
      );
    });

    it('should use cached portfolio data when available', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: `/nft_portfolio ${mockWalletAddress}`
      } as TelegramBot.Message;

      mockRedisService.getNFTPortfolio.mockResolvedValue({
        walletAddress: mockWalletAddress,
        collections: mockNftCollections
      });
      mockBot.sendMessage.mockResolvedValue({} as TelegramBot.Message);
      
      await handler.handleNFTPortfolio(msg);

      expect(mockRedisService.getNFTPortfolio).toHaveBeenCalledWith(mockChatId);
      expect(mockApi.getNFTBalance).not.toHaveBeenCalled(); // Should not call API
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('NFT Portfolio Summary'),
        expect.anything()
      );
    });

    it('should handle empty NFT collections gracefully', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: `/nft_portfolio ${mockWalletAddress}`
      } as TelegramBot.Message;

      mockApi.getNFTBalance.mockResolvedValueOnce({
        ...mockNftBalanceResponse,
        data: [],
        totalUsd: '0',
        totalSol: '0',
        totalNftCollectionCount: 0
      });
      
      await handler.handleNFTPortfolio(msg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining("doesn't have any NFTs"),
      );
    });

    it('should handle API errors gracefully', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: `/nft_portfolio ${mockWalletAddress}`
      } as TelegramBot.Message;

      mockApi.getNFTBalance.mockRejectedValueOnce(new Error('API error'));
      
      await handler.handleNFTPortfolio(msg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('An error occurred'),
      );
    });
  });

  describe('handleRegisterNFTWallet', () => {
    it('should send help message when command argument is "help"', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: '/register_nft_wallet help'
      } as TelegramBot.Message;

      await handler.handleRegisterNFTWallet(msg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.any(String),
        { parse_mode: 'Markdown' }
      );
    });

    it('should show usage when no wallet address is provided', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: '/register_nft_wallet'
      } as TelegramBot.Message;

      await handler.handleRegisterNFTWallet(msg);

      expect(require('../../src/utils/utils').sendAndDeleteMessage).toHaveBeenCalledWith(
        mockBot,
        msg,
        expect.any(String),
        10
      );
    });

    it('should show usage when invalid wallet address is provided', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: `/register_nft_wallet ${mockInvalidWalletAddress}`
      } as TelegramBot.Message;

      await handler.handleRegisterNFTWallet(msg);

      expect(require('../../src/utils/utils').sendAndDeleteMessage).toHaveBeenCalledWith(
        mockBot,
        msg,
        expect.any(String),
        10
      );
    });

    it('should register valid wallet address', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: `/register_nft_wallet ${mockWalletAddress}`
      } as TelegramBot.Message;

      mockRedisService.addNFTWallet.mockResolvedValue(true);

      await handler.handleRegisterNFTWallet(msg);

      expect(mockRedisService.addNFTWallet).toHaveBeenCalledWith(mockChatId, mockWalletAddress);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('✅ Wallet registered successfully'),
      );
    });

    it('should notify if wallet is already registered', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: `/register_nft_wallet ${mockWalletAddress}`
      } as TelegramBot.Message;

      mockRedisService.addNFTWallet.mockResolvedValue(false);

      await handler.handleRegisterNFTWallet(msg);

      expect(mockRedisService.addNFTWallet).toHaveBeenCalledWith(mockChatId, mockWalletAddress);
      expect(require('../../src/utils/utils').sendAndDeleteMessage).toHaveBeenCalledWith(
        mockBot,
        msg,
        expect.stringContaining('already registered')
      );
    });
  });

  describe('handleListNFTWallets', () => {
    it('should send help message when command argument is "help"', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: '/list_nft_wallets help'
      } as TelegramBot.Message;

      await handler.handleListNFTWallets(msg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.any(String),
        { parse_mode: 'Markdown' }
      );
    });

    it('should notify when no wallets are registered', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: '/list_nft_wallets'
      } as TelegramBot.Message;

      mockRedisService.getNFTWallets.mockResolvedValue([]);

      await handler.handleListNFTWallets(msg);

      expect(mockRedisService.getNFTWallets).toHaveBeenCalledWith(mockChatId);
      expect(require('../../src/utils/utils').sendAndDeleteMessage).toHaveBeenCalledWith(
        mockBot,
        msg,
        expect.stringContaining("haven't registered any wallets")
      );
    });

    it('should list registered wallets', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: '/list_nft_wallets'
      } as TelegramBot.Message;

      const registeredWallets = [
        mockWalletAddress,
        '7C7C1GaTT9mRuNyToXiJcgT9xJKVJyBP6aXWFTisxfo4'
      ];

      mockRedisService.getNFTWallets.mockResolvedValue(registeredWallets);

      await handler.handleListNFTWallets(msg);

      expect(mockRedisService.getNFTWallets).toHaveBeenCalledWith(mockChatId);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('Your registered NFT wallets'),
        { parse_mode: 'Markdown' }
      );
      
      // Check that both wallets are included in the message
      const messageText = mockBot.sendMessage.mock.calls[0][1] as string;
      expect(messageText).toContain(mockWalletAddress);
      expect(messageText).toContain('7C7C1GaTT9mRuNyToXiJcgT9xJKVJyBP6aXWFTisxfo4');
    });
  });

  describe('handleRemoveNFTWallet', () => {
    it('should send help message when command argument is "help"', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: '/remove_nft_wallet help'
      } as TelegramBot.Message;

      await handler.handleRemoveNFTWallet(msg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.any(String),
        { parse_mode: 'Markdown' }
      );
    });

    it('should prompt when no wallet address is provided', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: '/remove_nft_wallet'
      } as TelegramBot.Message;

      await handler.handleRemoveNFTWallet(msg);

      expect(require('../../src/utils/utils').sendAndDeleteMessage).toHaveBeenCalledWith(
        mockBot,
        msg,
        expect.stringContaining('Please provide a wallet address')
      );
    });

    it('should remove registered wallet', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: `/remove_nft_wallet ${mockWalletAddress}`
      } as TelegramBot.Message;

      mockRedisService.removeNFTWallet.mockResolvedValue(true);

      await handler.handleRemoveNFTWallet(msg);

      expect(mockRedisService.removeNFTWallet).toHaveBeenCalledWith(mockChatId, mockWalletAddress);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('✅ Wallet removed')
      );
    });

    it('should notify if wallet is not registered', async () => {
      const msg = {
        chat: { id: mockChatId },
        text: `/remove_nft_wallet ${mockWalletAddress}`
      } as TelegramBot.Message;

      mockRedisService.removeNFTWallet.mockResolvedValue(false);

      await handler.handleRemoveNFTWallet(msg);

      expect(mockRedisService.removeNFTWallet).toHaveBeenCalledWith(mockChatId, mockWalletAddress);
      expect(require('../../src/utils/utils').sendAndDeleteMessage).toHaveBeenCalledWith(
        mockBot,
        msg,
        expect.stringContaining('not currently registered')
      );
    });
  });

  describe('handleCollectionCallback', () => {
    it('should ignore non-matching callback queries', async () => {
      const query = {
        id: '12345',
        data: 'other_action_data',
        message: {
          chat: {
            id: mockChatId
          }
        }
      } as TelegramBot.CallbackQuery;

      await handler.handleCollectionCallback(query);

      expect(mockBot.sendMessage).not.toHaveBeenCalled();
      expect(mockBot.answerCallbackQuery).not.toHaveBeenCalled();
    });

    it('should display collection details when found in portfolio', async () => {
      const collectionName = 'Test Collection 1';
      const query = {
        id: '12345',
        data: `nft_collection_${collectionName}`,
        message: {
          chat: {
            id: mockChatId
          }
        }
      } as TelegramBot.CallbackQuery;

      mockRedisService.getNFTPortfolio.mockResolvedValue({
        walletAddress: mockWalletAddress,
        collections: mockNftCollections
      });

      await handler.handleCollectionCallback(query);

      expect(mockRedisService.getNFTPortfolio).toHaveBeenCalledWith(mockChatId);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining(collectionName),
        expect.objectContaining({
          parse_mode: 'Markdown'
        })
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith(query.id);
    });

    it('should handle missing collection in portfolio', async () => {
      const nonExistentCollection = 'Non Existent Collection';
      const query = {
        id: '12345',
        data: `nft_collection_${nonExistentCollection}`,
        message: {
          chat: {
            id: mockChatId
          }
        }
      } as TelegramBot.CallbackQuery;

      mockRedisService.getNFTPortfolio.mockResolvedValue({
        walletAddress: mockWalletAddress,
        collections: mockNftCollections
      });

      await handler.handleCollectionCallback(query);

      expect(mockRedisService.getNFTPortfolio).toHaveBeenCalledWith(mockChatId);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('Could not find collection'),
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith(query.id);
    });

    it('should handle missing portfolio data', async () => {
      const query = {
        id: '12345',
        data: 'nft_collection_Some Collection',
        message: {
          chat: {
            id: mockChatId
          }
        }
      } as TelegramBot.CallbackQuery;

      mockRedisService.getNFTPortfolio.mockResolvedValue(null);

      await handler.handleCollectionCallback(query);

      expect(mockRedisService.getNFTPortfolio).toHaveBeenCalledWith(mockChatId);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('Portfolio data not found'),
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith(query.id);
    });
  });
});