import {
  chainToPlatform,
  Network,
  Chain,
  ChainContext,
  UnsignedTransaction,
  SignAndSendSigner,
  TxHash,
} from '@wormhole-foundation/sdk';
//import { EvmUnsignedTransaction } from '@wormhole-foundation/sdk-evm';
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
