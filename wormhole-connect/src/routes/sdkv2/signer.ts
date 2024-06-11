import {
  chainToPlatform,
  Network,
  Chain,
  ChainContext,
  UnsignedTransaction,
  SignAndSendSigner,
  TxHash,
} from '@wormhole-foundation/sdk';
import { EvmUnsignedTransaction } from '@wormhole-foundation/sdk-evm';
import {
  ChainId,
  ChainName,
  SendResult,
} from '@wormhole-foundation/wormhole-connect-sdk';
import config, { getWormholeContextV2 } from 'config';
import { signAndSendTransaction, TransferWallet } from 'utils/wallet';
import * as ethers5 from 'ethers';
import * as ethers6 from 'ethers6';

// Utility class that bridges between legacy Connect signer interface and SDKv2 signer interface
export class SDKv2Signer<N extends Network, C extends Chain>
  implements SignAndSendSigner<N, C>
{
  _chainNameV1: ChainName;
  _chainContextV2: ChainContext<N, C>;
  _address: string;
  _options: any;

  constructor(
    chainNameV1: ChainName,
    chainContextV2: ChainContext<N, C>,
    address: string,
    options: any,
  ) {
    this._chainNameV1 = chainNameV1;
    this._chainContextV2 = chainContextV2;
    this._address = address;
    this._options = options;
  }

  static async fromChainV1<N extends Network, C extends Chain>(
    chainV1: ChainName | ChainId,
    address: string,
    options: any,
  ): Promise<SDKv2Signer<N, C>> {
    const wh = await getWormholeContextV2();
    const chainNameV1 = config.wh.toChainName(chainV1);
    const chainV2 = config.sdkConverter.toChainV2(chainV1) as Chain;
    const chainContextV2 = wh
      .getPlatform(chainToPlatform(chainV2))
      .getChain(chainV2) as ChainContext<N, C>;

    return new SDKv2Signer(chainNameV1, chainContextV2, address, options);
  }

  async signAndSend(txs: UnsignedTransaction<N, C>[]): Promise<TxHash[]> {
    let txHashes: TxHash[] = [];

    for (let tx of txs) {
      let sendResult: SendResult = this.toSendResult(tx);

      let txId = await signAndSendTransaction(
        this._chainNameV1,
        sendResult,
        TransferWallet.SENDING,
        this._options,
      );
      txHashes.push(txId);
    }
    console.log(txHashes);
    return txHashes;
  }

  private toSendResult(tx: UnsignedTransaction<N, C>): SendResult {
    let serialized = ethers6.Transaction.from({
      to: tx.transaction.to,
      data: tx.transaction.data,
    }).unsignedSerialized;
    let tx5: ethers5.Transaction = ethers5.utils.parseTransaction(serialized);
    tx5.gasLimit = null;
    tx5.gasPrice = null;
    tx5.maxFeePerGas = null;
    tx5.maxPriorityFeePerGas = null;
    tx5.nonce = null;
    return tx5;
  }

  chain() {
    return this._chainContextV2.chain;
  }

  address() {
    return this._address;
  }
}
