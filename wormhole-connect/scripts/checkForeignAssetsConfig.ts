// patch out annoying logs
const info = console.info;
console.info = function (x: any, ...rest: any) {
  if (x !== 'secp256k1 unavailable, reverting to browser version') {
    info(x, ...rest);
  }
};
const warn = console.warn;
console.warn = function (x: any, ...rest: any) {
  if (
    !x
      .toString()
      .startsWith(
        'Error: Error: RPC Validation Error: The response returned from RPC server does not match the TypeScript definition. This is likely because the SDK version is not compatible with the RPC server.',
      )
  ) {
    warn(x, ...rest);
  }
};

import {
  ChainName,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { MAINNET_CHAINS } from '../src/config/mainnet/chains';
import { MAINNET_TOKENS } from '../src/config/mainnet/tokens';
import { TESTNET_CHAINS } from '../src/config/testnet/chains';
import { TESTNET_TOKENS } from '../src/config/testnet/tokens';
import { ChainsConfig, TokensConfig } from '../src/config/types';
import { Network } from '@certusone/wormhole-sdk';

const WORMCHAIN_ERROR_MESSAGES = [
  '3104 RPC not configured',
  'wormchain RPC not configured',
  'Query failed with (18): alloc::string::String not found: query wasm contract failed: invalid request',
];

// warning: be careful optimizing the RPC calls in this script, you may 429 yourself
// slow and steady, or something like that
const checkEnvConfig = async (
  env: Network,
  tokensConfig: TokensConfig,
  chainsConfig: ChainsConfig,
) => {
  let recommendedUpdates: TokensConfig = {};
  const wh = new WormholeContext(env);
  for (const [tokenKey, tokenConfig] of Object.entries(tokensConfig)) {
    await Promise.all(
      Object.keys(chainsConfig).map((unTypedChain) => {
        return (async () => {
          const chain = unTypedChain as ChainName;
          const configForeignAddress = tokenConfig.foreignAssets?.[chain];
          if (chain === tokenConfig.nativeChain) {
            if (configForeignAddress) {
              throw new Error(
                `❌ Invalid native chain in foreign assets detected! Env: ${env}, Key ${tokenKey}, Chain: ${chain}`,
              );
            }
          } else if (tokenConfig.tokenId) {
            let foreignAddress: string | null = null;
            try {
              foreignAddress = await wh.getForeignAsset(
                tokenConfig.tokenId,
                chain,
              );
            } catch (e: any) {
              if (WORMCHAIN_ERROR_MESSAGES.includes(e?.message)) {
                // do not throw on wormchain errors
              } else {
                console.error(
                  `❌ Failed to fetch foreign address. Env: ${env}, Key: ${tokenKey}, Chain: ${chain} ${e?.message}`,
                );
              }
            }
            if (foreignAddress) {
              let foreignDecimals: number | undefined;
              try {
                foreignDecimals = await wh.fetchTokenDecimals(
                  tokenConfig.tokenId,
                  chain,
                );
              } catch (e: any) {
                if (
                  /denom trace for ibc\/\w+ not found/gi.test(e?.message) ||
                  e?.message.includes('Bad status on response: 429')
                ) {
                  // denom trace not found means the asset has not yet been bridged to the target chain
                  // so it should be skipped. Same for hitting request limits
                } else {
                  throw e;
                }
              }
              if (configForeignAddress) {
                if (configForeignAddress.address !== foreignAddress) {
                  throw new Error(
                    `❌ Invalid foreign address detected! Env: ${env}, Key: ${tokenKey}, Chain: ${chain}, Expected: ${foreignAddress}, Received: ${configForeignAddress.address}`,
                  );
                } else if (
                  foreignDecimals &&
                  configForeignAddress.decimals !== foreignDecimals
                ) {
                  throw new Error(
                    `❌ Invalid foreign decimals detected! Env: ${env}, Key: ${tokenKey}, Chain: ${chain}, Expected: ${foreignDecimals}, Received: ${configForeignAddress.decimals}`,
                  );
                } else {
                  // console.log('✅ Config matches');
                }
              } else {
                recommendedUpdates = {
                  ...recommendedUpdates,
                  [tokenKey]: {
                    ...(recommendedUpdates[tokenKey] || {}),
                    foreignAssets: {
                      ...(recommendedUpdates[tokenKey]?.foreignAssets || {}),
                      [chain]: {
                        address: foreignAddress,
                        decimals: foreignDecimals,
                      },
                    },
                  },
                };
                // console.warn(
                //   '⚠️ Update available:',
                //   tokenKey,
                //   chain,
                //   foreignAddress,
                // );
              }
            }
          }
        })();
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const numUpdatesAvaialable = Object.keys(recommendedUpdates).length;
  if (numUpdatesAvaialable > 0) {
    console.log(JSON.stringify(recommendedUpdates, undefined, 2));
    console.warn(
      `⚠️ ${numUpdatesAvaialable} update${
        numUpdatesAvaialable > 1 ? 's' : ''
      } available!`,
    );
  } else {
    console.log(`✅ ${env} config matches`);
  }
};

(async () => {
  await checkEnvConfig('TESTNET', TESTNET_TOKENS, TESTNET_CHAINS);
  await checkEnvConfig('MAINNET', MAINNET_TOKENS, MAINNET_CHAINS);
})();
