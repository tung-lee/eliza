import { Plugin } from "@elizaos/core";
import transferToken from "./actions/transfer.ts";
import { WalletProvider, walletProvider } from "./providers/wallet.ts";
import { SuiService } from "./services/sui.ts";
import swapToken from "./actions/swap.ts";
import deposit from "./actions/suilend/deposit";
import getBalance from "./actions/suilend/get-balance.ts";
import getToken from "./actions/suilend/get-token.ts";
import getPortfolio from "./actions/suilend/get-portfolio.ts";
import withdraw from "./actions/suilend/withdraw.ts";
import repay from "./actions/suilend/repay.ts";
import borrow from "./actions/suilend/borrow.ts";

// Export all actions
export {
    transferToken,
    swapToken,
    deposit,
    getBalance,
    getToken,
    getPortfolio,
    withdraw,
    repay,
    borrow
};

// Export providers and services
export { WalletProvider, walletProvider };
export { SuiService };

export const suiPlugin: Plugin = {
    name: "sui",
    description: "Sui Plugin for Eliza",
    actions: [transferToken, swapToken, deposit, getBalance, getToken, getPortfolio, withdraw, repay, borrow],
    evaluators: [],
    providers: [walletProvider],
    services: [new SuiService()],
};

export default suiPlugin;
