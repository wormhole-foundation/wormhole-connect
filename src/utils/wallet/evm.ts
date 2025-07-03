import { Wallet, NotSupported } from '@wormhole-labs/wallet-aggregator-core';
import {
  EVMWallet,
  Eip6963Wallet,
  Eip6963Wallets,
  InjectedWallet,
  InjectedWallets,
  WalletConnectWallet,
  DEFAULT_CHAINS,
} from '@wormhole-labs/wallet-aggregator-evm';

import {
  EvmUnsignedTransaction,
  EvmChains,
} from '@wormhole-foundation/sdk-evm';
import { Network } from '@wormhole-foundation/sdk';

import config from 'config';
import * as ethers from 'ethers';
import { sleep } from 'utils';

type ChainRpcUrls = (typeof DEFAULT_CHAINS)[0]['rpcUrls']['default'];

const getRpcForChain = (
  wormholeChainName: string | undefined,
  defaultRpc: ChainRpcUrls,
) =>
  wormholeChainName && wormholeChainName in config.rpcs
    ? { ...defaultRpc, http: [config.rpcs[wormholeChainName]] }
    : defaultRpc;
/**
 * Should be used to coalesce a wagmi chain name to a wormhole chain name.
 * This is necessary because the wormhole chain names are different from the wagmi chain names.
 *
 * @param name a wagmi chain name
 * @returns a wormhole chain name
 */
const coalesceWormholeChainName = (name: string) =>
  ({
    'BNB Smart Chain': 'Bsc',
  }[name] || name);

export const getWallets = () => {
  const CHAINS_CONFIG = DEFAULT_CHAINS.map((wagmiConfig) => ({
    ...wagmiConfig,
    rpcUrls: {
      ...wagmiConfig.rpcUrls,
      default: getRpcForChain(
        coalesceWormholeChainName(wagmiConfig.name),
        wagmiConfig.rpcUrls.default,
      ),
    },
  }));

  const eip6963Wallets = Object.entries(Eip6963Wallets).reduce(
    (acc, [key, name]) => ({ [key]: new Eip6963Wallet(name), ...acc }),
    {},
  );

  return {
    ...eip6963Wallets,
    okxwallet: new Eip6963Wallet({
      name: InjectedWallets.OKXWallet,
      url: 'https://www.okx.com/web3',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAADMhJREFUeF7tme1xW8cSRJcZABkAGZAZgBlIEYCMAFAERAhABCQjEDIgFQGRgZCBkAFfXVbZzz9srbTt9XzsuVUuVelydmZOL1oN+qqU8l54IACBIQlcYQBD6s7SEPgggAFwESAwMAEMYGDxWR0CGAB3AAIDE8AABhaf1SGAAXAHIDAwAQxgYPFZHQIYAHcAAgMTwAAGFp/VIYABcAcgMDABDGBg8VkdAhgAdwACAxPAAAYWn9UhgAFwByAwMAEMYGDxWR0CGAB3AAIDE8AABhaf1SGAAXAHIDAwAQxgYPFZHQIYAHcAAgMTwAAGFp/VIYABcAcgMDABDGBg8VkdAhgAdwACAxPAAAYWn9UhgAFwByAwMAEMYGDxWR0CGAB3AAIDE8AABhaf1SGAAXAHIDAwAQxgYPFZHQIYAHcAAgMTwAAGFp/VIYABcAcgMDABDGBg8VkdAhgAdwACAxPAAAYWn9UhgAFwByAwMAEMYGDxWR0CGAB3AAIDE8AABhaf1SGAAXAHIDAwAQxgYPFZHQIYAHcAAgMTwAAGFp/VIYABcAcgMDABDGBg8VkdAhgAdwACAxPAAAYWn9UhgAFwByAwMAEMYGDxWR0CGAB3AAIDE8AABhaf1SGAAXAHIDAwAQxgYPFZHQJDGMB+vy/r9brMZrMwih8Oh7LdbsPM+7NBN5tN2e12ofgfj8fy5cuXcj6fU2jwT0ukN4Dpwz9dwIhPBhO4u7srj4+PEfGX0+lUbm5uQs7+q0OnN4D39/dfZeHu5y6XS5nP5+7m+p2BXl5eymq1+p0SVz87GcBkBFkfDMC5sldXk0Rxn+/fv5fFYhF2gdvb2/L6+hp2/trgGECNkPF7DMBWAAzAlr/cPfJXgGl5DEC+AtIBGICEz74YA7DVgK8Atvxr3fkKUCNk/J4EYCsACcCWv9ydBCAjlA4gAUj4uheTALoj1hqQADR+ajUJQCVoXE8CsBWABGDLv9adBFAjZPyeBGArAAnAlr/cnQQgI5QOIAFI+LoXkwC6I9YakAA0fmo1CUAlaFxPArAVgARgy7/WnQRQI2T8ngRgKwAJwJa/3J0EICOUDiABSPi6F5MAuiPWGpAANH5qNQlAJWhcTwKwFYAEYMu/1p0EUCNk/J4EYCsACcCWv9ydBCAjlA4gAUj4uheTALoj1hqQADR+ajUJQCVoXE8CsBWABGDLv9adBFAjZPyeBGArAAnAlr/cnQQgI5QOIAFI+LoXkwC6I9YakAA0fmo1CUAlaFxPArAVgARgy7/WnQRQI2T8ngRgKwAJwJa/3J0EICOUDiABSPi6F5MAuiPWGpAANH5qNQlAJWhcTwKwFYAEYMu/1p0EUCNk/J4EYCsACcCWv9ydBCAjlA4gAUj4uheTALoj1hqQADR+ajUJQCVoXE8CsBWABGDLv9adBFAjZPyeBGArAAnAlr/cnQQgI5QOIAFI+LoXkwC6I9YakAA0fmo1CUAlaFxPArAVgARgy7/WnQRQI2T8ngRgKwAJwJa/3J0EICOUDiABSPi6F5MAuiPWGpAANH5qNQlAJWhcTwKwFYAEYMu/1p0EUCNk/J4EYCsACcCWv9ydBCAjlA4gAUj4uhenTwA/fvwos9msO8heDaIngJeXl7JarXrh6X4uCaA74r4N9vt92Ww2fZt0Ov1wOJTtdtvp9P/m2Lu7u/L4+PjfNPuXu5zP57JcLv/lU30dlz4BTLijmcDlcinPz8/hP/x/XPXdblfW63VZLBa+bv9Ppnl9fS339/dlMoHMzxAGEF3AKcFMSSDKB+h0OpVv376lMbDo9+dn82MAztWNHKGfnp4+/hXl8UsAA/Crzcdkb29v5fr62vmU/zzefD4v01caHp8EMACfuvw5Ff8bzblAwcfDAJwLiAE4Fyj4eBiAcwExAOcCBR8PA3AuIAbgXKDg42EAzgXEAJwLFHw8DMC5gBiAc4GCj4cBOBcQA3AuUPDxMADnAmIAzgUKPh4G4FxADMC5QMHHwwCcC4gBOBco+HgYgHMBMQDnAgUfDwNwLiAG4Fyg4ONhAM4FxACcCxR8PAzAuYAYgHOBgo+HATgXEANwLlDw8TAA5wJiAM4FCj4eBuBcQAzAuUDBx8MAnAuIATgXKPh4GIBzATEA5wIFHw8DcC4gBuBcoODjYQDOBcQAnAsUfDwMwLmAGIBzgYKPhwE4FxADcC5Q8PEwAOcCYgDOBQo+HgbgXEAMwLlAwcfDAJwLiAE4Fyj4eBiAcwExAOcCBR8PA3AuIAbgXKDg42EAzgXEAJwLFHw8DMC5gBiAc4GCj4cBOBcQA3AuUPDxMADnAmIAzgUKPh4G4FxADMC5QMHHwwCcC4gBOBco+HgYgHMBMQDnAgUfDwNwLiAG4Fyg4ONhAM4FxACcCxR8PAzAuYAYgHOBgo+HATgXEANwLlDw8TAA5wJiAM4FCj4eBuBcQAzAuUDBx8MAnAuIATgXKPh4GIBzAaMbwM3NTTmdTs4pjzseBuBc+91uVx4eHpxP+ffjnc/nslwuQ84+ytAYQACl9/t92Ww2ASb9/4ivr6/l/v6+TCbA45fAEAZwd3dX1ut1WSwWfpX4y2TTh+b5+bk8PT39+bez2axM/0V5/vrBv76+/kgx058Rnmn24/FYDodDhHGlGdMbQOQIvd1uw1/CyXSn32NEfCYDnlJM5ie9AUT+Jdrlcinz+Tz0/fv69Wv59OlT2B2y/xIzvQG8v7+HvXzT4FdXk0Rxn7e3tzDR/+8o397elun3GVkfDMC5stENIHICm64GBuD8A1IbjwRQI9T3PQbQl696OglAJdi5ngTQGXDleBKALX+5OwlARigdQAKQ8HUvJgF0R6w1IAFo/NRqEoBK0LieBGArAAnAln+tOwmgRsj4PQnAVgASgC1/uTsJQEYoHUACkPB1LyYBdEesNSABaPzUahKAStC4ngRgKwAJwJZ/rTsJoEbI+D0JwFYAEoAtf7k7CUBGKB1AApDwdS8mAXRHrDUgAWj81GoSgErQuJ4EYCsACcCWf607CaBGyPg9CcBWABKALX+5OwlARigdQAKQ8HUvJgF0R6w1IAFo/NRqEoBK0LieBGArAAnAln+tOwmgRsj4PQnAVgASgC1/uTsJQEYoHUACkPB1LyYBdEesNSABaPzUahKAStC4ngRgKwAJwJZ/rTsJoEbI+D0JwFYAEoAtf7k7CUBGKB1AApDwdS8mAXRHrDUgAWj81GoSgErQuJ4EYCsACcCWf607CaBGyPg9CcBWABKALX+5OwlARigdQAKQ8HUvJgF0R6w1IAFo/NRqEoBK0LieBGArAAnAln+tOwmgRsj4PQnAVgASgC1/uTsJQEYoHUACkPB1LyYBdEesNSABaPzUahKAStC4ngRgKwAJwJZ/rTsJoEbI+D0JwFYAEoAtf7k7CUBGKB1AApDwdS8mAXRHrDUgAWj81GoSgErQuJ4EYCsACcCWf607CaBGyPg9CcBWABKALX+5OwlARigdQAKQ8HUvJgF0R6w1IAFo/NRqEoBK0LieBGArwNvbW7m+vrYdQuiOAQjwPJS+vLyU1WrlYZTfnuF4PJbPnz//dp2ngt1uVx4eHjyN9MuznM/nslwuf/nnI/5g+q8Ai8WiTCYw/RnpOZ1OHx/+6RJGf/b7fdlsNqHWuFwuZfrXf9Ih85PeAP4QL1IKmC5ftos3fQ2YzWYhPksT/8l4pz+zP8MYQHYh2Q8CLQQwgBZq1EAgCQEMIImQrAGBFgIYQAs1aiCQhAAGkERI1oBACwEMoIUaNRBIQgADSCIka0CghQAG0EKNGggkIYABJBGSNSDQQgADaKFGDQSSEMAAkgjJGhBoIYABtFCjBgJJCGAASYRkDQi0EMAAWqhRA4EkBDCAJEKyBgRaCGAALdSogUASAhhAEiFZAwItBDCAFmrUQCAJAQwgiZCsAYEWAhhACzVqIJCEAAaQREjWgEALAQyghRo1EEhCAANIIiRrQKCFAAbQQo0aCCQhgAEkEZI1INBCAANooUYNBJIQwACSCMkaEGghgAG0UKMGAkkIYABJhGQNCLQQwABaqFEDgSQEMIAkQrIGBFoIYAAt1KiBQBICGEASIVkDAi0EMIAWatRAIAkBDCCJkKwBgRYCGEALNWogkIQABpBESNaAQAsBDKCFGjUQSEIAA0giJGtAoIUABtBCjRoIJCGAASQRkjUg0EIAA2ihRg0EkhDAAJIIyRoQaCGAAbRQowYCSQhgAEmEZA0ItBDAAFqoUQOBJAQwgCRCsgYEWghgAC3UqIFAEgIYQBIhWQMCLQQwgBZq1EAgCQEMIImQrAGBFgIYQAs1aiCQhAAGkERI1oBACwEMoIUaNRBIQgADSCIka0CghcD/AFu3y0xSvW8yAAAAAElFTkSuQmCC',
    }),
    injected: new InjectedWallet(),
    ...(config.ui.walletConnectProjectId
      ? {
          walletConnect: new WalletConnectWallet({
            chains: CHAINS_CONFIG,
            connectorOptions: {
              projectId: config.ui.walletConnectProjectId,
            },
          }),
        }
      : {}),
  };
};

export interface AssetInfo {
  address: string;
  symbol: string;
  decimals: number;
  chainId?: number;
}

export async function signAndSendTransaction(
  request: EvmUnsignedTransaction<Network, EvmChains>,
  w: Wallet,
  chainName: string,
): Promise<string> {
  const evmWallet = w as EVMWallet;

  const signer = await evmWallet.getSigner();
  if (!signer) throw new Error('No signer found for chain' + chainName);

  const expectedChainId = request.transaction.chainId
    ? ethers.getBigInt(request.transaction.chainId)
    : undefined;

  if (expectedChainId === undefined) {
    throw new Error(`EVM transaction has no chainId`);
  }

  const signerChainId = (await signer.provider?.getNetwork())?.chainId;

  if (signerChainId === undefined) {
    throw new Error(`Signer has no chainId`);
  }

  // Ensure the signer is connected to the correct chain
  if (signerChainId !== expectedChainId) {
    try {
      await evmWallet.switchChain(Number(expectedChainId));

      let signerChainIdAfterSwitch: bigint | undefined = undefined;

      // Wait up to five seconds until wallet's chainId matches the expected chainId
      for (let i = 0; i < 50; i++) {
        signerChainIdAfterSwitch = (await signer.provider?.getNetwork())
          ?.chainId;
        if (signerChainIdAfterSwitch === expectedChainId) {
          break;
        }
        await sleep(100);
      }

      if (signerChainIdAfterSwitch !== expectedChainId) {
        throw new Error(
          `Failed to switch signer to the correct EVM chain - they still don't match`,
        );
      }
    } catch (e) {
      if (e instanceof NotSupported) {
        throw new Error(
          `Selected EVM wallet does not support switching chains but has the wrong chain selected`,
        );
      } else {
        throw new Error(`Error switching to chain ${expectedChainId}: ${e}`);
      }
    }
  }

  const tx = await signer.sendTransaction(request.transaction);
  const result = await tx.wait();

  if (result === null) throw new Error('Failed to wait for transaction');

  return result.hash;
}
