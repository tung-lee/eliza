import {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    ServiceType,
    // ServiceType,
    State,
    composeContext,
    elizaLogger,
    generateObject,
    generateText,
    type Action,
} from "@elizaos/core";
import { z } from "zod";
import { SuiService } from "../../services/sui";
import { NORMALIZED_DEEP_COINTYPE, SUI_COINTYPE } from "@suilend/frontend-sui";
import { SuiLendAction } from "../enum";
import { extractSuiLendAction } from "../utils";
import { a } from "vitest/dist/chunks/suite.B2jumIFP.js";

export default {
    name: "REPAY_TOKEN",
    similes: ["REPAY_TOKENS"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    description: "Repay a token to the suilend protocol",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            elizaLogger.log("Starting REPAY TOKEN SUILEND handler...");

            const suiService = runtime.getService<SuiService>(
                ServiceType.TRANSCRIPTION
            );

            if (!state) {
                // Initialize or update state
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const { address, amount, coinSymbol, coinType, coinMetadata } = await extractSuiLendAction(runtime, message, suiService);

            const result = await suiService.repayBySuilend(coinType, Number(amount), address)


            callback({
                text: `Successfully repay ${amount} ${coinSymbol} to suilend`,
                params: {
                    coinMetadata,
                    amount,
                    txBytes: result.txBytesBase64,
                }
            });

            return true;
        } catch (error) {
            elizaLogger.error(`Failed to repay token in suilend: ${error}`);

            callback({
                text: `Failed to repay token in suilend: ${error}`,
                action: SuiLendAction.REPAY_TOKEN_SUILEND
            });

            return false;
        }


    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Deposit 1 SUI to suilend",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you deposit 1 SUI to suilend now...",
                    action: "DEPOSIT_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully deposited 1 SUI to suilend, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Deposit 1 USDC to suilend",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you deposit 1 USDC to suilend now...",
                    action: "DEPOSIT_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully deposited 1 USDC to suilend, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
