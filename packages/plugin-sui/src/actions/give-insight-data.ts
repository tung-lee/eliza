import { OpenAIEmbeddings } from '@langchain/openai';
import { Action, ActionExample, Memory, IAgentRuntime, State, HandlerCallback, generateText, ModelClass, elizaLogger, RAGKnowledgeItem } from "@elizaos/core";
import { analyzePostPrompt } from "./prompts";
import { ChatDataAction } from "./enum";
import * as fs from 'fs/promises';
import * as path from 'path';
import { getFolderByUserAddress } from '../services/tusky';

// Utility function to write logs to file
async function writeToLog(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        await fs.appendFile('log.txt', logMessage);
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

export interface DataItem {
    data: {
        msg?: string;
        text?: string;
    }[] | {
        msg?: string;
        text?: string;
    };
}

export default {
    name: "DATA_INSIGHT",
    similes: [
        "insight data", "what is the data", "show me the data purpose",
        "give me insights", "data insight"
    ],
    description: "Insight data from all collected data",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return message.content?.text?.length > 0;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: {
            userAddress?: string;
            [key: string]: unknown
        },
        callback?: HandlerCallback
    ) => {
        try {
            await writeToLog("Starting DATA_INSIGHT analysis...");

            // Fetch data using the provided user address or use a default
            const userAddress = options.userAddress || "0xb4b291607e91da4654cab88e5e35ba2921ef68f1b43725ef2faeae045bf5915d";

            // Fetch raw data
            const rawData = await getFolderByUserAddress(userAddress);
            await writeToLog(`Raw data received: ${JSON.stringify(rawData, null, 2)}`);

            if (!rawData || typeof rawData === "string") {
                throw new Error('No valid data found');
            }

            // Process the data to extract text content
            const datapost = rawData.map((item: DataItem) => {
                const data = item.data;
                if (Array.isArray(data)) {
                    return data.map(i => i.text).filter(Boolean);
                } else if (typeof data === 'object' && data !== null) {
                    return data.text ? [data.text] : [];
                }
                return [];
            }).flat();

            await writeToLog(`Processed data posts: ${JSON.stringify(datapost, null, 2)}`);

            if (datapost.length === 0) {
                throw new Error('No valid text content found in the data');
            }

            // Initialize OpenAI Embeddings
            const embeddings = new OpenAIEmbeddings({
                apiKey: process.env.OPENAI_API_KEY,
            });

            // Create embeddings for each post
            const embeddingsData = await embeddings.embedDocuments(datapost);
            await writeToLog(`Embeddings created for data posts: ${JSON.stringify(embeddingsData, null, 2)}`);

            // Create embedding for the user question
            const questionEmbedding = await embeddings.embedDocuments([message.content.text]);

            // Calculate similarity between the question and each post
            const similarities = embeddingsData.map((embedding, index) => {
                return {
                    text: datapost[index],
                    similarity: cosineSimilarity(embedding, questionEmbedding[0])
                };
            });

            // Sort posts by similarity
            similarities.sort((a, b) => b.similarity - a.similarity);

            // Get the most relevant post
            const bestMatch = similarities[0];
            await writeToLog(`Best matching post: ${bestMatch.text}`);

            // const response = await generateText({
            //     runtime,
            //     context: analyzePostPrompt(message.content.text, bestMatch.text),
            //     modelClass: ModelClass.MEDIUM,
            //     stop: ["\n"],
            // });

            // callback?.({
            //     text: response.trim(),
            //     action: ChatDataAction.INSIGHT_DATA,
            //     params: {
            //         label: response.trim()
            //     }
            // });

        } catch (error) {
            await writeToLog(`Error in data analysis: ${error.message}\n${error.stack}`);
            throw error;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What is the trend in crypto posts?"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Recent posts show strong focus on Bitcoin ETF approval and institutional adoption."
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me the data insights"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "The posts discuss various crypto topics including BTC price, ETH ecosystem, and NFT markets."
                }
            }
        ]
    ] as ActionExample[][]
};

// Cosine Similarity function to compare embeddings
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    const dotProduct = vecA.reduce((sum, val, index) => sum + val * vecB[index], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
};
