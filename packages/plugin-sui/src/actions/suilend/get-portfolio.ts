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

        const context = `
Extract only the address from this message: "${message.content.text}"
Rules:
- Return ONLY the address without any explanation
- Do not include quotes or punctuation
- Do not include phrases like "I think" or "the address is"
`;

        const response = await generateText({
            runtime: runtime,
            context,
            modelClass: ModelClass.MEDIUM,
        });

        const address = response.trim();

        elizaLogger.info(`Address: ${address}`);

        elizaLogger.log("Starting GET_PORTFOLIO handler...");

        const service = runtime.getService<SuiService>(
            ServiceType.TRANSCRIPTION
        );

        if (!state) {
            // Initialize or update state
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        elizaLogger.info(`Getting portfolio for address: ${service.getDefiPortfolio}`);
        const portfolio = await service.getDefiPortfolio(address);

        callback({
            text: "Successfully get the portfolio from address",
            content: {
                portfolio
            },
            params: {
                portfolio
            },
        });

        return true;
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get the portfolio from address",
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
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get the portfolio from address",
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
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
