import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { WormholeTransceiver__factory } from './abis/WormholeTransceiver__factory';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { WormholeTransceiver as WormholeTransceiverAbi } from './abis/WormholeTransceiver';
import config from 'config';
import { toChainId, toChainName } from 'utils/sdk';

export class WormholeTransceiver {
  readonly transceiver: WormholeTransceiverAbi;

  constructor(readonly chain: ChainName | ChainId, address: string) {
    this.transceiver = WormholeTransceiver__factory.connect(
      address,
      config.wh.mustGetProvider(chain),
    );
  }

  async isWormholeRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return await this.transceiver.isWormholeRelayingEnabled(
      toChainId(destChain),
    );
  }

  async isSpecialRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return await this.transceiver.isSpecialRelayingEnabled(
      toChainId(destChain),
    );
  }

  async receiveMessage(vaa: string, payer: string): Promise<string> {
    const tx = await this.transceiver.populateTransaction.receiveMessage(vaa);
    const signer = await config.wh.mustGetSigner(this.chain);
    const response = await signer.sendTransaction(tx);
    const receipt = await response.wait();
    const txId = await signAndSendTransaction(
      toChainName(this.chain),
      receipt,
      TransferWallet.RECEIVING,
    );
    return txId;
  }
}
