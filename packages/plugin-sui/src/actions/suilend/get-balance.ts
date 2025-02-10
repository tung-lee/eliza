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
import { SuiService } from "../../services/sui";
import { z } from "zod";
import { extractAddress, extractCoinSymbol } from "../utils";
import { SuiAction } from "../enum";
import { SUI_COINTYPE } from "@suilend/frontend-sui";

export interface SwapPayload extends Content {
    from_token: string;
    destination_token: string;
    amount: string | number;
}

export default {
    name: "GET_BALANCE",
    similes: ["GET_BALANCE"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        console.log("Validating sui transfer from user:", message.userId);
        return true;
    },
    description: "Get the balance from address",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            elizaLogger.log("Starting GET_BALANCE handler...");

            const address = await extractAddress(runtime, message.content.text);

            elizaLogger.info(`Address: ${address}`);

            const coinSymbol = await extractCoinSymbol(runtime, message.content.text);

            elizaLogger.info(`Coin Symbol: ${coinSymbol}`);

            const service = runtime.getService<SuiService>(
                ServiceType.TRANSCRIPTION
            );

            const coinType = await service.getTokenFromSymbol(coinSymbol) as string;

            if (!coinType) {
                callback({
                    text: `Failed to get the balance from address: ${coinSymbol} is not a valid coin symbol`,
                    action: SuiAction.GET_BALANCE
                });

                return false;
            }

            if (!state) {
                // Initialize or update state
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const balance = await service.getBalance(address, coinType);

            callback({
                text: "Successfully get the balance from address",
                params: {
                    balance
                },
                action: SuiAction.GET_BALANCE
            });

            SUI_COINTYPE

            return true;
        } catch (err) {
            elizaLogger.error(`Failed to get the balance from address: ${err}`);

            callback({
                text: `Failed to get the balance from address: ${err}`,
                action: SuiAction.GET_BALANCE
            });

            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get sui balance from 0x57ad3f9b7e68bcd67b1ba8ee010ba718a59431616fe8c30ee9e50cf7d018fb16",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you get the balance from address now...",
                    action: "GET_BALANCE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully get the balance from address",
                    params: {
                        balance: {
                            coinType: "0x2::sui::SUI",
                            coinObjectCount: 1,
                            totalBalance: "2733034118",
                            lockedBalance: {}
                        }
                    }
                },
            },
        ]
    ] as ActionExample[][],
} as Action;
