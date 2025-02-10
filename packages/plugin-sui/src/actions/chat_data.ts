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
import fs from 'fs';

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
            // Read data from data.ts file
            const fileData = fs.readFileSync('src/database/data.ts', 'utf-8');
            
            // Parse JSON data from file
            const parsedData = JSON.parse(fileData);
    
            // Check if data is not an array or has no valid posts
            if (!Array.isArray(parsedData) || parsedData.length === 0) {
                throw new Error('No valid posts found in the file');
            }
    
            // Filter posts from parsedData to get only text
            const datapost = parsedData.map((item: any) => item.text);
    
            // Convert array of posts into a single string
            const combinedText = datapost.join(' ');  // Join all posts together
    
            // Create context for sentiment analysis
            const context = analyzePostSuiPrompt(message.content.text, combinedText);
    
            // Send prompt to model and get response
            const response = await generateText({
                runtime,
                context,
                modelClass: ModelClass.MEDIUM,
                stop: ["\n"],
            });
    
            // Send callback with analysis results
            callback({
                text: response.trim(),
                action: ChatDataAction.INSIGHT_DATA,
                params: {
                    label: response.trim()
                }
            });
    
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
