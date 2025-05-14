
/**
 * The core idea prevents tests from making actual HTTP calls to the Vybe API. 
 * Instead, We'll mock axios to control the responses and verify that the 
 * service methods make the correct API calls with the right parameters.
 */

import { VybeApiService } from '../../src/services/vybeAPI';
import axios from 'axios';
import config from '../../src/config/config';
import * as utils from '../../src/utils/utils';
import logger from '../../src/config/logger';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config
jest.mock('../../src/config/config', () => ({
    vybe: {
        apiBaseUrl: 'https://api.vybe.test',
        apiKey: 'test-api-key',
    },
}));

// Mock logger
jest.mock('../../src/config/logger', () => ({
    debug: jest.fn(),
    error: jest.fn(),
}));

// Mock utils
jest.mock('../../src/utils/utils', () => ({
    isValidMintAddress: jest.fn(),
    isValidWalletAddress: jest.fn(),
    formatUsdValue: jest.fn(),
    tokenOHLCV7Days: jest.fn().mockReturnValue(1234567890),
}));

describe('VybeApiService', () => {
    let vybeApiService: VybeApiService;
    const axiosCreateSpy = jest.spyOn(axios, 'create');
    const mockAxiosInstance = {
        get: jest.fn(),
        interceptors: {
            response: {
                use: jest.fn(),
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        axiosCreateSpy.mockReturnValue(mockAxiosInstance as any);
        vybeApiService = new VybeApiService();
    });

    describe('getTopTokenHolder', () => {
        const validMintAddress = 'So11111111111111111111111111111111111111112';
        const mockTopHolderResponse = {
            data: {
                data: [
                    {
                        address: 'wallet1',
                        amount: '100000000',
                        percent: 10,
                    },
                    {
                        address: 'wallet2',
                        amount: '50000000',
                        percent: 5,
                    },
                ],
            },
            status: 200,
            config: { url: '/token/So11111111111111111111111111111111111111112/top-holders' },
        };

        it('should fetch top token holders successfully', async () => {
            // Mock utility function to validate mint address
            (utils.isValidMintAddress as jest.Mock).mockReturnValue(true);

            // Mock axios response
            mockAxiosInstance.get.mockResolvedValueOnce(mockTopHolderResponse);

            // Execute the method
            const result = await vybeApiService.getTopTokenHolder(validMintAddress, 10);

            // Assertions
            expect(utils.isValidMintAddress).toHaveBeenCalledWith(validMintAddress);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(
                `/token/${validMintAddress}/top-holders`,
                { params: { limit: 10 } }
            );
            expect(result).toEqual(mockTopHolderResponse.data);
        });

        it('should throw error when mint address is invalid', async () => {
            // Mock utility function to validate mint address to return false
            (utils.isValidMintAddress as jest.Mock).mockReturnValue(false);

            // Execute and assert
            await expect(vybeApiService.getTopTokenHolder('invalid-address')).rejects.toThrow(
                'Invalid mint address: invalid-address is not a valid base58 encoded Solana Pubkey'
            );
            expect(utils.isValidMintAddress).toHaveBeenCalledWith('invalid-address');
            expect(mockAxiosInstance.get).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle 400 error from API', async () => {
            // Mock utility function to validate mint address
            (utils.isValidMintAddress as jest.Mock).mockReturnValue(true);

            // Mock axios response for 400 error
            mockAxiosInstance.get.mockResolvedValueOnce({
                status: 400,
                data: { message: 'Bad request' },
                config: { url: '/token/So11111111111111111111111111111111111111112/top-holders' },
            });

            // Execute and assert
            await expect(vybeApiService.getTopTokenHolder(validMintAddress)).rejects.toThrow(
                `Invalid mint address: ${validMintAddress}`
            );
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle 404 error from API', async () => {
            // Mock utility function to validate mint address
            (utils.isValidMintAddress as jest.Mock).mockReturnValue(true);

            // Mock axios response for 404 error
            mockAxiosInstance.get.mockResolvedValueOnce({
                status: 404,
                data: { message: 'Not found' },
                config: { url: '/token/So11111111111111111111111111111111111111112/top-holders' },
            });

            // Execute and assert
            await expect(vybeApiService.getTopTokenHolder(validMintAddress)).rejects.toThrow(
                `Mint address not found: ${validMintAddress}`
            );
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle network error', async () => {
            // Mock utility function to validate mint address
            (utils.isValidMintAddress as jest.Mock).mockReturnValue(true);

            // Mock axios to throw error
            const networkError = new Error('Network error');
            mockAxiosInstance.get.mockRejectedValueOnce(networkError);

            // Execute and assert
            await expect(vybeApiService.getTopTokenHolder(validMintAddress)).rejects.toThrow(
                `Failed to get top token holders: ${ networkError.message }`
            );
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getWalletRecentTransfers', () => {
        const validWalletAddress = 'wallet123';
        const mockTransfersResponse = {
            data: {
                data: [
                    {
                        id: 'tx1',
                        senderAddress: 'wallet123',
                        receiverAddress: 'wallet456',
                        mintAddress: 'token123',
                        amount: '100000',
                        usdValue: 10.5,
                        time: 1620000000,
                    },
                ],
            },
            status: 200,
            config: { url: '/token/transfers' },
        };

        it('should fetch wallet recent transfers successfully', async () => {
            // Mock utility function to validate wallet addresses
            (utils.isValidWalletAddress as jest.Mock).mockReturnValue(true);

            // Mock axios response
            mockAxiosInstance.get.mockResolvedValueOnce(mockTransfersResponse);

            // Execute the method
            const result = await vybeApiService.getWalletRecentTransfers({
                senderAddress: validWalletAddress,
                limit: 5,
            });

            // Assertions
            expect(utils.isValidWalletAddress).toHaveBeenCalledWith(validWalletAddress);
            expect(mockAxiosInstance.get).toHaveBeenCalled();
            // Check that the time parameter was set (5 hours back)
            const callParams = mockAxiosInstance.get.mock.calls[0][1].params;
            expect(callParams.senderAddress).toBe(validWalletAddress);
            expect(callParams.limit).toBe(5);
            expect(callParams.timeStart).toBeDefined();
            expect(result).toEqual(mockTransfersResponse.data);
        });

        it('should throw error when wallet address is invalid', async () => {
            // Mock utility function to validate wallet address to return false
            (utils.isValidWalletAddress as jest.Mock).mockReturnValue(false);

            // Execute and assert
            await expect(vybeApiService.getWalletRecentTransfers({
                senderAddress: 'invalid-address',
            })).rejects.toThrow(
                'Invalid wallet address: Address is not a valid base58 encoded Solana Pubkey'
            );
            expect(utils.isValidWalletAddress).toHaveBeenCalledWith('invalid-address');
            expect(mockAxiosInstance.get).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should throw error when limit is out of range', async () => {
            // Test for limit 0
            await expect(vybeApiService.getWalletRecentTransfers({
                limit: 0,
            })).rejects.toThrow('Limit must be between 1 and 10');
            expect(mockedAxios.create().get).not.toHaveBeenCalled();

            // Test for limit 11
            await expect(vybeApiService.getWalletRecentTransfers({
                limit: 11,
            })).rejects.toThrow('Limit must be between 1 and 10');
            expect(mockedAxios.create().get).not.toHaveBeenCalled();
        });
        it('should handle API error with response', async () => {
            // Mock utility function to validate wallet address
            (utils.isValidWalletAddress as jest.Mock).mockReturnValue(true);

            // Mock axios to throw error with response
            const apiError = new Error('API error');
            (apiError as any).response = {
                status: 400,
                data: { message: 'Bad request' },
            };
            mockAxiosInstance.get.mockRejectedValueOnce(apiError);

            // Execute and assert
            await expect(vybeApiService.getWalletRecentTransfers({
                senderAddress: validWalletAddress,
            })).rejects.toThrow(/API error/);
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle network error', async () => {
            // Mock utility function to validate wallet address
            (utils.isValidWalletAddress as jest.Mock).mockReturnValue(true);

            // Mock axios to throw error
            const networkError = new Error('Network error');
            mockAxiosInstance.get.mockRejectedValueOnce(networkError);

            // Execute and assert
            await expect(vybeApiService.getWalletRecentTransfers({
                senderAddress: validWalletAddress,
            })).rejects.toThrow(`Failed to fetch recent transfers: ${networkError.message}`);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getWhaleTransfers', () => {
        const validMintAddress = 'So11111111111111111111111111111111111111112';
        const mockWhaleTransfersResponse = {
            data: {
                data: [
                    {
                        id: 'tx1',
                        senderAddress: 'whale1',
                        receiverAddress: 'whale2',
                        mintAddress: validMintAddress,
                        amount: '10000000000',
                        usdValue: 100000,
                        time: 1620000000,
                    },
                ],
            },
            status: 200,
            config: { url: '/token/transfers' },
        };

        it('should fetch whale transfers successfully', async () => {
            // Mock axios response
            mockAxiosInstance.get.mockResolvedValueOnce(mockWhaleTransfersResponse);

            // Execute the method with params
            const params = {
                mintAddress: validMintAddress,
                minAmount: 1000,
                maxAmount: 10000,
                limit: 5,
                timeStart: 1610000000,
                timeEnd: 1620000000,
                // sortByDesc: 'amount',
            };

            const result = await vybeApiService.getWhaleTransfers(params);

            // Assertions
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(
                '/token/transfers',
                {
                    params: {
                        mintAddress: validMintAddress,
                        minAmount: 1000,
                        maxAmount: 10000,
                        limit: 5,
                        timeStart: 1610000000,
                        timeEnd: 1620000000,
                        sortByDesc: 'amount'
                    }
                }
            );
            expect(result).toEqual(mockWhaleTransfersResponse.data);
        });

        it('should use default sortByDesc if not provided', async () => {
            // Mock axios response
            mockAxiosInstance.get.mockResolvedValueOnce(mockWhaleTransfersResponse);

            // Execute the method without sortByDesc
            const params = {
                mintAddress: validMintAddress,
                limit: 5
            };

            await vybeApiService.getWhaleTransfers(params);

            // Assertions
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(
                '/token/transfers',
                {
                    params: {
                        mintAddress: validMintAddress,
                        limit: 5,
                        sortByDesc: 'amount'
                    }
                }
            );
        });

        it('should handle API error with response', async () => {
            // Mock axios to throw error with response
            const apiError = new Error('API error');
            (apiError as any).response = {
                status: 400,
                data: { message: 'Bad request' },
            };
            mockAxiosInstance.get.mockRejectedValueOnce(apiError);

            // Execute and assert
            await expect(vybeApiService.getWhaleTransfers({
                mintAddress: validMintAddress,
                limit: 5
            })).rejects.toThrow(/API error \(400\): Bad request/);
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle network error', async () => {
            // Mock axios to throw error
            const networkError = new Error('Network error');
            mockAxiosInstance.get.mockRejectedValueOnce(networkError);

            // Execute and assert
            await expect(vybeApiService.getWhaleTransfers({
                mintAddress: validMintAddress,
                limit: 5
            })).rejects.toThrow('Failed to fetch whale transfers: Network error');
            expect(logger.error).toHaveBeenCalled();
        });
    });
});