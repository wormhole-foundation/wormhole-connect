import {
  chainToPlatform,
  Network,
  Chain,
  ChainContext,
  UnsignedTransaction,
  Signer,
  SignAndSendSigner,
  TxHash,
  RpcConnection,
  Platform,
  amount,
} from '@wormhole-foundation/sdk';
import { getEvmSigner } from '@wormhole-foundation/sdk-evm';
import { getSolanaSigner } from '@wormhole-foundation/sdk-solana';
import { getSuiSigner } from '@wormhole-foundation/sdk-sui';

import { getWormholeContextV2 } from 'config';
import { signAndSendTransaction, TransferWallet } from 'utils/wallet';

// Utility class that bridges between legacy Connect signer interface and SDKv2 signer interface
export class SDKv2Signer<N extends Network, C extends Chain>
  implements SignAndSendSigner<N, C>
{
  _chain: Chain;
  _chainContextV2: ChainContext<N, C>;
  _address: string;
  _options: any;
  _walletType: TransferWallet;

  constructor(
    chain: Chain,
    chainContextV2: ChainContext<N, C>,
    address: string,
    options: any,
    walletType: TransferWallet,
  ) {
    this._chain = chain;
    this._chainContextV2 = chainContextV2;
    this._address = address;
    this._options = options;
    this._walletType = walletType;
  }

  static async fromChain<N extends Network, C extends Chain>(
    chain: Chain,
    address: string,
    options: any,
    walletType: TransferWallet,
  ): Promise<SDKv2Signer<N, C>> {
    const wh = await getWormholeContextV2();
    const chainContextV2 = wh
      .getPlatform(chainToPlatform(chain))
      .getChain(chain) as ChainContext<N, C>;

    return new SDKv2Signer(chain, chainContextV2, address, options, walletType);
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

    for (const tx of txs) {
      const txId = await signAndSendTransaction(
        this._chain,
        tx,
        this._walletType,
        this._options,
      );
      txHashes.push(txId);
    }
    return txHashes;
  }

  chain() {
    return this._chainContextV2.chain;
  }

  address() {
    return this._address;
  }
}
