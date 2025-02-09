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
import { SuiService } from "../../services/agent/sui";
import { z } from "zod";
import { SuiLendService } from "../../services/suilend";

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
        const context = `
        Extract only the symbol of token from this message: "${message.content.text}"
        Rules:
        - Return ONLY the symbol without any explanation
        - Do not include quotes or punctuation
        - Do not include phrases like "I think" or "the symbol is"
        `;

        const response = await generateText({
            runtime: runtime,
            context,
            modelClass: ModelClass.MEDIUM,
        });

        const symbol = response.trim();

        elizaLogger.info(`Symbol: ${symbol}`);


        elizaLogger.log("Starting GET_TOKEN handler...");

        const suiLendService = runtime.getService<SuiLendService>(
            ServiceType.TRANSCRIPTION
        );

        if (!state) {
            // Initialize or update state
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const coinType = await suiLendService.getTokenFromSymbol(symbol);

        elizaLogger.info(`Coin type: ${coinType}`);

        const token = await suiLendService.getToken(coinType as string);

        elizaLogger.info(`Token: ${token}`);

        callback({
            text: `Successfully get the token metadata`,
            params: {
                token
            },
        });

        // if (service.getNetwork() == "mainnet") {
        //     // Validate transfer content
        //     if (!isSwapContent(swapContent)) {
        //         console.error("Invalid content for SWAP_TOKEN action.");
        //         if (callback) {
        //             callback({
        //                 text: "Unable to process swap request. Invalid content provided.",
        //                 content: { error: "Invalid transfer content" },
        //             });
        //         }
        //         return false;
        //     }

        //     const destinationToken = await service.getTokenMetadata(
        //         swapContent.destination_token
        //     );

        //     elizaLogger.log("Destination token:", destinationToken);

        //     const fromToken = await service.getTokenMetadata(
        //         swapContent.from_token
        //     );

        //     elizaLogger.log("From token:", fromToken);

        //     // one action only can call one callback to save new message.
        //     // runtime.processActions
        //     if (destinationToken && fromToken) {
        //         try {
        //             const swapAmount = service.getAmount(
        //                 swapContent.amount,
        //                 fromToken
        //             );

        //             elizaLogger.info("Swap amount:", swapAmount);

        //             elizaLogger.info(
        //                 "Destination token address:",
        //                 destinationToken.tokenAddress
        //             );

        //             elizaLogger.info(
        //                 "From token address:",
        //                 fromToken.tokenAddress
        //             );

        //             elizaLogger.info("Swap amount:", swapAmount);

        //             const result = await service.swapToken(
        //                 fromToken.symbol,
        //                 swapAmount.toString(),
        //                 0,
        //                 destinationToken.symbol
        //             );

        //             if (result.success) {
        //                 callback({
        //                     text: `Successfully swapped ${swapContent.amount} ${swapContent.from_token} to  ${swapContent.destination_token}, Transaction: ${service.getTransactionLink(
        //                         result.tx
        //                     )}`,
        //                     content: swapContent,
        //                 });
        //             }
        //         } catch (error) {
        //             elizaLogger.error("Error swapping token:", error);
        //             callback({
        //                 text: `Failed to swap ${error}, swapContent : ${JSON.stringify(
        //                     swapContent
        //                 )}`,
        //                 content: { error: "Failed to swap token" },
        //             });
        //         }
        //     } else {
        //         callback({
        //             text: `destination token: ${swapContent.destination_token} or from token: ${swapContent.from_token} not found`,
        //             content: { error: "Destination token not found" },
        //         });
        //     }
        // } else {
        //     callback({
        //         text:
        //             "Sorry, I can only swap on the mainnet, parsed params : " +
        //             JSON.stringify(swapContent, null, 2),
        //         content: { error: "Unsupported network" },
        //     });
        //     return false;
        // }

        return true;
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
