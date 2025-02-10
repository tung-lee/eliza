import { Action, ActionExample, Memory, IAgentRuntime, State, HandlerCallback, generateText, ModelClass, elizaLogger } from "@elizaos/core";
import { getFolderByUserAddress } from "../services/tusky";
import { analyzeSentimentPrompt } from "./prompts";
import { SentimentAction } from "./enum";

export default {
    name: "ANALYZE_SENTIMENT",
    similes: [
        "CHECK_SENTIMENT", "ANALYZE_POSTS", "ANALYZE", "SENTIMENT"
    ],
    description: "Analyze sentiment of text content and classify as positive, negative, or neutral",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return message.content?.text?.length > 0;
    },
    handler: async (runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback) => {
        try {
            const context = analyzeSentimentPrompt(message.content.text);
            const response = await generateText({
                runtime,
                context,
                modelClass: ModelClass.MEDIUM,
                stop: ["\n"],
            });

            callback({
                text: response.trim(),
                action: SentimentAction.FILTER_TWEETS,
                params: {
                    label: response.trim()
                }
            })

        } catch (error) {
            console.error('Error in sentiment analysis:', error);
            throw error;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "sentiment analysis: BTC smashing through ATH! $69k was just the beginning! 🚀"
                }
            },
            {
                user: "{{user2}}",
                content: {
                }
            }
        ]
    ] as ActionExample[][]
};

export interface TwitterPost {
    id: string;
    text: string;
    userId: string;
    createdAt: Date;
}
