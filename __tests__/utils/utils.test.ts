// __tests__/utils/utils.test.ts

import {
    formatUsdValue,
    isValidMintAddress,
    isValidWalletAddress,
    timeAgo,
    tokenOHLCV7Days
} from "../../src/utils/utils";

describe("Utils", () => {
    describe("isValidMintAddress", () => {
        it("should return true for a valid mint address", () => {
            const validMintAddress = "So11111111111111111111111111111111111111112";
            expect(isValidMintAddress(validMintAddress)).toBe(true);
        });

        it("should return false for an invalid mint address", () => {
            const invalidMintAddress1 = "invalid-address";
            const invalidMintAddress2 = "So111111111111111111111111111111111"; // Too short
            expect(isValidMintAddress(invalidMintAddress1)).toBe(false);
            expect(isValidMintAddress(invalidMintAddress2)).toBe(false);
        });

    });

    describe("isValidWalletAddress", () => {
        it("should return true for a valid wallet address", () => {
            const validWalletAddress = "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9";
            const validWalletAddress2 = "8ezggN9N1QM6a6jBgqmdRAGSMQZ25mDw3dyWWbRhNhhp";
            expect(isValidWalletAddress(validWalletAddress)).toBe(true);
            expect(isValidWalletAddress(validWalletAddress2)).toBe(true);
        });

        it("should return false for an invalid wallet address", () => {
            const inValidWalletAddress1 = "invalid-address";
            const inValidWalletAddress2 = "qwertyuiop";
            expect(isValidWalletAddress(inValidWalletAddress1)).toBe(false);
            expect(isValidWalletAddress(inValidWalletAddress2)).toBe(false);
        })
    });

    describe("FormatUsdValue", () => {
        it("should format values less than 1000", () => {
            expect(formatUsdValue(950)).toBe("$950.00");
            expect(formatUsdValue(10)).toBe("$10.00");
            expect(formatUsdValue(0)).toBe("$0.00");
        });

        it("should format values in thousands", () => {
            expect(formatUsdValue(1250)).toBe("$1.25K");
            expect(formatUsdValue(9999)).toBe("$10.00K");
        });

        it("should format values in millions", () => {
            expect(formatUsdValue(230616724.4985304)).toBe("$230.62M");
        });

        it("should format values in billions", () => {
            expect(formatUsdValue(7335305155.404051)).toBe("$7.34B");
        });

        it("should handle string inputs", () => {
            expect(formatUsdValue("1500")).toBe("$1.50K");
        });

        it("should handle NaN inputs", () => {
            expect(formatUsdValue(NaN)).toBe("$0.00");
            expect(formatUsdValue("invalid")).toBe("$0.00");
        });
    });

    describe("TimeAgo", () => { 
        it("should return just now for recent timestamps", () => { 
            const now =  Date.now() / 1000; // Current time in seconds
            expect(timeAgo(now)).toBe("just now");
            expect(timeAgo(now - 59)).toBe("59 seconds ago"); // 1 minute ago (within 1 minute of now )
        });

        it("should return minutes ago", () => {
            const now = Date.now() / 1000;
            expect(timeAgo(now - 60)).toBe("1 minute ago");
            expect(timeAgo(now - 120)).toBe("2 minutes ago");
        });

        it("should return hours ago", () => {
            const now = Date.now() / 1000;
            expect(timeAgo(now - 3605)).toBe("1 hour ago")
            expect(timeAgo(now - 3605 * 2)).toBe("2 hours ago")
        });

        it("should return days ago", () => { 
            const now = Date.now() / 1000;
            expect(timeAgo(now - 86404)).toBe("1 day ago");
            expect(timeAgo(now - 86404 * 3)).toBe("3 days ago");
        });

        it("should return $0.00 if input is not a number", () => { 
        expect(formatUsdValue("not a number")).toBe("$0.00");
         })
        
    });

    describe("tokenOHLCV7Days", () => {
        it("should return a timestamp for 6 days ago at 6:00 AM UTC", () => {
            const sixDaysAgo = new Date();
            sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
            sixDaysAgo.setUTCHours(6, 0, 0, 0);
            const expectedTimestamp = Math.floor(sixDaysAgo.getTime() / 1000);
            expect(tokenOHLCV7Days()).toBe(expectedTimestamp);
        });
    });
   
})