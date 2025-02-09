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
