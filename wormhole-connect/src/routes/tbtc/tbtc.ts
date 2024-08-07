import { BigNumber, Contract } from 'ethers';
import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  SolanaContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import config from 'config';
import { TokenConfig, Route } from 'config/types';
import {
  getTokenDecimals,
  getTokenById,
  deNormalizeAmount,
  normalizeAmount,
} from 'utils';
import { isEvmChain } from 'utils/sdk';
import {
  SignedMessage,
  UnsignedMessage,
  TokenTransferMessage,
  SignedTokenTransferMessage,
  TBTCMessage,
  RelayerFee,
} from '../types';
import { adaptParsedMessage } from '../utils';
import {
  CHAIN_ID_ETH,
  CHAIN_ID_POLYGON,
  CHAIN_ID_SOLANA,
} from '@certusone/wormhole-sdk';
import { ThresholdL2WormholeGateway as EVMGateway } from './abi/evm/ThresholdL2WormholeGateway';
import * as SolanaGateway from './abi/solana/WormholeGateway';
import { fetchVaa } from 'utils/vaa';
import { arrayify, hexlify, parseUnits } from 'ethers/lib/utils.js';
import { BaseRoute } from '../bridge';
import { postVaa, signAndSendTransaction, TransferWallet } from 'utils/wallet';
import { isTBTCCanonicalChain } from './utils';
import { isGatewayChain } from 'utils/cosmos';
import {
  REASON_MANUAL_ADDRESS_NOT_SUPPORTED,
  RouteAvailability,
} from 'routes/abstracts';

const THRESHOLD_ARBITER_FEE = 0;
const THRESHOLD_NONCE = 0;
const TBTC_TOKEN_SYMBOL = 'tBTC';

export class TBTCRoute extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;
  readonly TYPE: Route = Route.TBTC;

  isSupportedChain(chain: ChainName): boolean {
    return !!config.wh.getContracts(chain)?.token_bridge;
  }

  async isSupportedSourceToken(
    token?: TokenConfig,
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!sourceChain) return false;
    if (!token || token.symbol !== TBTC_TOKEN_SYMBOL) return false;
    if (destToken && destToken.symbol !== TBTC_TOKEN_SYMBOL) return false;
    if (isTBTCCanonicalChain(sourceChain)) {
      return token.nativeChain === config.wh.toChainName(sourceChain);
    }
    return config.wh.toChainId(token.nativeChain) === CHAIN_ID_ETH;
  }

  async isSupportedDestToken(
    token?: TokenConfig,
    sourceToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!destChain) return false;
    if (!token || token.symbol !== TBTC_TOKEN_SYMBOL) return false;
    if (sourceToken && sourceToken.symbol !== TBTC_TOKEN_SYMBOL) return false;
    if (isTBTCCanonicalChain(destChain)) {
      return token.nativeChain === config.wh.toChainName(destChain);
    }
    return config.wh.toChainId(token.nativeChain) === CHAIN_ID_ETH;
  }

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (
      !config.routes.includes(Route.TBTC) ||
      !sourceChain ||
      !destChain ||
      !(await this.isSupportedSourceToken(
        config.tokens[sourceToken],
        config.tokens[destToken],
        sourceChain,
        destChain,
      )) ||
      !(await this.isSupportedDestToken(
        config.tokens[destToken],
        config.tokens[sourceToken],
        sourceChain,
        destChain,
      )) ||
      isGatewayChain(sourceChain) ||
      isGatewayChain(destChain)
    ) {
      return false;
    }
    return true;
  }

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    manualAddress?: boolean,
  ): Promise<RouteAvailability> {
    // this route is not available if the target addres is manual
    if (manualAddress)
      return {
        isAvailable: false,
        reason: REASON_MANUAL_ADDRESS_NOT_SUPPORTED,
      };
    return { isAvailable: true };
  }

  async computeReceiveAmount(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: any,
  ): Promise<number> {
    if (!sendAmount) return 0;
    return sendAmount;
  }
  async computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    if (!receiveAmount) return 0;
    return receiveAmount;
  }

  async validate(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean> {
    throw new Error('not implemented');
  }

  async estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions?: any,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  getMinSendAmount(
    token: TokenId | 'native',
    recipientChain: ChainName | ChainId,
    routeOptions: any,
  ): number {
    return 0;
  }

  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    destToken: string,
    routeOptions: any,
  ): Promise<string> {
    // Can only send tBTC
    if (token === 'native') {
      throw new Error('Native not supported');
    }
    const tokenConfig = getTokenById(token);
    if (!tokenConfig || tokenConfig.symbol !== TBTC_TOKEN_SYMBOL) {
      throw new Error(`Token ${token} not supported`);
    }
    const fromChainId = config.wh.toChainId(sendingChain);
    const fromChainName = config.wh.toChainName(sendingChain);
    const toChainId = config.wh.toChainId(recipientChain);
    const formattedRecipient = config.wh.formatAddress(
      recipientAddress,
      recipientChain,
    );
    const decimals = getTokenDecimals(fromChainId, token);
    const baseAmountParsed = parseUnits(amount, decimals);
    const feeParsed = parseUnits('0', decimals);
    const transferAmountParsed = baseAmountParsed.add(feeParsed);
    if (isEvmChain(sendingChain)) {
      const signer = config.wh.mustGetSigner(sendingChain);
      const sourceGatewayAddress =
        config.wh.getContracts(fromChainId)?.tbtcGateway;
      // Use the gateway contract to send if it exists
      if (sourceGatewayAddress) {
        const chainContext = config.wh.getContext(
          sendingChain,
        ) as EthContext<WormholeContext>;
        const gateway = new Contract(sourceGatewayAddress, EVMGateway, signer);
        // We need to truncate any dust from the amount so the token bridge
        // doesn't send it to the gateway contract
        const denormalizedAmount = deNormalizeAmount(
          normalizeAmount(transferAmountParsed, decimals),
          decimals,
        );
        await chainContext.approve(
          sendingChain,
          sourceGatewayAddress,
          token.address,
          denormalizedAmount,
        );
        // We increase the gas limit estimation here by a factor of 10% to account for
        // some faulty public JSON-RPC endpoints.
        const gasEstimate = await gateway.estimateGas.sendTbtc(
          denormalizedAmount,
          config.wh.toChainId(recipientChain),
          formattedRecipient,
          THRESHOLD_ARBITER_FEE,
          THRESHOLD_NONCE,
        );
        const gasLimit = gasEstimate.mul(1100).div(1000);
        const overrides = this.getOverrides(fromChainId, gasLimit);
        const tx = await gateway.sendTbtc(
          denormalizedAmount,
          toChainId,
          formattedRecipient,
          THRESHOLD_ARBITER_FEE,
          THRESHOLD_NONCE,
          overrides,
        );
        const receipt = await tx.wait();
        const txId = await signAndSendTransaction(
          fromChainName,
          receipt,
          TransferWallet.SENDING,
        );
        return txId;
      } else {
        const targetGatewayAddress =
          config.wh.getContracts(toChainId)?.tbtcGateway;
        let tx;
        if (targetGatewayAddress) {
          tx = await config.wh.send(
            token,
            transferAmountParsed.toString(),
            sendingChain,
            senderAddress,
            recipientChain,
            targetGatewayAddress,
            undefined,
            formattedRecipient,
          );
        } else {
          tx = await config.wh.send(
            token,
            transferAmountParsed.toString(),
            sendingChain,
            senderAddress,
            recipientChain,
            recipientAddress,
          );
        }
        const txId = await signAndSendTransaction(
          fromChainName,
          tx,
          TransferWallet.SENDING,
        );
        return txId;
      }
    } else if (fromChainId === CHAIN_ID_SOLANA) {
      const { core, token_bridge, tbtcGateway } =
        config.wh.mustGetContracts(fromChainId);
      if (!core || !token_bridge || !tbtcGateway) {
        throw new Error('Core, token bridge, or gateway not found');
      }
      const context = config.wh.getContext(
        fromChainId,
      ) as SolanaContext<WormholeContext>;
      const connection = context.connection;
      if (!connection) {
        throw new Error('Connection not found');
      }
      const tx = await SolanaGateway.sendTbtc(
        transferAmountParsed.toString(),
        toChainId,
        formattedRecipient,
        senderAddress,
        isTBTCCanonicalChain(toChainId),
        connection,
        tbtcGateway,
        token_bridge,
        core,
      );
      const txId = await signAndSendTransaction(
        fromChainName,
        tx,
        TransferWallet.SENDING,
      );
      return txId;
    } else {
      const targetGatewayAddress =
        config.wh.getContracts(toChainId)?.tbtcGateway;
      let tx;
      if (targetGatewayAddress) {
        tx = await config.wh.send(
          token,
          transferAmountParsed.toString(),
          sendingChain,
          senderAddress,
          recipientChain,
          targetGatewayAddress,
          undefined,
          formattedRecipient,
        );
      } else {
        tx = await config.wh.send(
          token,
          transferAmountParsed.toString(),
          sendingChain,
          senderAddress,
          recipientChain,
          recipientAddress,
        );
      }
      const txId = await signAndSendTransaction(
        fromChainName,
        tx,
        TransferWallet.SENDING,
      );
      return txId;
    }
  }

  async redeem(
    destChain: ChainName | ChainId,
    message: SignedTokenTransferMessage,
    payer: string,
  ): Promise<string> {
    const destChainId = config.wh.toChainId(destChain);
    const destChainName = config.wh.toChainName(destChain);
    const destGatewayAddress = config.wh.getContracts(destChain)?.tbtcGateway;
    if (isEvmChain(destChain) && destGatewayAddress) {
      // Use the gateway contract to receive if it exists
      const signer = config.wh.mustGetSigner(destChain);
      const gateway = new Contract(destGatewayAddress, EVMGateway, signer);
      const estimateGas = await gateway.estimateGas.receiveTbtc(message.vaa);
      // We increase the gas limit estimation here by a factor of 10% to account for
      // some faulty public JSON-RPC endpoints.
      const gasLimit = estimateGas.mul(1100).div(1000);
      const overrides = this.getOverrides(destChainId, gasLimit);
      const tx = await gateway.receiveTbtc(message.vaa, overrides);
      const receipt = await tx.wait();
      const txId = await signAndSendTransaction(
        destChainName,
        receipt,
        TransferWallet.RECEIVING,
      );
      return txId;
    } else if (destChainId === CHAIN_ID_SOLANA) {
      const signedVaa = Buffer.from(
        arrayify(message.vaa, { allowMissingPrefix: true }),
      );
      const context = config.wh.getContext(
        destChain,
      ) as SolanaContext<WormholeContext>;
      const connection = context.connection;
      if (!connection) {
        throw new Error('Connection not found');
      }
      const { core, token_bridge, tbtcGateway } =
        config.wh.mustGetContracts(destChain);
      if (!core || !token_bridge || !tbtcGateway) {
        throw new Error('Core, token bridge, or gateway not found');
      }
      await postVaa(connection, core, signedVaa);
      const tx = await SolanaGateway.receiveTbtc(
        signedVaa,
        payer,
        connection,
        tbtcGateway,
        token_bridge,
        core,
      );
      const txId = await signAndSendTransaction(
        destChainName,
        tx,
        TransferWallet.RECEIVING,
      );
      return txId;
    } else {
      const context = config.wh.getContext(destChainId);
      const tx = await context.redeem(
        destChain,
        arrayify(message.vaa),
        undefined,
        payer,
      );
      const txId = await signAndSendTransaction(
        destChainName,
        tx,
        TransferWallet.RECEIVING,
      );
      return txId;
    }
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
  ): Promise<RelayerFee | null> {
    return null;
  }

  async getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
    destToken?: TokenConfig,
  ): Promise<string | null> {
    const chainId = config.wh.toChainId(chain);
    if (isTBTCCanonicalChain(chainId)) {
      // The gateway contract mints canonical tBTC
      // Find the canonical tBTC token for the chain
      const addr = config.tokensArr.find(
        (t) =>
          t.symbol === TBTC_TOKEN_SYMBOL &&
          t.nativeChain === chain &&
          t.tokenId?.chain === chain,
      )?.tokenId?.address;
      if (!addr) throw new Error(`${TBTC_TOKEN_SYMBOL} not found for ${chain}`);
      return addr;
    } else {
      // If there's no gateway contract then Ethereum tBTC is canonical
      const tbtcToken = config.tokens[TBTC_TOKEN_SYMBOL];
      if (!tbtcToken?.tokenId) {
        throw new Error(`${TBTC_TOKEN_SYMBOL} tokenId not found`);
      }
      return await config.wh.getForeignAsset(tbtcToken.tokenId, chain);
    }
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<TBTCMessage> {
    const message = await config.wh.getMessage(tx, chain, false);
    const adapted = await adaptParsedMessage(message);
    const foreignAsset =
      (await this.getForeignAsset(adapted.tokenId, adapted.toChain)) || '';
    const tokenId = {
      address: foreignAsset,
      chain: isTBTCCanonicalChain(adapted.toChain)
        ? adapted.toChain
        : adapted.tokenChain,
    };
    const token = getTokenById(tokenId);
    const destContext = config.wh.getContext(message.toChain);
    const recipient =
      message.payload && message.payload.length > 0
        ? destContext.parseAddress(message.payload)
        : message.recipient;
    return {
      ...adapted,
      to: message.recipient,
      recipient,
      receivedTokenKey: token ? token.key : TBTC_TOKEN_SYMBOL,
    };
  }

  async getSignedMessage(
    message: TokenTransferMessage,
  ): Promise<SignedTokenTransferMessage> {
    const vaa = await fetchVaa(message);

    if (!vaa) {
      throw new Error('VAA not found');
    }

    return {
      ...message,
      vaa: hexlify(vaa.bytes),
    };
  }

  async nativeTokenAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber> {
    throw new Error('Not supported');
  }

  async maxSwapAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    throw new Error('Not supported');
  }

  async tryFetchRedeemTx(txData: UnsignedMessage): Promise<string | undefined> {
    return undefined; // only for automatic routes
  }

  getOverrides(destChain: ChainId, gasLimit: BigNumber) {
    const overrides = {
      gasLimit,
      // We use the legacy tx envelope here to avoid triggering gas price autodetection using EIP1559 for polygon.
      // EIP1559 is not actually implemented in polygon. The node is only API compatible but this breaks some clients
      // like ethers when choosing fees automatically.
      ...(destChain === CHAIN_ID_POLYGON && { type: 0 }),
    };
    return overrides;
  }
}
