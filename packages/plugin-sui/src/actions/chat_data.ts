// import { Action, ActionExample, Memory, IAgentRuntime, State, HandlerCallback, generateText, ModelClass, elizaLogger } from "@elizaos/core";
// import { getFolderByUserAddress } from "../services/tusky";
// import { analyzePostSuiPrompt } from "./prompts";
// import { SentimentAction } from "./enum";

// export default {
//     name: "ANALYZE_SENTIMENT",
//     similes: [
//         "CHECK_SENTIMENT", "ANALYZE_POSTS", "ANALYZE", "SENTIMENT"
//     ],
//     description: "Analyze sentiment of text content and classify as positive, negative, or neutral",

//     validate: async (runtime: IAgentRuntime, message: Memory) => {
//         return message.content?.text?.length > 0;
//     },
//     handler: async (runtime: IAgentRuntime,
//         message: Memory,
//         state: State,
//         _options: { [key: string]: unknown },
//         callback?: HandlerCallback) => {
//         try {
//             const context = analyzePostSuiPrompt(message.content.text, datapost);
//             const response = await generateText({
//                 runtime,
//                 context,
//                 modelClass: ModelClass.MEDIUM,
//                 stop: ["\n"],
//             });

//             callback({
//                 text: response.trim(),
//                 action: SentimentAction.FILTER_TWEETS,
//                 params: {
//                     label: response.trim()
//                 }
//             })

//         } catch (error) {
//             console.error('Error in sentiment analysis:', error);
//             throw error;
//         }
//     },
//     examples: [
//         [
//             {
//                 user: "{{user1}}",
//                 content: {
//                     text: "sentiment analysis: BTC smashing through ATH! $69k was just the beginning! 🚀"
//                 }
//             },
//             {
//                 user: "{{user2}}",
//                 content: {
//                 }
//             }
//         ]
//     ] as ActionExample[][]
// };

// export interface TwitterPost {
//     id: string;
//     text: string;
//     userId: string;
//     createdAt: Date;
// }

import { Action, ActionExample, Memory, IAgentRuntime, State, HandlerCallback, generateText, ModelClass, elizaLogger } from "@elizaos/core";
import { analyzePostSuiPrompt } from "./prompts";
import { ChatDataAction } from "./enum";
import { getFolderByUserAddress } from '../getFolderdata';
import dotenv from 'dotenv';
dotenv.config();

export default {
    name: "DATA_INSIGHT",
    similes: [
        "insight data", "what is the data", "show me the data purpose", "give me insights", "data insight"
    ],
    description: "Insight data from the all of post",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return message.content?.text?.length > 0;
    },

    handler: async (runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback) => {
        try {
            console.log("Starting to fetch data...");
            
            const rawData = await getFolderByUserAddress(
                "0xb4b291607e91da4654cab88e5e35ba2921ef68f1b43725ef2faeae045bf5915d"
            );
            console.log("Raw data received:", rawData);

            if (!rawData || typeof rawData === "string") {
                throw new Error('No valid data found');
            }

            const datapost = rawData.map((item: any) => {
                if (!item.data.msg) {
                    return item.data.map((i: any) => i.text).filter(Boolean);
                }
                return [];
            }).flat();
            
            console.log("Processed data posts:", datapost);

            const combinedText = datapost.join(' ');
            console.log("Combined text length:", combinedText.length);
            console.log("Sample of combined text:", combinedText.substring(0, 200)); 

            const context = analyzePostSuiPrompt(message.content.text, combinedText);

            const response = await generateText({
                runtime,
                context,
                modelClass: ModelClass.MEDIUM,
                stop: ["\n"],
            });

            callback({
                text: response.trim(),
                action: ChatDataAction.INSIGHT_DATA,
                params: {
                    label: response.trim()
                }
            });

        } catch (error) {
            console.error('Error in data analysis:', error);
            throw error;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What is the data?"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Here is the data insight based on recent posts."
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Insight data"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Data insights: The posts contain a variety of perspectives."
                }
            }
        ]
    ] as ActionExample[][]
};

export interface TwitterPost {
    text: string;
}
