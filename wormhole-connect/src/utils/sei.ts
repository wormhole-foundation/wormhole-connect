import { Network } from '@certusone/wormhole-sdk';
import {
  ChainName,
  SeiContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from '../config/types';
import { wh } from '../sdk';
import { getWrappedTokenId } from '.';

interface SeiTranslatorTransferPayload {
  receiver?: string;
  payload?: Uint8Array;
}

export async function buildSeiPayload(
  tokenConfig: TokenConfig,
  toNetwork: ChainName,
  recipient: string,
): Promise<SeiTranslatorTransferPayload> {
  if (toNetwork === 'sei') {
    const ctx = wh.getContext(toNetwork) as SeiContext<WormholeContext>;
    const token = getWrappedTokenId(tokenConfig);

    // if the token is originally from sei (e.g. native denom or cw20 token)
    // then it has to go through the token bridge and not the translator contract
    if (token.chain === 'sei') {
      return {};
    }

    return {
      receiver: ctx.getTranslatorAddress(),
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

// TODO: fill in when Sei mainnet launches
export const getSeiChainId = (env: Network) =>
  env === 'MAINNET' ? '' : 'atlantic-2';
