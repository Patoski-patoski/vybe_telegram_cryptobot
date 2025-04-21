//src/services/vybeAPI.ts
import dotenv from "dotenv";
import config from "../config/config";
import { formatUsdValue, isValidMintAddress, isValidWalletAddress } from "../utils/utils";
import axios, {
    AxiosInstance,
    AxiosResponse
} from 'axios';

import logger from "../config/logger";
import {
    GetTopHoldersResponse,
    GetRecentTransferResponse,
    WhaleWatchParams,
    GetTokenHolderTimeSeriesResponse,
    GetTokenVolumeTimeSeriesResponse,
    TokenBalanceResponse,
    WalletPnLResponse,
    WalletPnL,
    Program,

} from "../interfaces/vybeApiInterface";

dotenv.config();

export class VybeApiService {
    private api: AxiosInstance;

    /**
     * Initializes the Vybe API service with the given configuration.
     * @constructor
     */
    constructor() {
        this.api = axios.create({
            baseURL: config.vybe.apiBaseUrl,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-api-key': config.vybe.apiKey,
                'User-Agent': 'Vybe-Telegram-Bot/1.0.0'
            },

            timeout: 55000,
            validateStatus: (status) => status < 500 // Handle 4xx errors in catch block

        });
        // Add response interceptor for logging
        this.api.interceptors.response.use(
            (response: AxiosResponse) => {
                logger.debug(`API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error: any) => {
                if (error.response) {
                    logger.error(`API Error: ${error.response.status} ${error.config.url}`, {
                        data: error.response.data
                    });
                } else {
                    logger.error(`API Request Failed: ${error.message}`);
                }
                return Promise.reject(error);
            }
        );

    }

    /**
     * Fetches top token holders from Vybe API.
     * @param mintAddress The mint address of the token to fetch top holders for.
     * @param limit Optional limit of number of records to return. Default is 10.
     * @returns A Promise that resolves to a {@link GetTopHoldersResponse} containing the
     *          top token holders for the specified mint address.
     */
    async getTopTokenHolder(
        mintAddress: string,
        limit?: number): Promise<GetTopHoldersResponse> {
        // Validate mint address format
        if (!isValidMintAddress(mintAddress)) {
            const msg = `Invalid mint address: ${mintAddress} is not a valid base58 encoded Solana Pubkey`;
            logger.error(msg);
            throw new Error(msg);
        }

        // Clean up parameters by removing undefined values
        const params = {
            ...(limit && { limit }),
        };

        const topHolderURL = `/token/${mintAddress}/top-holders`;
        try {
            const response = await this.api.get(topHolderURL, { params });
            switch (response.status) {
                case 400:
                    logger.error(`Bad Request: ${response.status} ${response.config.url}`, {
                        data: response.data,
                    });
                    throw new Error(`Invalid mint address: ${mintAddress}`);
                case 404:
                    logger.error(`Not Found: ${response.status} ${response.config.url}`, {
                        data: response.data,
                    });
                    throw new Error(`Mint address not found: ${mintAddress}`);
            }

            return response.data as GetTopHoldersResponse;

        } catch (error: any) {
            logger.error(`Failed to get top token holders for ${mintAddress}`, { error });
            throw new Error(`Failed to get top token holders: ${error.message}`);
        }
    }
    /**
     * Fetches recent wallets transfers from Vybe API.
     * @param senderAddress Optional sender address to filter by.
     * @param receiverAddress Optional receiver address to filter by.
     * @param timeStart Optional start time to filter by.
     * @param limit Optional limit of number of records to return. Default is 5.
     * @returns A Promise that resolves to a {@link GetRecentTransferResponse} containing the recent transfers.
     * @throws {Error} If there is an error making the API request or parsing the response.
     */
    async getWalletRecentTransfers(options: {
        senderAddress?: string,
        receiverAddress?: string,
        timeStart?: number,
        limit?: number
    }): Promise<GetRecentTransferResponse> {
        // Validate limit 
        if (options.limit && (options.limit <= 0 || options.limit > 10)) {
            throw new Error("Limit must be between 1 and 10");
        }

        if (options.senderAddress && !isValidWalletAddress(options.senderAddress)
            || options.receiverAddress && !isValidWalletAddress(options.receiverAddress)) {
            const msg = `Invalid wallet address: ${options.senderAddress} or ${options.receiverAddress} is not a valid base58 encoded Solana Pubkey`;
            logger.error(msg);
            throw new Error(msg);
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        options.timeStart = currentTimestamp - 18000; // 5 hours in seconds
        // Clean up parameters by removing undefined values
        const params = {
            ...(options.senderAddress && { senderAddress: options.senderAddress }),
            ...(options.receiverAddress && { receiverAddress: options.receiverAddress }),
            ...(options.timeStart && { timeStart: options.timeStart }),
            limit: options.limit
        };

        try {
            const response = await this.api.get(`/token/transfers`, { params });
            return response.data as GetRecentTransferResponse;

        } catch (error: any) {
            logger.error(`Failed to fetch recent transfers: ${error.message}`, { error });
            if (error.response) {
                throw new Error(`
                    API error (${error.response.status}): 
                    ${error.response.data.message
                    || 'Unknown error'}`);
            }
            throw new Error(`Failed to fetch recent transfers: ${error.message}`);
        }
    }

    /**
     * Fetches recent whale transfers from Vybe API.
     * @param params Filter parameters for whale transfers. See {@link WhaleWatchParams} for more information.
     * @returns A Promise that resolves to a {@link GetRecentTransferResponse} containing the whale transfers.
     * @throws {Error} If there is an error making the API request or parsing the response.
     */
    async getWhaleTransfers(params: WhaleWatchParams): Promise<GetRecentTransferResponse> {
        try {
            // Clean up parameters by removing undefined values
            const apiParams = {
                ...(params.mintAddress && { mintAddress: params.mintAddress }),
                ...(params.minAmount && { minAmount: params.minAmount }),
                ...(params.maxAmount && { maxAmount: params.maxAmount }),
                ...(params.sortByDesc && { sortByDesc: params.sortByDesc }),
                ...(params.timeStart && { timeStart: params.timeStart }),
                ...(params.timeEnd && { timeEnd: params.timeEnd }),
                limit: params.limit
            };

            if (!apiParams.sortByDesc) {
                apiParams.sortByDesc = 'amount';
            }

            const response = await this.api.get("/token/transfers", { params: apiParams });
            return response.data as GetRecentTransferResponse;

        } catch (error: any) {
            logger.error(`Failed to fetch whale transfers: ${error.message}`, { error });
            if (error.response) {
                throw new Error(`API error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`);
            }
            throw new Error(`Failed to fetch whale transfers: ${error.message}`);
        }
    }

    /**
     * Fetches token holder time series data from Vybe API.
     * @param mintAddress The mint address of the token.
     * @param timeStart Optional start time in Unix timestamp.
     * @param timeEnd Optional end time in Unix timestamp.
     * @param limit Optional limit of number of records to return. Default is 5.
     * @returns A Promise that resolves to a {@link GetTokenHolderTimeSeriesResponse} containing the token holder time series data.
     */
    async getTokenHolderTimeSeries(
        mintAddress: string,
        startTime?: number,
        endTime?: number,
        limit: number = 5
    ): Promise<GetTokenHolderTimeSeriesResponse> {
        // Validate mint address format
        if (!isValidMintAddress(mintAddress)) {
            const msg = `Invalid mint address: ${mintAddress} is not a valid base58 encoded Solana Pubkey`;
            logger.error(msg);
            throw new Error(msg);
        }

        const params = {
            ...(startTime && { startTime }),
            ...(endTime && { endTime }),
            limit
        };

        try {
            const response = await this.api.get(`/token/${mintAddress}/holders-ts`, { params });
            return response.data as GetTokenHolderTimeSeriesResponse;
        } catch (error: any) {
            logger.error(`Failed to fetch token holder time series for ${mintAddress}`, { error });
            throw new Error(`Failed to fetch token holder time series: ${error.message}`);
        }
    }

    /**
     * Fetches token volume time series data from Vybe API.
     * @param mintAddress The mint address of the token.
     * @param startTime Optional start time in Unix timestamp.
     * @param endTime Optional end time in Unix timestamp.
     * @param limit Optional limit of number of records to return. Default is 5.
     * @returns A Promise that resolves to a {@link GetTokenVolumeTimeSeriesResponse} containing the token volume time series data.
     */
    async getTokenVolumeTimeSeries(
        mintAddress: string,
        startTime?: number,
        endTime?: number,
        limit: number = 5
    ): Promise<GetTokenVolumeTimeSeriesResponse> {
        // Validate mint address format
        if (!isValidMintAddress(mintAddress)) {
            const msg = `Invalid mint address: ${mintAddress} is not a valid base58 encoded Solana Pubkey`;
            logger.error(msg);
            throw new Error(msg);
        }

        const params = {
            ...(startTime && { startTime }),
            ...(endTime && { endTime }),
            limit
        };

        try {
            const response = await this.api.get(`/token/${mintAddress}/transfer-volume`, { params });
            return response.data as GetTokenVolumeTimeSeriesResponse;
        } catch (error: any) {
            logger.error(`Failed to fetch token volume time series for ${mintAddress}`, { error });
            throw new Error(`Failed to fetch token volume time series: ${error.message}`);
        }
    }

    /**
     * Fetches token balance data from Vybe API.
     * @param ownerAddress The owner address to fetch token balances for.
     * @returns A Promise that resolves to a {@link TokenBalanceResponse} containing the token balances.
     * @throws {Error} If there is an error making the API request or parsing the response.
     */
    async getTokenBalance(ownerAddress: string): Promise<TokenBalanceResponse> {
        // Validate owner address format
        if (!isValidMintAddress(ownerAddress)) {
            const msg = `Invalid owner address: ${ownerAddress} is not a valid base58 encoded Solana Pubkey`;
            logger.error(msg);
            throw new Error(msg);
        }

        try {
            const response = await this.api.get(`/account/token-balance/${ownerAddress}`);
            return response.data as TokenBalanceResponse;
        } catch (error: any) {
            logger.error(`Failed to fetch token balance for ${ownerAddress}`, { error });
            if (error.response) {
                throw new Error(`API error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`);
            }
            throw new Error(`Failed to fetch token balance: ${error.message}`);
        }
    }

    async getWalletPnL(
        ownerAddress: string,
        resolution?: '1d' | '7d' | '30d',
        tokenAddress?: string,
        sortByAsc?: string,
        sortByDesc?: string,
        limit?: number,
        page?: number
    ): Promise<WalletPnLResponse> {
        // Validate wallet address
        if (!isValidMintAddress(ownerAddress)) {
            throw new Error(`Invalid wallet address: ${ownerAddress}`);
        }

        const params = {
            ...(resolution && { resolution }),
            ...(tokenAddress && { tokenAddress }),
            ...(sortByAsc && { sortByAsc }),
            ...(sortByDesc && { sortByDesc }),
            ...(limit && { limit }),
            ...(page && { page })
        };

        try {
            const response = await this.api.get(`/account/pnl/${ownerAddress}`, { params });
            return response.data as WalletPnLResponse;
        } catch (error: any) {
            logger.error(`Failed to get wallet PnL for ${ownerAddress}`, { error });
            throw new Error(`Failed to get wallet PnL: ${error.message}`);
        }
    }

    async analyzeWalletPnL(walletAddress: string): Promise<WalletPnL> {
        try {
            const pnlData = await this.getWalletPnL(walletAddress, '30d');

            return {
                totalPnL: pnlData.summary.realizedPnlUsd + pnlData.summary.unrealizedPnlUsd,
                realizedPnL: pnlData.summary.realizedPnlUsd,
                unrealizedPnL: pnlData.summary.unrealizedPnlUsd,
                winRate: pnlData.summary.winRate,
                tradeCount: pnlData.summary.tradesCount,
                averageTradeSize: pnlData.summary.averageTradeUsd,
                bestPerformingToken: pnlData.summary.bestPerformingToken,
                worstPerformingToken: pnlData.summary.worstPerformingToken,
                pnlTrend: pnlData.summary.pnlTrendSevenDays,
                tokenMetrics: pnlData.tokenMetrics
            };
        } catch (error) {
            logger.error(`Failed to analyze wallet PnL for ${walletAddress}`, { error });
            throw error;
        }
    }

    async getProgramInfoByIdOrName(identifier: string): Promise<Program[]> {
        const isProgramId = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(identifier);  // Detects Solana address
        const params = isProgramId ? { programId: identifier } : { name: identifier };

        try {
            const response = await this.api.get(`/program/known-program-accounts`, { params });
            return response.data.programs as Program[];
        } catch (error: any) {
            logger.error(`Failed to fetch program info for ${identifier}`, { error });
            throw new Error(`Failed to fetch program info: ${error.message}`);
        }
    }




    async exploreProgram(label: string) {
        const params = { label };
        try {
            const response = await this.api.get(`/program/known-program-accounts`, { params });
            return response.data.programs as Program[];
        } catch (error: any) {
            logger.error(`Failed to explore program for ${label}`, { error });
            throw new Error(`Failed to explore program: ${error.message}`);
        }
    }
}
