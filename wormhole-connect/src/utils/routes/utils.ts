import {
  CHAIN_ID_SEI,
  SignedVaa,
  parseTokenTransferPayload,
  parseVaa,
} from '@certusone/wormhole-sdk';
import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS } from 'config';
import { Route } from 'config/types';
import { BigNumber, utils } from 'ethers';
import { toFixedDecimals } from 'utils/balance';
import { wh, PayloadType } from 'utils/sdk';

export const getRouteForVaa = (vaa: SignedVaa): Route => {
  const message = parseVaa(vaa);

  // if (parsed.emitterAddress === HASHFLOW_CONTRACT_ADDRESS) {
  //    return Route.Hashflow;
  // }

  const transfer = parseTokenTransferPayload(message.payload);
  if (transfer.toChain === CHAIN_ID_SEI) {
    return Route.Relay;
  }

  if (message.payload) {
    console.log('message payload', message.payload, message.payload[0]);
  }

  return message.payload && message.payload[0] === PayloadType.Automatic
    ? Route.Relay
    : Route.Bridge;
};

export const formatGasFee = (chain: ChainName | ChainId, gasFee: BigNumber) => {
  const chainName = wh.toChainName(chain);
  const nativeDecimals = CHAINS[chainName]?.nativeTokenDecimals;
  return toFixedDecimals(utils.formatUnits(gasFee, nativeDecimals), 6);
};
