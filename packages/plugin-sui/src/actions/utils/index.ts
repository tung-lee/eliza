import { elizaLogger, generateText, generateTextArray, IAgentRuntime, Memory, ModelClass } from "@elizaos/core";
import { extractAddressPrompt, extractAmountPrompt, extractCoinSymbolPrompt } from "../prompts";
import { SuiService } from "../../services/sui";
import { CoinMetadata } from "@mysten/sui/client";

export const extractAddress = async (runtime: IAgentRuntime, textContent: string) => {
    const context = extractAddressPrompt(textContent);
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.MEDIUM,
        stop: ["\n"],
    });

    return response.trim();
}

export const extractCoinSymbol = async (runtime: IAgentRuntime, textContent: string) => {
    const context = extractCoinSymbolPrompt(textContent);
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.MEDIUM,
        stop: ["\n"],
    });

    return response.trim();
}

export const extractAmount = async (runtime: IAgentRuntime, textContent: string) => {
    const context = extractAmountPrompt(textContent);
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.MEDIUM,
        stop: ["\n"],
    });

    return response.trim();
}

export const extractSuiLendAction = async (runtime: IAgentRuntime, message: Memory, suiService: SuiService) => {
    // this is temporary solution

    const address = await extractAddress(runtime, message.content.text);
    elizaLogger.info(`Address: ${address}`);

    const amount = await extractAmount(runtime, message.content.text);
    elizaLogger.info(`Amount: ${amount}`);

    const coinSymbol = await extractCoinSymbol(runtime, message.content.text);
    elizaLogger.info(`Coin Symbol: ${coinSymbol}`);

    const coinType = await suiService.getTokenFromSymbol(coinSymbol) as string;
    elizaLogger.info(`Coin Type: ${coinType}`);

    const coinMetadata = await suiService.getTokenMetadata(coinType);
    elizaLogger.info(`Coin Metadata: ${coinMetadata}`);

    return {
        address,
        amount,
        coinSymbol,
        coinType,
        coinMetadata
    }
}

export const getAmount = (amount: string, coinMetadata: CoinMetadata) => {
    const v = parseFloat(amount);
    return v * (10 ** coinMetadata.decimals);
};
