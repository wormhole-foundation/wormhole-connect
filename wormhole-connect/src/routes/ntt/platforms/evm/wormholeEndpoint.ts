import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { wh } from 'utils/sdk';
import { WormholeEndpoint__factory } from './abis';
import { WormholeEndpoint as Endpoint } from './abis/WormholeEndpoint';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';

export class WormholeEndpointEVM {
  readonly endpoint: Endpoint;

  constructor(readonly chain: ChainName | ChainId, endpointAddress: string) {
    this.endpoint = WormholeEndpoint__factory.connect(
      endpointAddress,
      wh.mustGetProvider(chain),
    );
  }

  async isWormholeRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return this.endpoint.isWormholeRelayingEnabled(wh.toChainId(destChain));
  }

  async isSpecialRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return this.endpoint.isSpecialRelayingEnabled(wh.toChainId(destChain));
  }

  async receiveMessage(vaa: string, payer: string): Promise<string> {
    const tx = await this.endpoint.populateTransaction.receiveMessage(vaa);
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
