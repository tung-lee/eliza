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
import { SuiService } from "../services/sui";
import { z } from "zod";
import { extractAddress, extractSuiLendAction, extractSwapAction } from "./utils";
import { SuiAction } from "./enum";

export default {
    name: "SWAP_TOKEN",
    similes: ["SWAP_TOKENS"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    description: "Swap from any token to another token",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            elizaLogger.log("Starting SWAP_TOKEN handler...");

            const service = runtime.getService<SuiService>(
                ServiceType.TRANSCRIPTION
            );

            const { address, amount, fromTokenAddress, toTokenAddress, fromTokenMetadata, toTokenMetadata } = await extractSwapAction(runtime, message, service);

            if (!state) {
                // Initialize or update state
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const result = await service.swapToken(
                fromTokenAddress,
                amount,
                0,
                toTokenAddress,
                address
            );


            callback({
                text: `Successfully swapped ${amount} ${fromTokenMetadata.symbol} to ${toTokenMetadata.symbol}`,
                params: {
                    from_token: fromTokenMetadata,
                    destination_token: toTokenMetadata,
                    amount,
                    txBytes: result.txBytesBase64,
                },
                action: SuiAction.SWAP_TOKEN
            });

            return true;
        } catch (err) {
            elizaLogger.error(`Failed to swap token: ${err}`);

            callback({
                text: `Failed to swap token: ${err}`,
                action: SuiAction.SWAP_TOKEN
            });

            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap 1 SUI to USDC",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you swap 1 SUI to USDC now...",
                    action: "SWAP_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully swapped 1 SUI to USDC, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap 1 USDC to SUI",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you swap 1 SUI to USDC now...",
                    action: "SWAP_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully swapped 1 SUI to USDC, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
