import { HandlerCallback } from "@elizaos/core";
import { State } from "@elizaos/core";
import {
    ActionExample,
    IAgentRuntime,
    Memory,
    type Action,
} from "@elizaos/core";

export const helloWorldAction: Action = {
    name: "HELLO_WORLD",
    similes: ["HELLO"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
        // return Math.random() > 0.5; // 50% chance of triggering
    },
    description: "Make a cool Hello World ASCII art",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: { [key: string]: unknown },
        _callback: HandlerCallback
    ): Promise<boolean> => {
        // do sth

        // do more things

        const helloWorld = `
        H   H  EEEEE  L      L       OOO
        H   H  E      L      L      O   O
        HHHHH  EEEE   L      L      O   O
        H   H  E      L      L      O   O
        H   H  EEEEE  LLLLL  LLLLL   OOO
        `;

        _callback({
            text: `Hey I did the thing, here's the result: ${helloWorld}`,
        });

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Can you show me a Hello World?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "HELLO_WORLD" },
            },
            {
                user: "{{user1}}",
                content: { text: "What does your Hello World look like?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "HELLO_WORLD" },
            },
            {
                user: "{{user1}}",
                content: { text: "I'd love to see a Hello World example!" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "HELLO_WORLD" },
            },
        ],
    ] as ActionExample[][],
} as Action;
