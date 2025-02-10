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
import { extractAddress } from "../utils";
import { SuiAction } from "../enum";

export default {
    name: "GET_PORTFOLIO",
    similes: ["GET_PORTFOLIO"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    description: "Get the portfolio from address",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            elizaLogger.log("Starting GET_PORTFOLIO handler...");

            const address = await extractAddress(runtime, message.content.text);

            elizaLogger.info(`Address: ${address}`);

            const service = runtime.getService<SuiService>(
                ServiceType.TRANSCRIPTION
            );

            if (!state) {
                // Initialize or update state
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const portfolio = await service.getDefiPortfolio(address);

            callback({
                text: `Successfully get the portfolio from ${address}`,
                params: {
                    portfolio
                },
                action: SuiAction.GET_PORTFOLIO
            });

            return true;
        } catch (err) {
            elizaLogger.error(`Failed to get the portfolio from address: ${err}`);

            callback({
                text: `Failed to get the portfolio from address: ${err}`,
                action: SuiAction.GET_PORTFOLIO
            });

            return false;
        }


    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get portfolio from address 0x57ad3f9b7e68bcd67b1ba8ee010ba718a59431616fe8c30ee9e50cf7d018fb16",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you get the portfolio from address now...",
                    action: "GET_PORTFOLIO",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully get the portfolio from address",
                    params: {

                    }
                },
            },
        ]
    ] as ActionExample[][],
} as Action;
