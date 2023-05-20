import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { WH_CONFIG } from '../config';

export function buildSeiPayload(
  toNetwork: ChainName,
  recipient: string,
): { receiver?: string; payload?: Uint8Array } {
  if (toNetwork === 'sei') {
    const translatorAddress =
      WH_CONFIG.chains.sei?.contracts.seiTokenTranslator;
    if (!translatorAddress)
      throw new Error('Sei token translator not configured not found');

    return {
      receiver: translatorAddress,
      payload: new Uint8Array(
        Buffer.from(
          JSON.stringify({
            basic_recipient: {
              recipient: Buffer.from(recipient).toString('base64'),
            },
          }),
        ),
      ),
    };
  }
  return {};
}
