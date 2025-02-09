import { Plugin } from "@elizaos/core";
import { helloWorldAction } from "./actions/helloworld.ts";
import { currentNewsAction } from "./actions/currentnews.ts";
import { factEvaluator } from "./evaluators/fact.ts";
import { randomeEmotionProvider } from "./providers/randomEmotion.ts";
import { userDataEvaluator } from "./evaluators/userData.ts";
import {
    userDataCompletionProvider,
    userDataProvider,
} from "./providers/userData.ts";

export * as actions from "./actions/index.ts";
export * as evaluators from "./evaluators/index.ts";
export * as providers from "./providers/index.ts";

export const devSchoolPlugin: Plugin = {
    name: "devSchool",
    description: "DevSchool example plugin",
    actions: [helloWorldAction, currentNewsAction],
    evaluators: [factEvaluator, userDataEvaluator],
    providers: [
        randomeEmotionProvider,
        userDataProvider,
        userDataCompletionProvider,
    ],
};
export default devSchoolPlugin;
