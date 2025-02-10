import {
    elizaLogger,
    IAgentRuntime,
    Service,
    ServiceType,
} from "@elizaos/core";
import { CoinMetadata, getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { parseAccount, SuiNetwork } from "../utils";
import { AggregatorClient, Env } from "@cetusprotocol/aggregator-sdk";
import BN from "bn.js";
import { Signer } from "@mysten/sui/cryptography";
import {
    Transaction,
    TransactionObjectArgument,
    TransactionResult,
} from "@mysten/sui/transactions";
import { SUI_DECIMALS, toBase64 } from "@mysten/sui/utils";
import { initializeSuilend, LENDING_MARKET_ID, LENDING_MARKET_TYPE, SuilendClient } from '@suilend/sdk';
import { getBalanceChange, getCoinMetadataMap, getHistoryPrice, getPrice, getToken, NORMALIZED_HIPPO_COINTYPE, NORMALIZED_kSUI_COINTYPE, NORMALIZED_NS_COINTYPE, NORMALIZED_SUI_COINTYPE, NORMALIZED_trevinSUI_COINTYPE, SUI_COINTYPE } from "@suilend/frontend-sui";
import { NORMALIZED_AUSD_COINTYPE, NORMALIZED_BLUE_COINTYPE, NORMALIZED_BTC_COINTYPES, NORMALIZED_ETH_COINTYPES, NORMALIZED_SOL_COINTYPE, NORMALIZED_USDC_COINTYPE, NORMALIZED_wUSDT_COINTYPE, NORMALIZED_WETH_COINTYPE, NORMALIZED_DEEP_COINTYPE, NORMALIZED_BUCK_COINTYPE, NORMALIZED_wBTC_COINTYPE, NORMALIZED_LOFI_COINTYPE, NORMALIZED_MAYA_COINTYPE, NORMALIZED_TREATS_COINTYPE } from "@suilend/frontend-sui"

const aggregatorURL = "https://api-sui.cetus.zone/router_v2/find_routes";

interface SwapResult {
    success: boolean;
    txBytesBase64: string;
    message: string;
}

export class SuiService extends Service {
    static serviceType: ServiceType = ServiceType.TRANSCRIPTION;
    private suiClient: SuiClient;
    private network: SuiNetwork;
    private wallet: Signer;

    initialize(runtime: IAgentRuntime): Promise<void> {
        this.suiClient = new SuiClient({
            url: getFullnodeUrl(
                runtime.getSetting("SUI_NETWORK") as SuiNetwork
            ),
        });

        this.network = runtime.getSetting("SUI_NETWORK") as SuiNetwork;
        this.wallet = parseAccount(runtime);
        return null;
    }

    async getAllBalances(address: string) {
        try {
            const balances = await this.suiClient.getAllBalances({ owner: address });
            return balances;
        } catch (error) {
            elizaLogger.error('Error fetching balances:', error);
            throw error;
        }
    }

    async getStakes(address: string) {
        try {
            const stakes = await this.suiClient.getStakes({ owner: address });
            return stakes;
        } catch (error) {
            elizaLogger.error('Error fetching stakes:', error);
            throw error;
        }
    }

    async getOwnedObjects(address: string, cursor?: string, limit: number = 8) {
        try {
            const objects = await this.suiClient.getOwnedObjects({
                owner: address,
                filter: {
                    MatchNone: [
                        {
                            StructType: "0x2::coin::Coin"
                        }
                    ]
                },
                options: {
                    showDisplay: true,
                    showType: true
                },
                cursor,
                limit
            });
            return objects;
        } catch (error) {
            elizaLogger.error('Error fetching owned objects:', error);
            throw error;
        }
    }

    async getBalance(address: string, coinType?: string) {
        const balance = await this.suiClient.getBalance({
            owner: address,
            coinType
        });
        return balance;
    }

    getNetwork() {
        return this.network;
    }

    getTransactionLink(tx: string) {
        if (this.network === "mainnet") {
            return `https://suivision.xyz/txblock/${tx}`;
        } else if (this.network === "testnet") {
            return `https://testnet.suivision.xyz/txblock/${tx}`;
        } else if (this.network === "devnet") {
            return `https://devnet.suivision.xyz/txblock/${tx}`;
        } else if (this.network === "localnet") {
            return `localhost : ${tx}`;
        }
    }

    async getCoinAmount(amount: number, tokenAddress: string): Promise<bigint> {
        const fromCoinAddressMetadata = await this.suiClient.getCoinMetadata({
            coinType: tokenAddress,
        });

        if (!fromCoinAddressMetadata) {
            throw new Error(`Invalid from coin address: ${tokenAddress}`);
        }

        return BigInt(amount * (10 ** fromCoinAddressMetadata.decimals));
    }

    async swapToken(
        fromTokenAddress: string,
        amount: number | string,
        out_min_amount: number,
        targetTokenAddress: string,
        address: string
    ): Promise<SwapResult> {
        const client = new AggregatorClient(
            aggregatorURL,
            address,
            this.suiClient,
            Env.Mainnet
        );
        // provider list : https://api-sui.cetus.zone/router_v2/status
        const routerRes = await client.findRouters({
            from: fromTokenAddress,
            target: targetTokenAddress,
            amount: new BN(amount),
            byAmountIn: true, // `true` means fix input amount, `false` means fix output amount
            depth: 3, // max allow 3, means 3 hops
            providers: [
                "KRIYAV3",
                "CETUS",
                "SCALLOP",
                "KRIYA",
                "BLUEFIN",
                "DEEPBOOKV3",
                "FLOWXV3",
                "BLUEMOVE",
                "AFTERMATH",
                "FLOWX",
                "TURBOS",
                // "AFSUI",
                // "VOLO",
                // "SPRINGSUI",
                // "ALPHAFI",
                // "HAEDAL",
                // "HAEDALPMM",
            ],
        });

        if (routerRes === null) {
            elizaLogger.error(
                "No router found" +
                JSON.stringify({
                    from: fromTokenAddress,
                    target: targetTokenAddress,
                    amount: amount,
                })
            );
            return {
                success: false,
                txBytesBase64: null,
                message: "No router found",
            };
        }

        if (routerRes.amountOut.toNumber() < out_min_amount) {
            return {
                success: false,
                txBytesBase64: null,
                message: "Out amount is less than out_min_amount",
            };
        }

        let coin: TransactionObjectArgument;
        const routerTx = new Transaction();

        if (fromTokenAddress === "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI") {
            coin = routerTx.splitCoins(routerTx.gas, [amount]);
        } else {
            const allCoins = await this.suiClient.getCoins({
                owner: address,
                coinType: fromTokenAddress,
                limit: 30,
            });

            if (allCoins.data.length === 0) {
                elizaLogger.error("No coins found");
                return {
                    success: false,
                    txBytesBase64: null,
                    message: "No coins found",
                };
            }

            const mergeCoins = [];

            for (let i = 1; i < allCoins.data.length; i++) {
                elizaLogger.info("Coin:", allCoins.data[i]);
                mergeCoins.push(allCoins.data[i].coinObjectId);
            }
            elizaLogger.info("Merge coins:", mergeCoins);

            routerTx.mergeCoins(allCoins.data[0].coinObjectId, mergeCoins);
            coin = routerTx.splitCoins(allCoins.data[0].coinObjectId, [amount]);
        }

        const targetCoin = await client.routerSwap({
            routers: routerRes!.routes,
            byAmountIn: true,
            txb: routerTx,
            inputCoin: coin,
            slippage: 0.5,
        });

        // checking threshold

        // routerTx.moveCall({
        //     package:
        //         "0x57d4f00af225c487fd21eed6ee0d11510d04347ee209d2ab48d766e48973b1a4",
        //     module: "utils",
        //     function: "check_coin_threshold",
        //     arguments: [
        //         targetCoin,
        //         routerTx.pure(bcs.U64.serialize(out_min_amount)),
        //     ],
        //     typeArguments: [otherType],
        // });
        routerTx.transferObjects([targetCoin], address);
        routerTx.setSender(address);

        const txBytes = await routerTx.build({
            client: this.suiClient,
        })

        const txBytesBase64 = toBase64(txBytes);

        return {
            success: true,
            txBytesBase64,
            message: "Create swap transaction successful",
        };
    }

    async getDefiPortfolio(address: string) {
        try {
            const response = await fetch(`https://apps-backend.sui.io/v1/defi/portfolio/${address}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            elizaLogger.error('Error fetching DeFi portfolio:', error);
            throw error;
        }
    }

    async transferToken(amount: string, senderAddress: string, recipientAddress: string) {
        const adjustedAmount = BigInt(
            Number(amount) * Math.pow(10, SUI_DECIMALS)
        );
        const tx = new Transaction();
        const [coin] = tx.splitCoins(tx.gas, [adjustedAmount]);
        tx.transferObjects([coin], recipientAddress);
        tx.setSender(senderAddress);

        const txBytes = await tx.build({
            client: this.suiClient,
        })

        const txBytesBase64 = toBase64(txBytes);

        return {
            success: true,
            txBytesBase64,
            message: "Create transfer transaction successful",
        };
    }

    async getDefiMetadata() {
        try {
            const response = await fetch('https://apps-backend.sui.io/v1/defi/metadata');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            elizaLogger.error('Error fetching DeFi metadata:', error);
            throw error;
        }
    }

    async getPriceCoin(coinType: string) {
        const price = await getPrice(coinType);
        return price;
    }

    // async getHistoryPrice(coinType: string) {
    //     const historyPrice = await getHistoryPrice(coinType);
    //     return historyPrice;
    // }

    async getCoinMetadataMap(uniqueCoinTypes: string[]) {
        const coinMetadataMap = await getCoinMetadataMap(this.suiClient, uniqueCoinTypes);
        elizaLogger.info(coinMetadataMap);
        return coinMetadataMap;
    }

    async getTokenMetadata(coinType: string) {
        const coinMetadataMap = await this.getCoinMetadataMap([coinType]);
        const tokenMetadata = coinMetadataMap[coinType];
        return tokenMetadata;
    }

    async getTokenFromSymbol(symbol: string) {
        const normalizedSymbol = symbol.toUpperCase();

        // Check against normalized coin types
        if (normalizedSymbol === 'USDC') return NORMALIZED_USDC_COINTYPE;
        if (normalizedSymbol === 'BTC') return NORMALIZED_BTC_COINTYPES;
        if (normalizedSymbol === 'ETH') return NORMALIZED_ETH_COINTYPES;
        if (normalizedSymbol === 'SOL') return NORMALIZED_SOL_COINTYPE;
        if (normalizedSymbol === 'BLUE') return NORMALIZED_BLUE_COINTYPE;
        if (normalizedSymbol === 'AUSD') return NORMALIZED_AUSD_COINTYPE;
        if (normalizedSymbol === 'SUI') return NORMALIZED_SUI_COINTYPE;
        if (normalizedSymbol === 'USDT') return NORMALIZED_wUSDT_COINTYPE;
        if (normalizedSymbol === 'WETH') return NORMALIZED_WETH_COINTYPE;
        if (normalizedSymbol === 'DEEP') return NORMALIZED_DEEP_COINTYPE;
        if (normalizedSymbol === 'BUCK') return NORMALIZED_BUCK_COINTYPE;
        if (normalizedSymbol === 'WBTC') return NORMALIZED_wBTC_COINTYPE;
        if (normalizedSymbol === 'LOFI') return NORMALIZED_LOFI_COINTYPE;
        if (normalizedSymbol === 'MAYA') return NORMALIZED_MAYA_COINTYPE;
        if (normalizedSymbol === 'TREATS') return NORMALIZED_TREATS_COINTYPE;
        if (normalizedSymbol === 'NS') return NORMALIZED_NS_COINTYPE;
        if (normalizedSymbol === 'HIPPO') return NORMALIZED_HIPPO_COINTYPE;
        if (normalizedSymbol === 'kSUI') return NORMALIZED_kSUI_COINTYPE;
        if (normalizedSymbol === 'trevinSUI') return NORMALIZED_trevinSUI_COINTYPE;

        return null;
    }

    async depositBySuilend(
        coinType: string,
        amount: number,
        address: string
    ) {
        try {
            const suilendClient = await SuilendClient.initialize(
                LENDING_MARKET_ID,
                LENDING_MARKET_TYPE,
                this.suiClient
            );

            const { coinMetadataMap, obligationOwnerCaps } = await initializeSuilend(
                this.suiClient,
                suilendClient,
                address
            );

            if (!coinMetadataMap[coinType]) {
                throw new Error(`Invalid coin type: ${coinType}`);
            }

            const total = await this.getCoinAmount(amount, coinType);

            // Deposit
            const tx = new Transaction();
            tx.setSender(address);

            // Create obligation if it doesn't exist
            if (obligationOwnerCaps === undefined || obligationOwnerCaps.length === 0) {
                // Create and deposit in the same transaction
                const obligation = suilendClient.createObligation(tx);
                tx.transferObjects([obligation], tx.pure.address(address));

                // Use the obligation result directly for deposit
                await suilendClient.depositIntoObligation(
                    address,
                    coinType,
                    total.toString(),
                    tx,
                    obligation // Use the obligation result directly
                );
            } else {
                // Use existing obligation for deposit
                await suilendClient.depositIntoObligation(
                    address,
                    coinType,
                    total.toString(),
                    tx,
                    obligationOwnerCaps[0].id
                );
            }

            const txBytes = await tx.build({
                client: this.suiClient,
            })

            const txBytesBase64 = toBase64(txBytes);

            return {
                success: true,
                txBytesBase64,
                message: "Create swap transaction successful",
            };

        } catch (error: any) {
            console.error(
                'Error depositing:',
                error.message,
                'Error stack trace:',
                error.stack
            );
            throw new Error(`Failed to deposit: ${error.message}`);
        }
    }

    async withdrawBySuilend(
        coinType: string,
        amount: number,
        address: string
    ) {
        try {
            const suilendClient = await SuilendClient.initialize(
                LENDING_MARKET_ID,
                LENDING_MARKET_TYPE,
                this.suiClient
            );

            const { coinMetadataMap, obligationOwnerCaps, obligations } =
                await initializeSuilend(
                    this.suiClient,
                    suilendClient,
                    address
                );

            if (!obligationOwnerCaps || !obligations) {
                throw new Error('Obligation not found');
            }

            if (!coinMetadataMap[coinType]) {
                throw new Error(`Invalid coin type: ${coinType}`);
            }

            const total = await this.getCoinAmount(amount, coinType);

            const tx = new Transaction();
            tx.setSender(address);

            await suilendClient.withdrawAndSendToUser(
                address,
                obligationOwnerCaps[0].id,
                obligations[0].id,
                coinType,
                total.toString(),
                tx
            );

            const txBytes = await tx.build({
                client: this.suiClient,
            })

            const txBytesBase64 = toBase64(txBytes);

            return {
                success: true,
                txBytesBase64,
                message: "Create withdraw suilend transaction successful",
            };


        } catch (error: any) {
            console.error(
                'Error withdrawing:',
                error.message,
                'Error stack trace:',
                error.stack
            );
            throw new Error(`Failed to withdraw: ${error.message}`);
        }
    }

    async borrowBySuilend(
        coinType: string,
        amount: number,
        address?: string
    ) {
        try {
            const suilendClient = await SuilendClient.initialize(
                LENDING_MARKET_ID,
                LENDING_MARKET_TYPE,
                this.suiClient
            );

            const { coinMetadataMap, obligationOwnerCaps, obligations } =
                await initializeSuilend(
                    this.suiClient,
                    suilendClient,
                    address
                );

            if (!obligationOwnerCaps || !obligations) {
                throw new Error('Obligation not found');
            }

            if (!coinMetadataMap[coinType]) {
                throw new Error(`Invalid coin type: ${coinType}`);
            }

            const total = await this.getCoinAmount(amount, coinType);

            const tx = new Transaction();
            tx.setSender(address);

            await suilendClient.borrowAndSendToUser(
                address as string,
                obligationOwnerCaps[0].id,
                obligations[0].id,
                coinType,
                total.toString(),
                tx
            );


            const txBytes = await tx.build({
                client: this.suiClient,
            })

            const txBytesBase64 = toBase64(txBytes);

            return {
                success: true,
                txBytesBase64,
                message: "Create borrow suilend transaction successful",
            };

        } catch (error: any) {
            console.error(
                'Error borrowing:',
                error.message,
                'Error stack trace:',
                error.stack
            );
            throw new Error(`Failed to borrow: ${error.message}`);
        }
    }

    async repayBySuilend(
        coinType: string,
        amount: number,
        address: string
    ) {
        try {
            const suilendClient = await SuilendClient.initialize(
                LENDING_MARKET_ID,
                LENDING_MARKET_TYPE,
                this.suiClient
            );

            const { coinMetadataMap, obligationOwnerCaps, obligations } =
                await initializeSuilend(
                    this.suiClient,
                    suilendClient,
                    address
                );

            if (!obligationOwnerCaps || !obligations) {
                throw new Error('Obligation not found');
            }

            if (!coinMetadataMap[coinType]) {
                throw new Error(`Invalid coin type: ${coinType}`);
            }

            const total = await this.getCoinAmount(amount, coinType);

            const tx = new Transaction();
            tx.setSender(address);

            await suilendClient.repayIntoObligation(
                address,
                obligations[0].id,
                coinType,
                total.toString(),
                tx
            );

            const txBytes = await tx.build({
                client: this.suiClient,
            })

            const txBytesBase64 = toBase64(txBytes);

            return {
                success: true,
                txBytesBase64,
                message: "Create repay suilend transaction successful",
            };

        } catch (error: any) {
            console.error(
                'Error repaying:',
                error.message,
                'Error stack trace:',
                error.stack
            );
            throw new Error(`Failed to repay: ${error.message}`);
        }
    }

}

// https://apps-backend.sui.io/guardian/object-list
