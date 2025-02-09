import { ModelClass } from "@elizaos/core";
import {
    elizaLogger,
    generateObject,
    IAgentRuntime,
    Memory,
} from "@elizaos/core";
import { Evaluator } from "@elizaos/core";

export interface UserData {
    name: string | undefined;
    location: string | undefined;
    occupation: string | undefined;
    lastUpdated: number | undefined;
}

// Initial user data
export const emptyUserData: UserData = {
    name: undefined,
    location: undefined,
    occupation: undefined,
    lastUpdated: undefined,
};

// Helper functions
const getCacheKey = (runtime: IAgentRuntime, userId: string): string => {
    return `${runtime.character.name}/${userId}/data`;
};

export const getMissingFields = (
    data: UserData
): Array<keyof Omit<UserData, "lastUpdated">> => {
    const fields: Array<keyof Omit<UserData, "lastUpdated">> = [
        "name",
        "location",
        "occupation",
    ];
    return fields.filter((field) => !data[field]);
};

export const isDataComplete = (data: UserData): boolean => {
    return getMissingFields(data).length === 0;
};

export const userDataEvaluator: Evaluator = {
    name: "GET_USER_DATA",
    similes: [
        "EXTRACT_USER_INFO",
        "GET_USER_INFORMATION",
        "COLLECT_USER_DATA",
        "USER_DETAILS",
    ],
    description:
        "Extract user's name, location, occupation from conversation when clearly stated",
    alwaysRun: true,
    validate: async (
        runtime: IAgentRuntime,
        message: Memory
    ): Promise<boolean> => {
        try {
            const cacheKey = getCacheKey(runtime, message.userId);
            const cachedData = (await runtime.cacheManager.get<UserData>(
                cacheKey
            )) || { ...emptyUserData };

            return !isDataComplete(cachedData);
        } catch (error) {
            elizaLogger.error("Error in userDataEvalutor: ", error);
            return false;
        }
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const cacheKey = getCacheKey(runtime, message.userId);
            const cachedData = (await runtime.cacheManager.get<UserData>(
                cacheKey
            )) || { ...emptyUserData };

            const extractionTemplate = `
            Analyze the following conversation to extract personal information.
            Only extract information when it is explicitly and clearly stated by the user about themselves.

            Conversation:
            ${message.content.text}

            Return a JSON object containing only the fields where information was clearly found:
            {
                "name": "extracted full name if stated",
                "location": "extracted current residence if stated",
                "occupation": "extracted current occupation if stated"
            }

            Only include fields where information is explicitly stated and current.
            Omit fields if information is unclear, hypothetical, or about others.
            `;

            const extractedInfo = await generateObject({
                runtime,
                context: extractionTemplate,
                modelClass: ModelClass.MEDIUM,
            });

            let dataUpdated = false;

            // Update only undefined fields with new information
            for (const field of ["name", "location", "occupation"] as const) {
                if (extractedInfo[field] && cachedData[field] === undefined) {
                    cachedData[field] = extractedInfo[field];
                    dataUpdated = true;
                }
            }

            if (dataUpdated) {
                cachedData.lastUpdated = Date.now();
                await runtime.cacheManager.set(cacheKey, cachedData, {
                    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week cache
                });

                if (isDataComplete(cachedData)) {
                    elizaLogger.success(
                        "User data collection completed:",
                        cachedData
                    );

                    // DO SOME API CALL HERE
                }
            }
        } catch (error) {
            elizaLogger.error("Error in userDataEvalutor: ", error);
        }
    },
    examples: [
        {
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Hi everyone! I'm John Smith, a software engineer living in Seattle WA.",
                    },
                },
            ],
            context: "Initial user introduction",
            outcome: JSON.stringify({
                name: "John Smith",
                location: "Seattle WA",
                occupation: "software engineer",
            }),
        },
        {
            messages: [
                {
                    user: "{{user2}}",
                    content: {
                        text: "Hello! My name is Maria Garcia, and I work as a teacher in London UK.",
                    },
                },
            ],
            context: "User sharing their job",
            outcome: JSON.stringify({
                name: "Maria Garcia",
                location: "London UK",
                occupation: "teacher",
            }),
        },
        {
            messages: [
                {
                    user: "{{user3}}",
                    content: {
                        text: "I'm Alex Johnson, currently a nurse based in Toronto.",
                    },
                },
            ],
            context: "User discussing their profession",
            outcome: JSON.stringify({
                name: "Alex Johnson",
                location: "Toronto",
                occupation: "nurse",
            }),
        },
        {
            messages: [
                {
                    user: "{{user4}}",
                    content: {
                        text: "Hi! I'm Emily Davis, a business owner from New York.",
                    },
                },
            ],
            context: "User introducing themselves",
            outcome: JSON.stringify({
                name: "Emily Davis",
                location: "New York",
                occupation: "business owner",
            }),
        },
        {
            messages: [
                {
                    user: "{{user5}}",
                    content: {
                        text: "Hey there! I'm Chris Brown, a graphic designer living in Los Angeles.",
                    },
                },
            ],
            context: "User sharing their location and job",
            outcome: JSON.stringify({
                name: "Chris Brown",
                location: "Los Angeles",
                occupation: "graphic designer",
            }),
        },
    ],
};
