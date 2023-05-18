import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

export function buildSeiPayload(
  toNetwork: ChainName,
  recipient: string,
): { receiver?: string; payload?: Uint8Array } {
  if (toNetwork === 'sei') {
    return {
      receiver:
        'sei1dkdwdvknx0qav5cp5kw68mkn3r99m3svkyjfvkztwh97dv2lm0ksj6xrak',
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
