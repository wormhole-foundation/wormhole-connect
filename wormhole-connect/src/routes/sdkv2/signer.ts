import {
  chainToPlatform,
  Network,
  Chain,
  ChainContext,
  UnsignedTransaction,
  SignAndSendSigner,
  TxHash,
} from '@wormhole-foundation/sdk';
import {
  ChainId,
  ChainName,
  SendResult,
} from '@wormhole-foundation/wormhole-connect-sdk';
import config, { getWormholeContextV2 } from 'config';
import { signAndSendTransaction, TransferWallet } from 'utils/wallet';
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
    chainContextV2: ChainContext<Network, Chain>,
    address: string,
    options: any,
  ) {
    this._chainNameV1 = chainNameV1;
    this._chainContextV2 = chainContextV2;
    this._address = address;
    this._options = options;
  }

  static async fromChainV1(
    chainV1: ChainName | ChainId,
    address: string,
    options: any,
  ): Promise<SDKv2Signer> {
    const wh = await getWormholeContextV2();
    const chainNameV1 = config.wh.toChainName(chainV1);
    const chainV2 = config.sdkConverter.toChainV2(chainV1) as Chain;
    const chainContextV2 = wh
      .getPlatform(chainToPlatform(chainV2))
      .getChain(chainV2) as ChainContext<Network, Chain>;

    return new SDKv2Signer(chainNameV1, chainContextV2, address, options);
  }

  async signAndSend(tx: UnsignedTransaction<N, C>[]): Promise<TxHash[]> {
    console.log(tx);

    let sendResult: SendResult = this.toSendResult(tx);

    signAndSendTransaction(
      this._chainNameV1,
      sendResult,
      TransferWallet.SENDING,
      this._options,
    );
    return [];
  }

  private toSendResult(tx: UnsignedTransaction<N, C>[]): SendResult {}

  chain() {
    return this._chainContextV2.chain;
  }

  address() {
    return this._address;
  }
}
