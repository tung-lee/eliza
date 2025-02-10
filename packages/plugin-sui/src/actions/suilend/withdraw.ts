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
import { NORMALIZED_DEEP_COINTYPE } from "@suilend/frontend-sui";
import { extractSuiLendAction } from "../utils";
import { SuiLendAction } from "../enum";

export default {
    name: "WITHDRAW_TOKEN",
    similes: ["WITHDRAW_TOKENS"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    description: "Withdraw a token from the suilend protocol",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            elizaLogger.log("Starting WITHDRAW_TOKEN handler...");

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

            const result = await suiService.withdrawBySuilend(coinType, Number(amount), address)

            callback({
                text: `Successfully withdrew ${amount} ${coinSymbol} from suilend`,
                params: {
                    coinMetadata,
                    amount: amount,
                    txBytes: result.txBytesBase64,
                },
                action: SuiLendAction.WITHDRAW_TOKEN_SUILEND
            });

            return true;
        } catch (error) {

            elizaLogger.error(`Failed to withdraw token: ${error}`);

            callback({
                text: `Failed to withdraw token: ${error}`,
                action: SuiLendAction.WITHDRAW_TOKEN_SUILEND
            })

            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Withdraw 1 SUI from suilend",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you withdraw 1 SUI from suilend now...",
                    action: "WITHDRAW_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully withdrew 1 SUI from suilend",
                },
            },
        ]
    ] as ActionExample[][],
} as Action;
