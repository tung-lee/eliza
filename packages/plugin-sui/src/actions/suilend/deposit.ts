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
import { SuiLendAction } from "../enum";
import { extractAddress, extractAmount, extractCoinSymbol, extractSuiLendAction, getAmount } from "../utils";

export default {
    name: "DEPOSIT_TOKEN",
    similes: ["DEPOSIT_TOKENS", "DEPOSIT_TOKEN_SUILEND"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    description: "Deposit a token to the suilend protocol",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            elizaLogger.log("Starting DEPOSIT_TOKEN_SUILEND handler...");

            const suiService = runtime.getService<SuiService>(
                ServiceType.TRANSCRIPTION
            );

            const { address, amount, coinSymbol, coinType, coinMetadata } = await extractSuiLendAction(runtime, message, suiService);

            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }


            const result = await suiService.depositBySuilend(coinType, Number(amount), address)

            callback({
                text: `Successfully deposited ${amount} ${coinSymbol} to suilend`,
                params: {
                    coinMetadata,
                    amount: amount,
                    txBytes: result.txBytesBase64,
                },
                action: SuiLendAction.DEPOSIT_TOKEN_SUILEND
            });

            return true;
        } catch (error) {
            elizaLogger.error(`Error in DEPOSIT_TOKEN_SUILEND handler: ${error}`);
            callback({
                text: `Failed to deposit to suilend: ${error.message}`,
                action: SuiLendAction.DEPOSIT_TOKEN_SUILEND,
                error: true
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
                    action: SuiLendAction.DEPOSIT_TOKEN_SUILEND
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully deposited 1 SUI to suilend, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0",
                    params: {
                        coinMetadata: {
                            name: "SUI",
                            symbol: "",
                            decimals: 9,
                        },
                        amount: 1,
                        txBytes: "",
                    }
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
