//src/services/vybeAPI.ts
import dotenv from "dotenv";
import config from "../config/config";
import { isValidMintAddress } from "../utils/solana";
import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse
} from 'axios';

import logger from "../config/logger";
import {
    GetTopHoldersResponse,
    GetRecentTransferResponse,
    WhaleWatchParams,
    GetTokenHolderTimeSeriesResponse,
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

            timeout: 15000,
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

    // Get top Token Holders
    /**
     * Fetches top token holders from Vybe API.
     * @param mintAddress The mint address of the token to fetch top holders for.
     * @param limit Optional limit of number of records to return. Default is 5.
     * @returns A Promise that resolves to a {@link GetTopHoldersResponse} containing the
     *          top token holders for the specified mint address.
     */
    async getTopTokenHolder(mintAddress: string, limit: number = 5): Promise<GetTopHoldersResponse> {
        // Validate mint address format
        if (!isValidMintAddress(mintAddress)) {
            const msg = `Invalid mint address: ${mintAddress} is not a valid base58 encoded Solana Pubkey`;
            logger.error(msg);
            throw new Error(msg);
        }

        const topHolderURL = `/token/${mintAddress}/top-holders?limit=${limit}`;
        try {
            const response = await this.api.get(topHolderURL);

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
     * Fetches recent transfers from Vybe API.
     * @param mintAddress Optional mint address to filter by.
     * @param senderAddress Optional sender address to filter by.
     * @param receiverAddress Optional receiver address to filter by.
     * @param tx_signature Optional transaction signature to filter by.
     * @param limit Optional limit of number of records to return. Default is 5.
     * @returns A Promise that resolves to a {@link GetRecentTransferResponse} containing the recent transfers.
     * @throws {Error} If there is an error making the API request or parsing the response.
     */
    async getRecentTransfers(
        mintAddress?: string,
        senderAddress?: string,
        receiverAddress?: string,
        tx_signature?: string,
        limit: number = 5
    ): Promise<GetRecentTransferResponse> {
        // Validate limit
        if (limit <= 0 || limit > 10) {
            throw new Error("Limit must be between 1 and 100");
        }

        // Clean up parameters by removing undefined values
        const params = {
            ...(mintAddress && { mintAddress }),
            ...(senderAddress && { senderAddress }),
            ...(receiverAddress && { receiverAddress }),
            ...(tx_signature && { tx_signature }),
            limit
        };
        console.log("params", params);
        try {
            const response = await this.api.get("/token/transfers", { params });
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
            const apiParams = Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined) acc[key] = value;
                return acc;

            }, {} as Record<string, any>);

            console.log("apiParams", apiParams);

            if (!apiParams.sortByDesc && !apiParams.sortByDesc) {
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
        timeStart?: number,
        timeEnd?: number,
        limit: number = 5
    ): Promise<GetTokenHolderTimeSeriesResponse> {
        // Validate mint address format
        if (!isValidMintAddress(mintAddress)) {
            const msg = `Invalid mint address: ${mintAddress} is not a valid base58 encoded Solana Pubkey`;
            logger.error(msg);
            throw new Error(msg);
        }

        const params = {
            ...(timeStart && { timeStart }),
            ...(timeEnd && { timeEnd }),
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

}
