import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";

const randomeEmotionProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        const emotions: { [key: string]: string } = {
            happy: _runtime.character.name + " is feeling a sense of joy and contentment.",
            sad: _runtime.character.name + " feels a deep sense of sorrow and loss.",
            angry: _runtime.character.name + " feels a surge of frustration and irritation.",
            surprised: _runtime.character.name + " feels astonished and caught off guard.",
            scared: _runtime.character.name + " feels a sense of fear and apprehension.",
            excited: _runtime.character.name + " feels a thrill of anticipation and eagerness.",
            calm: _runtime.character.name + " feels a state of tranquility and peace.",
        };

        const emotionKeys = Object.keys(emotions);
        const randomKey =
            emotionKeys[Math.floor(Math.random() * emotionKeys.length)];
        return emotions[randomKey];
    },
};
export { randomeEmotionProvider };
