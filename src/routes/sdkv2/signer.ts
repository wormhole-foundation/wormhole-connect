import type {
  Network,
  Chain,
  ChainContext,
  UnsignedTransaction,
  Signer,
  SignAndSendSigner,
  TxHash,
  RpcConnection,
  Platform,
} from '@wormhole-foundation/sdk';
import {
  chainToPlatform,
  amount,
  nativeChainIds,
} from '@wormhole-foundation/sdk';
import { getEvmSigner } from '@wormhole-foundation/sdk-evm';
import { getSolanaSigner } from '@wormhole-foundation/sdk-solana';
import { getSuiSigner } from '@wormhole-foundation/sdk-sui';
import type { TypedDataDomain, TypedDataField } from 'ethers';
import type { EVMWallet } from '@wormhole-labs/wallet-aggregator-evm';
import { NotSupported } from '@wormhole-labs/wallet-aggregator-core';

import { getWormholeContextV2 } from 'config';
import { TransferWallet } from 'utils/wallet';
import type { WormholeConnectWalletProvider } from 'utils/wallet/types';
import { sleep } from 'utils';
import config from 'config';

// Utility class that bridges between legacy Connect signer interface and SDKv2 signer interface
export class SDKv2Signer<N extends Network, C extends Chain>
  implements SignAndSendSigner<N, C>
{
  _chain: Chain;
  _chainContextV2: ChainContext<N, C>;
  _address: string;
  _walletType: TransferWallet;
  _walletProvider: WormholeConnectWalletProvider;

  constructor(
    chain: Chain,
    chainContextV2: ChainContext<N, C>,
    address: string,
    walletType: TransferWallet,
    walletProvider: WormholeConnectWalletProvider,
  ) {
    this._chain = chain;
    this._chainContextV2 = chainContextV2;
    this._address = address;
    this._walletType = walletType;
    this._walletProvider = walletProvider;
  }

  static async fromChain<N extends Network, C extends Chain>(
    chain: Chain,
    address: string,
    walletType: TransferWallet,
    walletProvider: WormholeConnectWalletProvider,
  ): Promise<SDKv2Signer<N, C>> {
    const wh = await getWormholeContextV2();
    const chainContextV2 = wh
      .getPlatform(chainToPlatform(chain))
      .getChain(chain) as ChainContext<N, C>;

    return new SDKv2Signer(
      chain,
      chainContextV2,
      address,
      walletType,
      walletProvider,
    );
  }

  static async fromPrivateKey<N extends Network, C extends Chain>(
    chain: Chain,
  ): Promise<Signer<N, C>> {
    const wh = await getWormholeContextV2();
    const chainContextV2 = wh
      .getPlatform(chainToPlatform(chain))
      .getChain(chain) as ChainContext<N, C>;
    const platform = chainContextV2.platform.utils()._platform;

    let signer: Signer;
    let rpc: RpcConnection<Platform>;

    switch (platform) {
      case 'Evm':
        if (!import.meta.env.REACT_APP_TEST_EVM_PK) {
          throw new Error('Missing Ethereum private key');
        }
        rpc = await chainContextV2.getRpc();
        signer = await getEvmSigner(
          rpc,
          import.meta.env.REACT_APP_TEST_EVM_PK,
          {
            debug: true,
            maxGasLimit: amount.units(amount.parse(1, 18)),
          },
        );
        break;
      case 'Solana':
        if (!import.meta.env.REACT_APP_SOL_PRIVATE_KEY) {
          throw new Error('Missing Solana private key');
        }
        rpc = await chainContextV2.getRpc();
        signer = await getSolanaSigner(
          rpc,
          import.meta.env.REACT_APP_SOL_PRIVATE_KEY,
        );
        break;
      case 'Sui':
        if (!import.meta.env.REACT_APP_SUI_PRIVATE_KEY) {
          throw new Error('Missing Sui private key');
        }
        rpc = await chainContextV2.getRpc();
        signer = await getSuiSigner(
          rpc,
          import.meta.env.REACT_APP_SUI_PRIVATE_KEY,
        );
        break;
      default:
        throw new Error(`Unrecognized platform: ${platform}`);
    }
    return signer as Signer<N, C>;
  }

  async signAndSend(txs: UnsignedTransaction<N, C>[]): Promise<TxHash[]> {
    const txHashes: TxHash[] = [];

    const wallet = this._walletProvider.getWallet(
      this._chain,
      this._walletType,
    );
    if (!wallet) {
      throw new Error(
        `No ${this._walletType} wallet available for ${this._chain}`,
      );
    }

    for (const tx of txs) {
      const txId = await this._walletProvider.signAndSendTransaction(
        this._chain,
        wallet,
        tx,
      );
      txHashes.push(txId);
    }
    return txHashes;
  }

  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, unknown>,
  ): Promise<string> {
    const expectedChainIdRaw = domain.chainId;

    let expectedChainId: bigint | undefined;
    if (expectedChainIdRaw !== undefined && expectedChainIdRaw !== null) {
      expectedChainId =
        typeof expectedChainIdRaw === 'bigint'
          ? expectedChainIdRaw
          : typeof expectedChainIdRaw === 'string'
          ? BigInt(expectedChainIdRaw)
          : BigInt(expectedChainIdRaw);
    }

    let targetChain: Chain | undefined;
    if (expectedChainId !== undefined) {
      const networkChain = nativeChainIds.platformNativeChainIdToNetworkChain(
        'Evm',
        expectedChainId,
      );

      if (networkChain) {
        const [network, chain] = networkChain;
        if (network === config.network) {
          targetChain = chain as Chain;
        }
      }
    }

    let evmWallet: EVMWallet | undefined;
    let walletChain: Chain | undefined;
    if (chainToPlatform(this._chain) === 'Evm') {
      evmWallet = this._walletProvider.getWallet(
        this._chain,
        this._walletType,
      ) as EVMWallet | undefined;
      walletChain = this._chain;
    }

    if (!evmWallet && targetChain) {
      walletChain = targetChain;
      evmWallet = this._walletProvider.getWallet(
        targetChain,
        TransferWallet.RECEIVING,
      ) as EVMWallet | undefined;
    }

    if (!evmWallet || !walletChain) {
      const chainLabel = walletChain ?? targetChain ?? 'the required EVM chain';
      throw new Error(
        `A connected destination wallet on ${chainLabel} is required to sign the USDC permit`,
      );
    }

    const signer = await evmWallet.getSigner();

    if (!signer) {
      throw new Error('No signer found for typed data signing');
    }

    if (expectedChainId !== undefined) {
      const signerChainId = (await signer.provider?.getNetwork())?.chainId;

      if (signerChainId === undefined) {
        throw new Error('Signer has no chainId');
      }

      if (signerChainId !== expectedChainId) {
        try {
          await evmWallet.switchChain(Number(expectedChainId));

          let signerChainIdAfterSwitch: bigint | undefined = undefined;

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
              'Failed to switch signer to the correct EVM chain for typed data signing',
            );
          }
        } catch (e) {
          if (e instanceof NotSupported) {
            throw new Error(
              'Selected EVM wallet does not support switching chains but has the wrong chain selected',
            );
          }
          throw e;
        }
      }
    }

    return signer.signTypedData(domain, types, value);
  }

  chain() {
    return this._chainContextV2.chain;
  }

  address() {
    return this._address;
  }

  provider(): WormholeConnectWalletProvider {
    return this._walletProvider;
  }
}
