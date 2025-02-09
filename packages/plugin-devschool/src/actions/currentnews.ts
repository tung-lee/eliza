import {
    composeContext,
    elizaLogger,
    generateText,
    HandlerCallback,
    ModelClass,
} from "@elizaos/core";
import { Content } from "@elizaos/core";
import { State } from "@elizaos/core";
import {
    ActionExample,
    IAgentRuntime,
    Memory,
    type Action,
} from "@elizaos/core";

export const currentNewsAction: Action = {
    name: "CURRENT_NEWS",
    similes: ["NEWS", "GET_CURRENT_NEWS"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
        // return Math.random() > 0.5; // 50% chance of triggering
    },
    description: "Get current news for a search term if asked by user",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: { [key: string]: unknown },
        _callback: HandlerCallback
    ): Promise<boolean> => {
        async function getCurrentNews(searchTerm: string) {
            const response = await fetch(
                `https://newsapi.org/v2/everything?q=${searchTerm}&apiKey=${process.env.NEWS_API_KEY}`
            );
            const data = await response.json();
            return data.articles
                .slice(0, 5)

                .map(
                    (article) =>
                        `${article.title}\n${article.description}\n${article.url}\n${article.content.slice(0, 1000)}`
                )
                .join("\n\n");
        }

        // 1. Get the search term from prompt

        // const template = `
        // {{recentConversation}}
        // Extract the search term from {{userName}} prompt. The message is: ${_message.content.text}
        // `;

        // inject the username into the template
        // const context = await composeContext({
        //     state: _state,
        //     template,
        // });

        // const context = `
        // Extract the search term from user's prompt. The message is: ${_message.content.text}
        // Only response with the search term, do not include any other text.
        // `;
        const context = `
Extract only the search term from this message: "${_message.content.text}"
Rules:
- Return ONLY the search term without any explanation
- Do not include quotes or punctuation
- Do not include phrases like "I think" or "the search term is"
`;

        const response = await generateText({
            runtime: _runtime,
            context,
            modelClass: ModelClass.MEDIUM, // chat complete provider model
            stop: ["\n"],
        });

        // const searchTerm = "deepseek";
        const searchTerm = response;

        elizaLogger.info(`Search term: ${searchTerm}`);

        const currentNews = await getCurrentNews(searchTerm);
        const respText = `Here are the current news for ${searchTerm}:\n${currentNews}`;

        // _callback({
        //     text: respText,
        // });

        const newMemory: Memory = {
            userId: _message.userId,
            agentId: _message.agentId,
            roomId: _message.roomId,
            content: {
                text: respText,
                action: "CURRENT_NEWS_RESPONSE",
                source: _message.content.source,
            } as Content,
        };

        await _runtime.messageManager.createMemory(newMemory);

        _callback(newMemory.content);

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What's the latest news on a16z?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT_NEWS" },
            },
            {
                user: "{{user1}}",
                content: { text: "Can you find news about AI advancements?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT_NEWS" },
            },
            {
                user: "{{user1}}",
                content: { text: "Any updates on the tech industry?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT_NEWS" },
            },
        ],
    ] as ActionExample[][],
} as Action;
