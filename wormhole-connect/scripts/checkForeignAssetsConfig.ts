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
  Chain,
  Network,
  toNative,
  UniversalAddress,
  Wormhole,
  wormhole,
} from '@wormhole-foundation/sdk';
import { MAINNET_CHAINS } from '../src/config/mainnet/chains';
import { MAINNET_TOKENS } from '../src/config/mainnet/tokens';
import { MAINNET_WRAPPED_TOKENS } from '../src/config/mainnet/wrappedTokens';
import { TESTNET_CHAINS } from '../src/config/testnet/chains';
import { TESTNET_TOKENS } from '../src/config/testnet/tokens';
import { TESTNET_WRAPPED_TOKENS } from '../src/config/testnet/wrappedTokens';
import {
  ChainsConfig,
  TokenConfig,
  WrappedTokenAddresses,
} from '../src/config/types';

import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import aptos from '@wormhole-foundation/sdk/aptos';
import sui from '@wormhole-foundation/sdk/sui';

const WORMCHAIN_ERROR_MESSAGES = [
  '3104 RPC not configured',
  'wormchain RPC not configured',
  'Query failed with (18): alloc::string::String not found: query wasm contract failed: invalid request',
];

// warning: be careful optimizing the RPC calls in this script, you may 429 yourself
// slow and steady, or something like that
const checkEnvConfig = async (
  env: Network,
  tokensConfig: TokenConfig[],
  wrappedTokens: WrappedTokenAddresses,
  chainsConfig: ChainsConfig,
) => {
  let recommendedUpdates: WrappedTokenAddresses = {};
  const wh = await wormhole(env, [evm, solana, aptos, sui]);

  for (const { tokenId } of tokensConfig) {
    const nativeChain = wh.getChain(tokenId.chain);
    const nativeTb = await nativeChain.getTokenBridge().catch((_) => undefined);
    if (!nativeTb) continue;

    let universalAddress: UniversalAddress | null = null;
    if (tokenId.address !== 'native') {
      universalAddress = await nativeTb.getTokenUniversalAddress(
        toNative(nativeChain.chain, tokenId.address),
      );
    }

    await Promise.all(
      Object.keys(chainsConfig).map((unTypedChain) => {
        return (async () => {
          const chain = unTypedChain as Chain;
          const context = wh.getChain(chain);
          const tb = await context.getTokenBridge().catch((_) => undefined);
          if (!tb) {
            // Some chains don't have token bridge deployed
            console.log(`No token bridge for ${chain}`);
            return;
          }

          const configForeignAddress =
            wrappedTokens[tokenId.chain]?.[tokenId.address]?.[chain];

          if (!configForeignAddress) {
            // Skip chain for which there is no foreign asset configured
            // Connect can fetch them dynamically at runtime anyway
            return;
          }

          if (chain === tokenId.chain) {
            if (configForeignAddress) {
              throw new Error(
                `❌ Invalid native chain in foreign assets detected! Env: ${env}, Token ${tokenId.chain} ${tokenId.address}, Chain: ${chain}`,
              );
            }
          } else if (universalAddress) {
            let foreignAddress: string | null = null;
            try {
              const token = Wormhole.tokenId(
                nativeChain.chain,
                universalAddress.toString(),
              );
              const wrapped = await tb.getWrappedAsset(token);
              foreignAddress = wrapped.toString();
            } catch (e: any) {
              if (
                WORMCHAIN_ERROR_MESSAGES.includes(e?.message) ||
                e?.message.includes('NETWORK_ERROR')
              ) {
                // do not throw on wormchain errors
              } else {
                console.error(
                  `❌ Failed to fetch foreign address. Env: ${env}, Token ${tokenId.chain} ${tokenId.address}, Chain: ${chain} ${e?.message}`,
                );
              }
            }
            if (foreignAddress) {
              if (configForeignAddress) {
                if (configForeignAddress !== foreignAddress) {
                  throw new Error(
                    `❌ Invalid foreign address detected! Env: ${env}, Token ${tokenId.chain} ${tokenId.address}, Chain: ${chain}, Expected: ${foreignAddress}, Received: ${configForeignAddress}`,
                  );
                } else {
                  console.log(
                    `✅ ${tokenId.chain} ${tokenId.address} on ${chain} is correctly set to ${foreignAddress}`,
                  );
                }
              } else {
                if (!recommendedUpdates[tokenId.chain]) {
                  recommendedUpdates[tokenId.chain] = {};
                }
                if (!recommendedUpdates[tokenId.chain]![tokenId.address]) {
                  recommendedUpdates[tokenId.chain]![tokenId.address] = {};
                }

                recommendedUpdates[tokenId.chain]![tokenId.address]![chain] =
                  foreignAddress;
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const numUpdatesAvaialable = Object.keys(recommendedUpdates).length;
  if (numUpdatesAvaialable > 0) {
    console.log(JSON.stringify(recommendedUpdates, undefined, 2));
    console.warn(`⚠️  Updates available!`);
  } else {
    console.log(`✅ ${env} config matches`);
  }
};

(async () => {
  await checkEnvConfig(
    'Testnet',
    TESTNET_TOKENS,
    TESTNET_WRAPPED_TOKENS,
    TESTNET_CHAINS,
  );
  await checkEnvConfig(
    'Mainnet',
    MAINNET_TOKENS,
    MAINNET_WRAPPED_TOKENS,
    MAINNET_CHAINS,
  );
})();
