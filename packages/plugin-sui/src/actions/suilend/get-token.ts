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
import { symbol, z } from "zod";
import { extractSuiLendAction } from "../utils";
import { SuiAction } from "../enum";

export default {
    name: "GET_METADATA_TOKEN",
    similes: ["GET_METADATA_TOKEN"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        console.log("Validating sui transfer from user:", message.userId);
        return true;
    },
    description: "Get metadata of the token from coin type",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            elizaLogger.log("Starting GET_TOKEN handler...");

            const suiService = runtime.getService<SuiService>(
                ServiceType.TRANSCRIPTION
            );

            const { coinMetadata } = await extractSuiLendAction(runtime, message, suiService);

            if (!state) {
                // Initialize or update state
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            callback({
                text: `Successfully get the token metadata`,
                params: {
                    coinMetadata
                },
                action: SuiAction.GET_METADATA_TOKEN
            });
            return true;
        } catch (error) {
            elizaLogger.error(`Failed to get token metadata: ${error}`);

            callback({
                text: `Failed to get token metadata: ${error}`,
                action: SuiAction.GET_METADATA_TOKEN
            });

            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get the balance from address",
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
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get the balance from address",
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
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
