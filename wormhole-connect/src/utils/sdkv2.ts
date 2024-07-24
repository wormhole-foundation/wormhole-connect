import { getWormholeContextV2 } from 'config';
import { RelayerFee } from 'store/relay';
import { TokenConfig } from 'config/types';
import {
  TokenId,
  Chain,
  TokenAddress,
  Wormhole,
  AttestedTransferReceipt,
  RedeemedTransferReceipt,
  DestinationQueuedTransferReceipt,
  CompletedTransferReceipt,
  TokenBridge,
  amount,
  CircleTransfer,
} from '@wormhole-foundation/sdk';
import config from 'config';
import { Route } from 'config/types';
import { ChainName } from 'sdklegacy/types';

// Used to represent an initiated transfer. Primarily for the Redeem view.
export interface TransferInfo {
  // Transaction hash
  sendTx: string;

  // Stringified addresses
  sender?: string;
  recipient: string;

  amount: string;

  toChain: ChainName;
  fromChain: ChainName;

  // Source token address
  tokenAddress: string;
  tokenKey: string;
  tokenDecimals: number;

  // Destination token
  receivedTokenKey: string;
  receiveAmount?: string;
  relayerFee?: RelayerFee;

  // Amount of native gas being received, in destination gas token units
  // For example 1.0 is 1.0 ETH, not 1 wei
  receiveNativeAmount?: number;
}

// This function has three levels of priority when fetching a token bridge
// foreign asset address.
//
// 1. Check built-in config
// 2. Check cache
// 3. Fetch the address on chain using RPC (& cache this for next time)
export async function getTokenBridgeWrappedTokenAddress<C extends Chain>(
  token: TokenConfig,
  chain: C,
): Promise<TokenAddress<C> | null> {
  // Try cache first
  const cached = config.wrappedTokenAddressCache.get(token.key, chain);
  if (cached) {
    return cached;
  }

  // Fetch live and cache
  const wh = await getWormholeContextV2();
  const chainContext = wh.getChain(chain);
  const tb = await chainContext.getTokenBridge();

  console.info(
    `Resolving foreign address for token ${token.key} on chain ${chain}`,
  );

  const tokenId = config.sdkConverter.toTokenIdV2(token);

  try {
    const wrapped = await tb.getWrappedAsset(tokenId);

    if (wrapped) {
      config.wrappedTokenAddressCache.set(token.key, chain, wrapped);
    }

    return wrapped;
  } catch (_e) {
    return null;
  }
}

export async function getDecimals(
  token: TokenId,
  chain: Chain,
): Promise<number> {
  const wh = await getWormholeContextV2();
  return await wh.getDecimals(chain, token.address);
}

type ReceiptWithAttestation<AT> =
  | AttestedTransferReceipt<AT>
  | RedeemedTransferReceipt<AT>
  | DestinationQueuedTransferReceipt<AT>
  | CompletedTransferReceipt<AT>;

// `parseReceipt` is used when we resume a transaction to get the transaction details
// from the VAA. Each protocol has different data in its VAAs and this parses them
// into the common internal format used by Connect: `TransferInfo`
export function parseReceipt(
  route: Route,
  receipt: ReceiptWithAttestation<any>,
): TransferInfo | null {
  switch (route) {
    case Route.Bridge:
      return parseTokenBridgeReceipt(
        receipt as ReceiptWithAttestation<TokenBridge.TransferVAA>,
      );
    case Route.CCTPManual:
      return parseCCTPReceipt(
        receipt as ReceiptWithAttestation<CircleTransfer.CircleAttestationReceipt>,
      );
    default:
      throw new Error(`Unknown route type ${route}`);
  }
}

const parseTokenBridgeReceipt = (
  receipt: ReceiptWithAttestation<TokenBridge.TransferVAA>,
): TransferInfo => {
  const txData: Partial<TransferInfo> = {
    toChain: config.sdkConverter.toChainNameV1(receipt.to),
    fromChain: config.sdkConverter.toChainNameV1(receipt.from),
  };

  if ('originTxs' in receipt && receipt.originTxs.length > 0) {
    txData.sendTx = receipt.originTxs[receipt.originTxs.length - 1].txid;
  } else {
    throw new Error("Can't find txid in receipt");
  }

  /* @ts-ignore */
  // TODO typescript is complaining about the second attestation property not existing when it does
  const { payload } = receipt.attestation.attestation;

  if (!payload.token) {
    throw new Error(`Attestation is missing token.`);
  }

  if (payload.token) {
    const tokenIdV2 = Wormhole.tokenId(
      payload.token.chain,
      payload.token.address,
    );
    const tokenV1 = config.sdkConverter.findTokenConfigV1(
      tokenIdV2,
      config.tokensArr,
    );

    if (!tokenV1) {
      // This is a token Connect is not aware of
      throw new Error('Unknown token');
    }

    const fromChain = config.sdkConverter.toChainNameV1(receipt.from);
    const fromChainConfig = config.chains[fromChain];
    const decimals =
      tokenV1!.decimals[fromChainConfig!.context] || tokenV1!.decimals.default;

    txData.tokenDecimals = decimals;
    txData.amount = amount.display({
      amount: payload.token.amount.toString(),
      decimals,
    });
    txData.tokenAddress = payload.token.address.toString();
    txData.tokenKey = tokenV1.key;
    txData.receivedTokenKey = tokenV1.key;
  }

  if (payload.to) {
    txData.recipient = payload.to.address.toString();
  }

  return txData as TransferInfo;
};

const parseCCTPReceipt = (
  receipt: ReceiptWithAttestation<CircleTransfer.CircleAttestationReceipt>,
): TransferInfo => {
  const txData: Partial<TransferInfo> = {
    toChain: config.sdkConverter.toChainNameV1(receipt.to),
    fromChain: config.sdkConverter.toChainNameV1(receipt.from),
  };

  if ('originTxs' in receipt && receipt.originTxs.length > 0) {
    txData.sendTx = receipt.originTxs[receipt.originTxs.length - 1].txid;
  } else {
    throw new Error("Can't find txid in receipt");
  }

  if (!receipt.attestation.attestation) {
    throw new Error(`Missing Circle attestation`);
  }

  const { payload } = receipt.attestation.attestation.message;

  const sourceTokenId = Wormhole.tokenId(
    receipt.from,
    payload.burnToken.toNative(receipt.from).toString(),
  );
  const usdcLegacy = config.sdkConverter.findTokenConfigV1(
    sourceTokenId,
    config.tokensArr,
  );
  if (!usdcLegacy) {
    throw new Error(`Couldn't find USDC for source chain`);
  }

  txData.tokenAddress = sourceTokenId.address.toString();
  txData.tokenKey = usdcLegacy.key;

  const decimals = usdcLegacy.decimals.default;

  txData.tokenDecimals = decimals;
  txData.amount = amount.display({
    amount: payload.amount.toString(),
    decimals,
  });

  txData.sender = payload.messageSender.toNative(receipt.from).toString();
  txData.recipient = payload.mintRecipient.toNative(receipt.to).toString();

  // The attestation doesn't have the destination token address, but we can deduce which it is
  // just based off the destination chain
  const destinationUsdcLegacy = config.tokensArr.find((token) => {
    return token.symbol === 'USDC' && token.nativeChain === txData.toChain;
  });
  if (!destinationUsdcLegacy) {
    throw new Error(`Couldn't find USDC for destination chain`);
  }

  txData.receivedTokenKey = destinationUsdcLegacy.key;

  return txData as TransferInfo;
};
