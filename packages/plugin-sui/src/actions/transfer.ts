import {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    ServiceType,
    State,
    composeContext,
    elizaLogger,
    generateObject,
    type Action,
} from "@elizaos/core";
import { z } from "zod";

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_DECIMALS } from "@mysten/sui/utils";

import { walletProvider } from "../providers/wallet";
import { parseAccount, SuiNetwork } from "../utils";
import { SuiService } from "../services/sui";
import { SuiAction } from "./enum";
import { extractTransferAction } from "./utils";

export default {
    name: "SEND_TOKEN",
    similes: [
        "TRANSFER_TOKEN",
        "TRANSFER_TOKENS",
        "SEND_TOKENS",
        "SEND_SUI",
        "PAY",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    description: "Transfer tokens from address to another address",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            elizaLogger.log("Starting SEND_TOKEN handler...");

            // const walletInfo = await walletProvider.get(runtime, message, state);
            // state.walletInfo = walletInfo;

            // Initialize or update state
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const service = runtime.getService<SuiService>(
                ServiceType.TRANSCRIPTION
            );

            const { senderAddress, recipientAddress, amount } = await extractTransferAction(runtime, message, service);

            const result = await service.transferToken(amount, senderAddress, recipientAddress);

            callback({
                text: `Successfully transferred ${amount} SUI to ${recipientAddress}`,
                params: {
                    amount,
                    recipient: recipientAddress,
                    txBytes: result.txBytesBase64,
                },
                action: SuiAction.TRANSFER_TOKEN
            });

            return true;
        } catch (error) {
            console.error("Error during token transfer:", error);
            if (callback) {
                callback({
                    text: `Error transferring tokens: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 SUI tokens to 0x4f2e63be8e7fe287836e29cde6f3d5cbc96eefd0c0e3f3747668faa2ae7324b0",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 1 SUI tokens now...",
                    action: "SEND_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully sent 1 SUI tokens to 0x4f2e63be8e7fe287836e29cde6f3d5cbc96eefd0c0e3f3747668faa2ae7324b0, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
