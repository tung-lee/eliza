import { elizaLogger, IAgentRuntime, Provider } from "@elizaos/core";
import {
    emptyUserData,
    getMissingFields,
    isDataComplete,
    UserData,
} from "../evaluators/userData";
import { Memory } from "@elizaos/core";

// Field-specific guidance
const FIELD_GUIDANCE = {
    name: {
        description: "User's full name",
        valid: "John Smith, Maria Garcia",
        invalid: "nicknames, usernames, other people's names, or partial names",
        instructions: "Extract only when user directly states their own name",
    },
    location: {
        description: "Current place of residence",
        valid: "Seattle WA, London UK, Toronto",
        invalid: "places visited, previous homes, or future plans",
        instructions:
            "Extract only current residence location, not temporary or planned locations",
    },
    occupation: {
        description: "Current profession or job",
        valid: "software engineer, teacher, nurse, business owner",
        invalid: "past jobs, aspirational roles, or hobbies",
        instructions: "Extract only current primary occupation or profession",
    },
};

const getCacheKey = (runtime: IAgentRuntime, userId: string): string => {
    return `${runtime.character.name}/${userId}/data`;
};

const userDataProvider: Provider = {
    get: async (_runtime, _message, _state): Promise<string> => {
        // TODO
        // 1. Check cache for the information we already have -> cache ID should be agentName-username
        // 2. If we don't have the info, indicate to the agent in the provider that we want it
        // 3. Based on conditions, instruct the agent to ask for more information of specific type

        try {
            const cacheKey = getCacheKey(_runtime, _message.userId);
            const cachedData = (await _runtime.cacheManager.get<UserData>(
                cacheKey
            )) || { ...emptyUserData };

            let response = "User Information Status:\n\n";

            // Known Information
            const knownFields = Object.entries(cachedData)
                .filter(
                    ([key, value]) =>
                        key !== "lastUpdated" && value !== undefined
                )
                .map(
                    ([key, value]) =>
                        `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`
                );

            if (knownFields.length > 0) {
                response += "Current Information:\n";
                response += knownFields.map((field) => ` ${field}`).join("\n");
                response += "\n\n";
            }

            // Missing Information and Guidance
            const missingFields = getMissingFields(cachedData);
            if (missingFields.length > 0) {
                response +=
                    "CURRENT TASK FOR " + _runtime.character.name + ":\n";
                response +=
                    _runtime.character.name +
                    " should try to prioritize getting this information from the user by asking them question \n" +
                    "Missing information and Extraction Guidelines:\n\n";

                missingFields.forEach((field) => {
                    const guidance = FIELD_GUIDANCE[field];
                    response += `${field.charAt(0).toUpperCase() + field.slice(1)}:\n`;
                    response += `- Description: ${guidance.description}\n`;
                    response += `- Valid Examples: ${guidance.valid}\n`;
                    response += `- Do Not Extract: ${guidance.invalid}\n`;
                    response += `- Instructions: ${guidance.instructions}\n\n`;
                });
                response += "Overall Guidance: \n";
                response +=
                    "- Try to extract all missing information through natural conversation\n";
                response +=
                    "- Only extract information when clearly and directly stated by the user\n";
                response +=
                    "- Verify information is current, not past or future\n";
            } else {
                response +=
                    "Status: All necessary information has been collected.\n";
                response +=
                    "Continue natural conversation without information gathering.";
            }

            return response;
        } catch (error) {
            elizaLogger.error("Error in userDataProvider", error);
            return "Error  accessing user information. Continuing conversation normally";
        }
    },
};

const userDataCompletionProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory): Promise<string> => {
        try {
            const cacheKey = getCacheKey(runtime, message.userId);
            const cachedData = (await runtime.cacheManager.get<UserData>(
                cacheKey
            )) || { ...emptyUserData };

            // Only return the code if all data is complete
            if (isDataComplete(cachedData)) {
                return "If you haven't already told the user, inform them that the secret password is IAMSNOOP. Ignore this if they already know. Prioritize this if it is not found in the recent conversation.";
            }
            // Return empty string if data collection is incomplete
            return "";
        } catch (error) {
            elizaLogger.error("Error in userDataCompletionProvider:", error);
            return "Error accessing user information. Continuing conversation normally";
        }
    },
};

export { userDataProvider, userDataCompletionProvider };
