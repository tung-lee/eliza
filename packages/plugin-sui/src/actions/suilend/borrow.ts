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
import { extractAddress, extractSuiLendAction, getAmount } from "../utils";
import { SuiLendAction } from "../enum";

export default {
    name: "BORROW_TOKEN",
    similes: ["BORROW_TOKENS"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    description: "Borrow a token from the suilend protocol",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting BORROW_TOKEN handler...");

        const suiService = runtime.getService<SuiService>(
            ServiceType.TRANSCRIPTION
        );

        const { address, amount, coinSymbol, coinType, coinMetadata } = await extractSuiLendAction(runtime, message, suiService);

        if (!state) {
            // Initialize or update state
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const result = await suiService.borrowBySuilend(coinType, getAmount(amount, coinMetadata), address)


        callback({
            text: `Successfully borrowed ${amount} ${coinSymbol} from suilend`,
            content: {
                coinMetadata,
                amount: getAmount(amount, coinMetadata),
                txBytes: result.txBytesBase64,
            },
            action: SuiLendAction.BORROW_TOKEN_SUILEND
        });

        return true;
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Borrow 1 SUI from suilend",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you borrow 1 SUI from suilend now...",
                    action: "BORROW_TOKEN_SUILEND",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully borrowed 1 SUI from suilend"
                },
            },
        ]
    ] as ActionExample[][],
} as Action;
