import { getWormholeContextV2 } from 'config';
import { RelayerFee } from 'store/relay';
import {
  Chain,
  Wormhole,
  AttestedTransferReceipt,
  RedeemedTransferReceipt,
  DestinationQueuedTransferReceipt,
  CompletedTransferReceipt,
  TokenBridge,
  Network,
  amount,
  routes,
  CircleTransfer,
  circle,
  ChainContext,
  nativeTokenId,
} from '@wormhole-foundation/sdk';
import config from 'config';
import { NttRoute } from '@wormhole-foundation/sdk-route-ntt';
import { Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { WORMSCAN } from 'config/constants';
import { TokenTuple } from 'config/tokens';

// Used to represent an initiated transfer. Primarily for the Redeem view.
export interface TransferInfo {
  // Transaction hash
  sendTx: string;

  // Stringified addresses
  sender?: string;
  recipient: string;

  amount: amount.Amount;

  toChain: Chain;
  fromChain: Chain;

  // Source token address
  tokenAddress: string;
  token: TokenTuple;
  tokenDecimals: number;

  // Destination token
  receivedToken: TokenTuple;
  receiveAmount?: amount.Amount;
  relayerFee?: RelayerFee;

  // Amount of native gas being received, in destination gas token units
  receiveNativeAmount?: amount.Amount;

  // ETA for the route this transfer was initiated on
  eta?: number;
}

export type ExplorerInfo = {
  url: string;
  name: string;
  apiUrl: string;
};

// TODO SDKV2 add a way for the Route interface to offer this
export function getExplorerInfo(
  route: string | routes.Route<Network>,
  txHash: string,
): ExplorerInfo {
  const routeName =
    typeof route === 'string'
      ? route
      : (route.constructor as routes.RouteConstructor).meta.name;

  // IMPORTANT: HyperliquidRoute uses MayanSwap to bridge funds into Arbitrum,
  // therefore we need to show Mayan explorer link for HL as well.
  if (
    routeName.startsWith('MayanSwap') ||
    routeName.startsWith('HyperliquidRoute')
  ) {
    return {
      url: `https://explorer.mayan.finance/swap/${txHash}`,
      name: 'Mayan Explorer',
      apiUrl: `${config.mayanApi}/v3/swap/trx/${txHash}`,
    };
  } else {
    return {
      url: `${WORMSCAN}tx/${txHash}${
        config.isMainnet ? '' : '?network=TESTNET'
      }`,
      name: 'Wormholescan',
      apiUrl: `${config.wormholeApi}api/v1/operations?txHash=${txHash}`,
    };
  }
}

type ReceiptWithAttestation<AT> =
  | AttestedTransferReceipt<AT>
  | RedeemedTransferReceipt<AT>
  | DestinationQueuedTransferReceipt<AT>
  | CompletedTransferReceipt<AT>;

// `parseReceipt` is used when we resume a transaction to get the transaction details
// from the VAA. Each protocol has different data in its VAAs and this parses them
// into the common internal format used by Connect: `TransferInfo`
//
// TODO SDKV2 this should probably not live in Connect.
// SDKV2 should provide a TransferInfo type and Routes should each be able to
// parse their own attestation into this type.
//
// Connect should never have to look inside of an attestation - that's too low-level.
export async function parseReceipt(
  route: string,
  receipt: ReceiptWithAttestation<any>,
): Promise<TransferInfo | null> {
  switch (route) {
    case 'ManualTokenBridge':
      return await parseTokenBridgeReceipt(
        receipt as ReceiptWithAttestation<TokenBridge.TransferVAA>,
      );
    case 'ManualCCTP':
      return await parseCCTPReceipt(
        receipt as ReceiptWithAttestation<CircleTransfer.CircleAttestationReceipt>,
      );
    case 'ManualNtt':
      return parseNttReceipt(
        receipt as ReceiptWithAttestation<NttRoute.ManualAttestationReceipt> & {
          params: NttRoute.ValidatedParams;
        },
      );
    case 'AutomaticNtt':
      return parseNttReceipt(
        receipt as ReceiptWithAttestation<NttRoute.AutomaticAttestationReceipt> & {
          params: NttRoute.ValidatedParams;
        },
      );
    default:
      throw new Error(`Unknown route type ${route}`);
  }
}

const parseTokenBridgeReceipt = async (
  receipt: ReceiptWithAttestation<TokenBridge.TransferVAA>,
): Promise<TransferInfo> => {
  const txData: Partial<TransferInfo> = {
    toChain: receipt.to,
    fromChain: receipt.from,
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
    const wh = await getWormholeContextV2();
    const fromChain = wh.getChain(receipt.from);
    const toChain = wh.getChain(receipt.to);

    const getToken = async (context: ChainContext<Network>, token: any) => {
      const tb = await context.getTokenBridge();
      const { chain } = context;

      const tokenAddress =
        token.chain === chain
          ? await tb.getTokenNativeAddress(token.chain, token.address)
          : await tb.getWrappedAsset({
              chain: token.chain,
              address: token.address,
            });

      const wrappedNative = await tb.getWrappedNative();

      const tokenId =
        wrappedNative.toString() === tokenAddress.toString()
          ? nativeTokenId(chain)
          : Wormhole.tokenId(chain, tokenAddress.toString());

      return config.tokens.get(tokenId);
    };

    const sourceToken = await getToken(fromChain, payload.token);
    if (!sourceToken) throw new Error(`Unknown source token`);

    const destinationToken = await getToken(toChain, payload.token);
    if (!destinationToken) throw new Error(`Unknown destination token`);

    txData.tokenDecimals = sourceToken.decimals;
    txData.amount = amount.fromBaseUnits(
      payload.token.amount,
      // VAAs are truncated to a max of 8 decimal places
      Math.min(8, sourceToken.decimals),
    );
    txData.tokenAddress = sourceToken.address.toString();
    txData.token = sourceToken.tuple;
    txData.receivedToken = destinationToken.tuple;
    txData.receiveAmount = txData.amount;
  }

  if (payload.to) {
    if (receipt.to === 'Solana') {
      if (!config.rpcs.Solana) {
        throw new Error('Missing Solana RPC');
      }
      // the recipient on the VAA is the ATA
      const ata = payload.to.address.toNative(receipt.to).toString();
      const connection = new Connection(config.rpcs.Solana);
      try {
        const account = await splToken.getAccount(
          connection,
          new PublicKey(ata),
        );
        txData.recipient = account.owner.toBase58();
      } catch (e) {
        console.error(e);
        txData.recipient = ata;
      }
    } else {
      txData.recipient = payload.to.address.toNative(receipt.to).toString();
    }
  }

  return txData as TransferInfo;
};

const parseCCTPReceipt = async (
  receipt: ReceiptWithAttestation<CircleTransfer.CircleAttestationReceipt>,
): Promise<TransferInfo> => {
  const txData: Partial<TransferInfo> = {
    toChain: receipt.to,
    fromChain: receipt.from,
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
    receipt.from === 'Sui'
      ? // The `burnToken` from Sui is the keccak256 hash of the USDC token address,
        // so we need to override it with the actual USDC address
        circle.usdcContract.get(config.network, receipt.from)!
      : payload.burnToken.toNative(receipt.from).toString(),
  );
  const usdcLegacy = config.tokens.get(sourceTokenId);

  if (!usdcLegacy) {
    throw new Error(`Couldn't find USDC for source chain`);
  }

  txData.tokenAddress = sourceTokenId.address.toString();
  txData.token = usdcLegacy.tuple;
  txData.tokenDecimals = usdcLegacy.decimals;
  txData.amount = amount.fromBaseUnits(payload.amount, usdcLegacy.decimals);
  txData.receiveAmount = txData.amount;

  txData.sender = payload.messageSender.toNative(receipt.from).toString();
  if (receipt.to === 'Solana') {
    if (!config.rpcs.Solana) {
      throw new Error('Missing Solana RPC');
    }
    // the recipient on the VAA is the ATA
    const ata = payload.mintRecipient.toNative(receipt.to).toString();
    const connection = new Connection(config.rpcs.Solana);
    try {
      const account = await splToken.getAccount(connection, new PublicKey(ata));
      txData.recipient = account.owner.toBase58();
    } catch (e) {
      console.error(e);
      txData.recipient = ata;
    }
  } else {
    txData.recipient = payload.mintRecipient.toNative(receipt.to).toString();
  }

  // The attestation doesn't have the destination token address, but we can deduce which it is
  // just based off the destination chain
  if (txData.toChain) {
    const usdcContract = circle.usdcContract.get(
      config.network,
      txData.toChain,
    );
    if (!usdcContract) {
      throw new Error(`Couldn't find USDC for destination chain`);
    }
    const destinationUsdcLegacy = config.tokens.get(
      txData.toChain,
      usdcContract,
    );
    if (!destinationUsdcLegacy) {
      throw new Error(`Couldn't find USDC for destination chain`);
    }

    txData.receivedToken = destinationUsdcLegacy.tuple;
  }

  return txData as TransferInfo;
};

const parseNttReceipt = (
  receipt: ReceiptWithAttestation<
    NttRoute.ManualAttestationReceipt | NttRoute.AutomaticAttestationReceipt
  > & {
    params: NttRoute.ValidatedParams;
  },
): TransferInfo => {
  let sendTx = '';
  if ('originTxs' in receipt && receipt.originTxs.length > 0) {
    sendTx = receipt.originTxs[receipt.originTxs.length - 1].txid;
  } else {
    throw new Error("Can't find txid in receipt");
  }

  const srcTokenIdV2 = Wormhole.tokenId(
    receipt.from,
    receipt.params.normalizedParams.sourceContracts.token,
  );
  const srcToken = config.tokens.get(srcTokenIdV2);
  if (!srcToken) {
    // This is a token Connect is not aware of
    throw new Error('Unknown src token');
  }

  const dstTokenIdV2 = Wormhole.tokenId(
    receipt.to,
    receipt.params.normalizedParams.destinationContracts.token,
  );
  const dstToken = config.tokens.get(dstTokenIdV2);
  if (!dstToken) {
    // This is a token Connect is not aware of
    throw new Error('Unknown dst token');
  }

  const { attestation } = receipt.attestation;
  const { payload } =
    attestation.payloadName === 'WormholeTransfer'
      ? attestation
      : attestation.payload;
  const { trimmedAmount } = payload.nttManagerPayload.payload;
  const amt = amount.fromBaseUnits(
    trimmedAmount.amount,
    trimmedAmount.decimals,
  );
  return {
    toChain: receipt.to,
    fromChain: receipt.from,
    sendTx,
    sender: payload.nttManagerPayload.sender.toNative(receipt.from).toString(),
    recipient: payload.nttManagerPayload.payload.recipientAddress
      .toNative(receipt.to)
      .toString(),
    amount: amt,
    tokenAddress: srcToken.tokenId!.address.toString(),
    token: srcToken.tuple,
    tokenDecimals: trimmedAmount.decimals,
    receivedToken: dstToken.tuple,
    receiveAmount: amt,
    relayerFee: undefined, // TODO: how to get?
  };
};

const isAmount = (amount: any): amount is amount.Amount => {
  return (
    typeof amount === 'object' &&
    typeof amount.amount === 'string' &&
    typeof amount.decimals === 'number'
  );
};

// Warning: any changes to this function can make TS unhappy
export const isMinAmountError = (
  error?: Error,
): error is routes.MinAmountError => {
  const unsafeCastError = error as routes.MinAmountError;
  return isAmount(unsafeCastError?.min);
};
