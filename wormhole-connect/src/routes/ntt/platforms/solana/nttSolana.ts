import {
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { UnsignedNTTMessage } from 'routes/types';
import { InboundQueuedTransfer } from '../../types';

export class NTTSolana {
  constructor(readonly managerAddress: string) {}

  async isWormholeRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    // TODO: implement
    return false;
  }

  async quoteDeliveryPrice(destChain: ChainName | ChainId): Promise<string> {
    throw new Error('Not implemented');
  }

  async send(
    token: TokenId,
    recipient: string,
    amount: bigint,
    toChain: ChainName | ChainId,
    useRelay: boolean,
  ): Promise<string> {
    throw new Error('Not implemented');
  }

  async receiveMessage(vaa: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedNTTMessage> {
    throw new Error('Not implemented');
  }

  async getCurrentOutboundCapacity(): Promise<string> {
    throw new Error('Not implemented');
  }

  async getCurrentInboundCapacity(
    fromChain: ChainName | ChainId,
  ): Promise<string> {
    throw new Error('Not implemented');
  }

  async getInboundQueuedTransfer(
    messageDigest: string,
  ): Promise<InboundQueuedTransfer | undefined> {
    throw new Error('Not implemented');
  }

  async completeInboundQueuedTransfer(messageDigest: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async isMessageExecuted(messageDigest: string): Promise<boolean> {
    throw new Error('Not implemented');
  }

  async isPaused(): Promise<boolean> {
    throw new Error('Not implemented');
  }
}
