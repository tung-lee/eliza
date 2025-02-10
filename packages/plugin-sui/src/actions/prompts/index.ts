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

export const analyzeSentimentPrompt = (textContent: string) => {
    return `
        Classify this Sui blockchain-related Twitter post: "${textContent}"
        RETURN EXACTLY ONE WORD FROM: [LEGITIMATE|SCAM|NEUTRAL]

        Classification Guide:
        SCAM indicators (if ANY are present, classify as SCAM):
        - Unrealistic promises (1000x gains, guaranteed returns, instant wealth)
        - Fake giveaways or airdrops requiring deposits/fees
        - Requests for private keys, seed phrases, or wallet verification
        - Impersonation of Sui Foundation, Mysten Labs, or known figures
        - Suspicious links to unknown/cloned websites
        - Urgency or FOMO tactics ("limited time", "last chance", "ending soon")
        - Requests to DM for "exclusive" opportunities
        - Unauthorized presales or token offerings
        - Claims of "protocol upgrades" requiring immediate action
        - Multiple spam-like emoji patterns (🚀💰💎)
        - Requests to connect wallets on unofficial sites
        - Copy-paste spam campaigns

        LEGITIMATE indicators:
        - Posts from verified Sui Foundation/Mysten Labs accounts
        - Official protocol updates with verifiable links
        - Technical discussions about Sui/Move development
        - Posts from known and verified Sui ecosystem projects
        - Links to official documentation or GitHub
        - Announcements through official channels

        NEUTRAL content:
        - General price discussions and market analysis
        - Personal opinions about Sui ecosystem
        - Community questions and support
        - Memes and casual content
        - Project reviews without investment advice

        IMPORTANT: Return only one word - LEGITIMATE or SCAM or NEUTRAL. No other text allowed.
        `;
}
export const analyzePostSuiPrompt = (textContent: string, datapost: string) => {
    return `
        Answer the following questions: "${textContent}" base on the data: "${datapost}"
        RETURN paragraph with the following structure:

1. Market Performance Overview:
   - Correlation analysis between post sentiment and price movements
   - Best posting times relative to market conditions
   - Top 5 best-performing posts and their market context
   - Average engagement rates by content type (price news, technical analysis, project updates...)

2. Content Analysis by Theme:
   - Categorize posts by topics: Technical Analysis, Project News, DeFi, NFTs, Metaverse, Layer 2...
   - Most mentioned trending coins/tokens
   - Performance evaluation of content elements (technical charts, infographics, analysis videos...)
   - Performance comparison between in-depth analysis vs quick news updates
   - Hash tag effectiveness and trending topics

3. Community Behavior Analysis:
   - Comment sentiment analysis (positive/negative/neutral)
   - Common questions/concerns from the community
   - Community trust level in predictions/analysis
   - Peak engagement times for different user groups (traders, holders, newcomers...)
   - Most engaged community members and their influence

4. Market Trends and Comparative Analysis:
   - Post sentiment comparison with general market trends
   - Detection of emerging narratives and themes
   - Assessment of community trading behavior changes
   - Benchmarking against other crypto influencers/channels
   - Viral content patterns and success factors

5. Cross-Platform Performance:
   - Engagement comparison across different platforms
   - Platform-specific content effectiveness
   - Audience overlap and unique characteristics
   - Best performing content formats by platform

6. Insight & Recommendations:
   - 3-4 key insights about crypto community behavior
   - Content strategy recommendations for different market phases (uptrend/downtrend/sideways)
   - Suggestions for leveraging emerging narratives
   - Improvements for community trust and engagement
   - Content optimization opportunities

7. Risk Management:
   - Analysis of potential risks in posted content
   - Proposed guidelines for disclaimers and risk warnings
   - Strategies for handling FUD and negative information
   - Compliance considerations for different jurisdictions

Please provide:
- Specific metrics and illustrative examples for each insight
- Both short-term and long-term trend analysis
- Clear correlation between market conditions and content performance
- Actionable recommendations based on data

Finally, summarize the top 3 priority actions to optimize crypto content effectiveness for the upcoming market phase.
    `;
}