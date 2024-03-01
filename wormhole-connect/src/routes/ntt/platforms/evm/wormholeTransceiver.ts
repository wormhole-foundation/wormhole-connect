import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { wh } from 'utils/sdk';
import { WormholeTransceiver__factory } from './abis/WormholeTransceiver__factory';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { WormholeTransceiver } from './abis/WormholeTransceiver';

export class WormholeTransceiverEvm {
  readonly transceiver: WormholeTransceiver;

  constructor(readonly chain: ChainName | ChainId, endpointAddress: string) {
    this.transceiver = WormholeTransceiver__factory.connect(
      endpointAddress,
      wh.mustGetProvider(chain),
    );
  }

  async isWormholeRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return this.transceiver.isWormholeRelayingEnabled(wh.toChainId(destChain));
  }

  async isSpecialRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return this.transceiver.isSpecialRelayingEnabled(wh.toChainId(destChain));
  }

  async receiveMessage(vaa: string, payer: string): Promise<string> {
    const tx = await this.transceiver.populateTransaction.receiveMessage(vaa);
    const signer = await wh.mustGetSigner(this.chain);
    const response = await signer.sendTransaction(tx);
    const receipt = await response.wait();
    const txId = await signAndSendTransaction(
      wh.toChainName(this.chain),
      receipt,
      TransferWallet.RECEIVING,
    );
    return txId;
  }
}
