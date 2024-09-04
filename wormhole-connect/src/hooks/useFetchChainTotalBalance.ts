import { ChainConfig, TokenConfig } from "config/types";
import config, { getWormholeContextV2 } from "config";
import { useCallback } from "react";
import { useFetchTokenPrices } from "./useFetchTokenPrices";
import { useSelector } from "react-redux";
import { RootState } from "store";
import { chainToPlatform, TokenAddress, amount } from "@wormhole-foundation/sdk";
import { getTokenBridgeWrappedTokenAddress } from "utils/sdkv2";

export const useFetchChainTotalBalance = (walletAddress: string, chainConfigs: ChainConfig[]): () => Promise<any> => {
  const tokenPrices = useSelector((state: RootState) => state.tokenPrices);
  useFetchTokenPrices();

  return useCallback(async () => {
    if (!walletAddress) return;
    for (const chainConfig of chainConfigs) {
      const allChainTokens = config
        .tokensArr
        .filter(token => token.nativeChain === chainConfig.key || token.foreignAssets?.[chainConfig.key]);
      const wh = await getWormholeContextV2();
      const platform = wh.getPlatform(chainToPlatform(chainConfig.key));
      const rpc = platform.getRpc(chainConfig.key);

      const tokenAddressToConfigMap = new Map<string, TokenConfig>();
      const tokenAddresses = await Promise.all(allChainTokens.map(async (tokenConfig) => {
        let tokenAddress: string | undefined;
        if (tokenConfig.nativeChain === chainConfig.key && tokenConfig.tokenId === undefined) {
            tokenAddress = 'native';
        } else {
          const foreignAddress = await getTokenBridgeWrappedTokenAddress(
            tokenConfig,
            chainConfig.key,
          );

          tokenAddress = foreignAddress?.toString();
        }

        if (tokenAddress) {
          tokenAddressToConfigMap.set(tokenAddress, tokenConfig);
        }
        return tokenAddress;
      }));

      const filteredTokenAddresses = tokenAddresses.filter(Boolean) as TokenAddress<typeof chainConfig.key>[];

      const result = await platform
        .utils()
        .getBalances(
          chainConfig.key,
          rpc,
          walletAddress,
          filteredTokenAddresses,
        );

      return Object.entries(result).reduce((acc, [tokenAddress, balance]) => {
        const tokenConfig = tokenAddressToConfigMap.get(tokenAddress);

        if (!balance || balance === 0n || !tokenConfig) {
          return acc;
        }

        const price = tokenPrices.usdPrices.data?.[tokenConfig.coinGeckoId]?.usd;

        if (!price) {
          return acc;
        }

        const totalTokenAmount = amount.whole({
          amount: balance.toString(),
          decimals: tokenConfig.decimals,
        });

        return acc + (totalTokenAmount * price);
      }, 0);
    }
  }, [walletAddress, chainConfigs]);
};
