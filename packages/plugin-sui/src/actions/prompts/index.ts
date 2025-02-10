export const extractAddressPrompt = (textContent: string) => {
    return `
        Extract only the address from this message: "${textContent}"
        Rules:
        - Return ONLY the address without any explanation
        - Do not include quotes or punctuation
        - Do not include phrases like "I think" or "the address is"
        `;
}

export const extractCoinSymbolPrompt = (textContent: string) => {
    return `
        Extract only the coin symbol from this message: "${textContent}"
        Rules:
        - Return ONLY the coin symbol without any explanation
        - Do not include quotes or punctuation
        - Do not include phrases like "I think" or "the coin symbol is"
        `;
}

export const extractAmountPrompt = (textContent: string) => {
    return `
        Extract only the amount from this message: "${textContent}"
        Rules:
        - Return ONLY the amount without any explanation
        - Do not include quotes or punctuation
        - Do not include phrases like "I think" or "the amount is"
        `;
}

export const extractSwapFromTokenPrompt = (textContent: string) => {
    return `
        Extract only the source/from token symbol from this message: "${textContent}"
        Rules:
        - Return ONLY the token symbol (like SUI, USDC, ETH) without any explanation
        - Do not include quotes or punctuation
        - Do not include phrases like "I think" or "the token is"
        - If multiple tokens are mentioned, return the one that comes after "from" or is mentioned first
        `;
}

export const extractSwapToTokenPrompt = (textContent: string) => {
    return `
        Extract only the destination/to token symbol from this message: "${textContent}"
        Rules:
        - Return ONLY the token symbol (like SUI, USDC, ETH) without any explanation
        - Do not include quotes or punctuation
        - Do not include phrases like "I think" or "the token is"
        - If multiple tokens are mentioned, return the one that comes after "to" or is mentioned first
        `;
}

export const extractSenderAddressPrompt = (textContent: string) => {
    return `
        Extract only the sender address from this message: "${textContent}"
        Rules:
        - Return ONLY the address without any explanation
        - Do not include quotes or punctuation
        - Do not include phrases like "I think" or "the address is"
        - If multiple addresses are mentioned, return the one that comes after "from" or "sender" or is mentioned first
        - The address should be in the correct Sui format (0x followed by hex characters)
        `;
}

export const extractRecipientAddressPrompt = (textContent: string) => {
    return `
        Extract only the recipient address from this message: "${textContent}"
        Rules:
        - Return ONLY the address without any explanation
        - Do not include quotes or punctuation
        - Do not include phrases like "I think" or "the address is"
        - If multiple addresses are mentioned, return the one that comes after "to" or "recipient" or is mentioned second
        - The address should be in the correct Sui format (0x followed by hex characters)
        `;
}
