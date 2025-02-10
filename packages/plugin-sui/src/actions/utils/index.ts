import { elizaLogger, generateText, generateTextArray, IAgentRuntime, Memory, ModelClass } from "@elizaos/core";
import { extractAddressPrompt, extractAmountPrompt, extractCoinSymbolPrompt, extractRecipientAddressPrompt, extractSenderAddressPrompt, extractSwapFromTokenPrompt, extractSwapToTokenPrompt } from "../prompts";
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

export const extractSenderAddress = async (runtime: IAgentRuntime, textContent: string) => {
    const context = extractSenderAddressPrompt(textContent);
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.MEDIUM,
        stop: ["\n"],
    });

    return response.trim();
}

export const extractRecipientAddress = async (runtime: IAgentRuntime, textContent: string) => {
    const context = extractRecipientAddressPrompt(textContent);
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

export const extractSwapFromToken = async (runtime: IAgentRuntime, textContent: string) => {
    const context = extractSwapFromTokenPrompt(textContent);
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.MEDIUM,
        stop: ["\n"],
    });

    return response.trim();
}

export const extractSwapToToken = async (runtime: IAgentRuntime, textContent: string) => {
    const context = extractSwapToTokenPrompt(textContent);
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.MEDIUM,
        stop: ["\n"],
    });

    return response.trim();
}


export const extractSwapAction = async (runtime: IAgentRuntime, message: Memory, suiService: SuiService) => {
    const address = await extractAddress(runtime, message.content.text);
    elizaLogger.info(`Address: ${address}`);

    const amount = await extractAmount(runtime, message.content.text);
    elizaLogger.info(`Amount: ${amount}`);

    const fromTokenSymbol = await extractSwapFromToken(runtime, message.content.text);
    elizaLogger.info(`From Token Symbol: ${fromTokenSymbol}`);

    const fromTokenAddress = await suiService.getTokenFromSymbol(fromTokenSymbol) as string;
    elizaLogger.info(`From Token Address: ${fromTokenAddress}`);

    const fromTokenMetadata = await suiService.getTokenMetadata(fromTokenAddress);
    elizaLogger.info(`From Token Metadata: ${fromTokenMetadata}`);

    const toTokenSymbol = await extractSwapToToken(runtime, message.content.text);
    elizaLogger.info(`To Token Symbol: ${toTokenSymbol}`);

    const toTokenAddress = await suiService.getTokenFromSymbol(toTokenSymbol) as string;
    elizaLogger.info(`To Token Address: ${toTokenAddress}`);

    const toTokenMetadata = await suiService.getTokenMetadata(toTokenAddress);
    elizaLogger.info(`To Token Metadata: ${toTokenMetadata}`);

    return {
        address,
        amount,
        fromTokenAddress,
        toTokenAddress,
        fromTokenMetadata,
        toTokenMetadata
    }
}

export const extractTransferAction = async (runtime: IAgentRuntime, message: Memory, suiService: SuiService) => {
    const senderAddress = await extractSenderAddress(runtime, message.content.text);
    elizaLogger.info(`Sender Address: ${senderAddress}`);

    const recipientAddress = await extractRecipientAddress(runtime, message.content.text);
    elizaLogger.info(`Recipient Address: ${recipientAddress}`);

    const amount = await extractAmount(runtime, message.content.text);
    elizaLogger.info(`Amount: ${amount}`);

    const tokenSymbol = await extractCoinSymbol(runtime, message.content.text);
    elizaLogger.info(`Token Symbol: ${tokenSymbol}`);

    const tokenAddress = await suiService.getTokenFromSymbol(tokenSymbol) as string;
    elizaLogger.info(`Token Address: ${tokenAddress}`);

    const tokenMetadata = await suiService.getTokenMetadata(tokenAddress);
    elizaLogger.info(`Token Metadata: ${tokenMetadata}`);

    return {
        senderAddress,
        recipientAddress,
        amount,
        tokenAddress,
        tokenMetadata
    }
}

export const getAmount = (amount: string, coinMetadata: CoinMetadata) => {
    const v = parseFloat(amount);
    return v * (10 ** coinMetadata.decimals);
};
