import { BigNumber, utils } from 'ethers';
import {
  CHAIN_ID_SEI,
  SignedVaa,
  parseTokenTransferPayload,
  parseVaa,
} from '@certusone/wormhole-sdk';
import {
  ChainName,
  ChainId,
  MAINNET_CHAINS,
  ParsedMessage as SdkParsedMessage,
  ParsedRelayerMessage as SdkParsedRelayerMessage,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS } from 'config';
import { Route } from 'config/types';
import { getTokenById } from 'utils/utils';
import { toFixedDecimals } from 'utils/balance';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  solanaContext,
  PayloadType,
  wh,
} from 'utils/sdk';

// adapts the sdk returned parsed message to the type that
// wh connect uses
export const adaptParsedMessage = async (
  parsed: SdkParsedMessage | SdkParsedRelayerMessage,
): Promise<ParsedMessage | ParsedRelayerMessage> => {
  const tokenId = {
    address: parsed.tokenAddress,
    chain: parsed.tokenChain,
  };
  const decimals = await wh.fetchTokenDecimals(tokenId, parsed.fromChain);
  const token = getTokenById(tokenId);

  const base: ParsedMessage = {
    ...parsed,
    amount: parsed.amount.toString(),
    tokenKey: token?.key || '',
    tokenDecimals: decimals,
    receivedTokenKey: token?.key || '',
    sequence: parsed.sequence.toString(),
    gasFee: parsed.gasFee ? parsed.gasFee.toString() : undefined,
  };
  // get wallet address of associated token account for Solana
  // the recipient is the wallet address for the automatic payload type
  const toChainId = wh.toChainId(parsed.toChain);
  if (
    toChainId === MAINNET_CHAINS.solana &&
    parsed.payloadID === PayloadType.Manual
  ) {
    const accountOwner = await solanaContext().getTokenAccountOwner(
      parsed.recipient,
    );
    base.recipient = accountOwner;
  }
  return base;
};

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
  const chainConfig = CHAINS[chainName]!;
  const nativeDecimals = chainConfig.nativeTokenDecimals;
  return toFixedDecimals(utils.formatUnits(gasFee, nativeDecimals), 6);
};
