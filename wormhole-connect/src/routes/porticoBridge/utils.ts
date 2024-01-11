import { hexStripZeros, hexZeroPad } from 'ethers/lib/utils.js';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  PorticoFlagSet,
  PorticoPayload,
  PorticoTradeParameters,
  PorticoTransferDestInfo,
} from './types';
import { BigNumber } from 'ethers';
import { Route, TokenConfig } from 'config/types';
import { porticoAbi } from './abis';
import {
  getChainByChainId,
  getWrappedToken,
  isEqualCaseInsensitive,
} from 'utils';
import { TOKENS } from 'config';
import { CHAIN_ID_ETH } from '@certusone/wormhole-sdk/lib/esm/utils/consts';
import { toChainId, wh } from 'utils/sdk';
import { TransferDestInfo } from 'routes/types';

export const parseAddress = (buffer: Buffer): string => {
  return hexZeroPad(hexStripZeros(buffer), 20);
};

export const parseTradeParameters = (
  buffer: Buffer,
): PorticoTradeParameters => {
  return {
    flagSet: parseFlagSet(buffer),
    startTokenAddress: parseAddress(buffer.slice(32, 64)),
    canonAssetAddress: parseAddress(buffer.slice(64, 96)),
    finalTokenAddress: parseAddress(buffer.slice(96, 128)),
    recipientAddress: parseAddress(buffer.slice(128, 160)),
    destinationPorticoAddress: parseAddress(buffer.slice(160, 192)),
    amountSpecified: BigNumber.from(buffer.slice(192, 224)),
    minAmountStart: BigNumber.from(buffer.slice(224, 256)),
    minAmountFinish: BigNumber.from(buffer.slice(256, 288)),
    relayerFee: BigNumber.from(buffer.slice(288, 320)),
  };
};

export const parsePorticoPayload = (buffer: Buffer): PorticoPayload => {
  return {
    flagSet: parseFlagSet(buffer),
    finalTokenAddress: parseAddress(buffer.slice(32, 64)),
    recipientAddress: parseAddress(buffer.slice(64, 96)),
    canonAssetAmount: BigNumber.from(buffer.slice(96, 128)),
    minAmountFinish: BigNumber.from(buffer.slice(128, 160)),
    relayerFee: BigNumber.from(buffer.slice(160, 192)),
  };
};

export const parseFlagSet = (buffer: Buffer): PorticoFlagSet => {
  return {
    recipientChain: buffer.readUInt16LE(0),
    bridgeNonce: buffer.readUInt32LE(2),
    feeTierStart: buffer.readUintLE(6, 3),
    feeTierFinish: buffer.readUintLE(9, 3),
    shouldWrapNative: !!(buffer.readUInt8(31) & (1 << 0)),
    shouldUnwrapNative: !!(buffer.readUInt8(31) & (1 << 1)),
  };
};

/**
 * Validates that the response from the order creation API matches the request
 * throws an error if there is a mismatch
 */
export const validateCreateOrderResponse = async (
  response: CreateOrderResponse,
  request: CreateOrderRequest,
  startToken: TokenConfig,
): Promise<void> => {
  if (
    !isEqualCaseInsensitive(
      request.porticoAddress || '',
      response.transactionTarget,
    )
  ) {
    throw new Error('portico address mismatch');
  }

  const decoded = porticoAbi.decodeFunctionData(
    'start',
    response.transactionData,
  );
  if (decoded.length !== 1 || decoded[0].length !== 10) {
    throw new Error('decoded length mismatch');
  }

  const flagSetBuffer = Buffer.from(decoded[0][0].slice(2), 'hex');
  if (flagSetBuffer.length !== 32) {
    throw new Error('flag set length mismatch');
  }
  const {
    recipientChain,
    feeTierStart,
    feeTierFinish,
    shouldWrapNative,
    shouldUnwrapNative,
  } = parseFlagSet(flagSetBuffer);

  if (recipientChain !== getChainByChainId(request.destinationChainId)?.id) {
    throw new Error('recipient chain mismatch');
  }

  if (feeTierStart !== request.feeTierStart) {
    throw new Error('fee tier start mismatch');
  }

  if (feeTierFinish !== request.feeTierEnd) {
    throw new Error('fee tier end mismatch');
  }

  if (shouldWrapNative !== request.shouldWrapNative) {
    throw new Error('should wrap native mismatch');
  }

  if (shouldUnwrapNative !== request.shouldUnwrapNative) {
    throw new Error('should unwrap native mismatch');
  }

  const startTokenAddress: string = decoded[0][1];
  if (!isEqualCaseInsensitive(startTokenAddress, request.startingToken)) {
    throw new Error('start token address mismatch');
  }

  const canonicalTokenAddress: string = decoded[0][2];
  if (
    !isEqualCaseInsensitive(
      canonicalTokenAddress,
      await getCanonicalTokenAddress(startToken),
    )
  ) {
    throw new Error('canonical token address mismatch');
  }

  const finalTokenAddress: string = decoded[0][3];
  if (!isEqualCaseInsensitive(finalTokenAddress, request.destinationToken)) {
    throw new Error('final token address mismatch');
  }

  const recipientAddress: string = decoded[0][4];
  if (!isEqualCaseInsensitive(recipientAddress, request.destinationAddress)) {
    throw new Error('recipient address mismatch');
  }

  const destinationPorticoAddress = decoded[0][5];
  if (
    !isEqualCaseInsensitive(
      destinationPorticoAddress,
      request.destinationPorticoAddress || '',
    )
  ) {
    throw new Error('destination portico address mismatch');
  }

  const amountSpecified: BigNumber = decoded[0][6];
  if (amountSpecified.toString() !== request.startingTokenAmount) {
    throw new Error('amount mismatch');
  }

  const minAmountStart: BigNumber = decoded[0][7];
  if (minAmountStart.toString() !== request.minAmountStart) {
    throw new Error('min amount start mismatch');
  }

  const minAmountFinish: BigNumber = decoded[0][8];
  if (minAmountFinish.toString() !== request.minAmountEnd) {
    throw new Error('min amount finish mismatch');
  }

  const relayerFee: BigNumber = decoded[0][9];
  if (relayerFee.toString() !== request.relayerFee) {
    throw new Error('relayer fee mismatch');
  }
};

/**
 * The canonical token address is the foreign asset of the token bridged from Ethereum
 */
export const getCanonicalTokenAddress = async (
  token: TokenConfig,
): Promise<string> => {
  const tokenOnEthereum = Object.values(TOKENS).find(
    (t) =>
      t.symbol === token.symbol && toChainId(t.nativeChain) === CHAIN_ID_ETH,
  );
  if (!tokenOnEthereum) {
    throw new Error(`${token.symbol} not found on Ethereum`);
  }
  const { tokenId } = getWrappedToken(tokenOnEthereum);
  if (!tokenId) {
    throw new Error('Canonical token not found');
  }
  return await wh.mustGetForeignAsset(tokenId, token.nativeChain);
};

export const isPorticoRoute = (route: Route): boolean => {
  switch (route) {
    case Route.ETHBridge:
    case Route.wstETHBridge:
      return true;
    default:
      return false;
  }
};

export const isPorticoTransferDestInfo = (
  info: TransferDestInfo | undefined,
): info is PorticoTransferDestInfo => !!(info && isPorticoRoute(info.route));
