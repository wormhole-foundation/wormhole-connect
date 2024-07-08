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
import { ChainId, ChainName } from 'sdklegacy';
import config, { getWormholeContextV2 } from 'config';
import { signAndSendTransaction, TransferWallet } from 'utils/wallet';

// Utility class that bridges between legacy Connect signer interface and SDKv2 signer interface
export class SDKv2Signer<N extends Network, C extends Chain>
  implements SignAndSendSigner<N, C>
{
  _chainNameV1: ChainName;
  _chainContextV2: ChainContext<N, C>;
  _address: string;
  _options: any;
  _walletType: TransferWallet;

  constructor(
    chainNameV1: ChainName,
    chainContextV2: ChainContext<N, C>,
    address: string,
    options: any,
    walletType: TransferWallet,
  ) {
    this._chainNameV1 = chainNameV1;
    this._chainContextV2 = chainContextV2;
    this._address = address;
    this._options = options;
    this._walletType = walletType;
  }

  static async fromChainV1<N extends Network, C extends Chain>(
    chainV1: ChainName | ChainId,
    address: string,
    options: any,
    walletType: TransferWallet,
  ): Promise<SDKv2Signer<N, C>> {
    const wh = await getWormholeContextV2();
    const chainNameV1 = config.wh.toChainName(chainV1);
    const chainV2 = config.sdkConverter.toChainV2(chainV1) as Chain;
    const chainContextV2 = wh
      .getPlatform(chainToPlatform(chainV2))
      .getChain(chainV2) as ChainContext<N, C>;

    return new SDKv2Signer(
      chainNameV1,
      chainContextV2,
      address,
      options,
      walletType,
    );
  }

  async signAndSend(txs: UnsignedTransaction<N, C>[]): Promise<TxHash[]> {
    const txHashes: TxHash[] = [];

    for (const tx of txs) {
      const txId = await signAndSendTransaction(
        this._chainNameV1,
        tx,
        this._walletType,
        this._options,
      );
      txHashes.push(txId);
    }
    console.log(txHashes);
    return txHashes;
  }

  chain() {
    return this._chainContextV2.chain;
  }

  address() {
    return this._address;
  }
}
