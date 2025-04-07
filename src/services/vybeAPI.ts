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
    TopHolder,
    GetTopHoldersResponse,
    GetRecentTransferResponse,
} from "../interfaces/vybeApiInterface";
import { response } from "express";

dotenv.config();

export class VybeApiService {
    private api: AxiosInstance;

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

}
