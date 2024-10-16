import { Wallet } from "@dynamic-labs/sdk-react-core";
import { Chain, toChainId } from '@wormhole-foundation/sdk';
import { ChainId, isEVMChain } from "@xlabs-libs/wallet-aggregator-core";

export type DynamicWallet = Wallet

export const isChainSupportedByDynamicWallet = (chain: Chain) => {
    return chain === "Algorand" || chain === "Solana" || chain === "Cosmoshub" || isEVMChain(toChainId(chain) as ChainId)
}
