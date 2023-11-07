import { BigNumber, Contract } from 'ethers';
import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  SolanaContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS, ROUTES, TOKENS, isMainnet, TOKENS_ARR } from 'config';
import { TokenConfig, Route } from 'config/types';
import {
  MAX_DECIMALS,
  getTokenDecimals,
  toNormalizedDecimals,
  getDisplayName,
  getTokenById,
  deNormalizeAmount,
  normalizeAmount,
} from 'utils';
import { formatAddress, isEvmChain, toChainId, wh } from 'utils/sdk';
import { NO_INPUT } from 'utils/style';
import {
  SignedMessage,
  TransferDisplayData,
  TransferInfoBaseParams,
  TransferDestInfoBaseParams,
  UnsignedMessage,
  TokenTransferMessage,
  SignedTokenTransferMessage,
  isSignedWormholeMessage,
  TBTCMessage,
} from '../types';
import { formatGasFee } from '../utils';
import {
  CHAIN_ID_POLYGON,
  CHAIN_ID_OPTIMISM,
  CHAIN_ID_ARBITRUM,
  CHAIN_ID_BASE,
  CHAIN_ID_SOLANA,
} from '@certusone/wormhole-sdk';
import { ThresholdL2WormholeGateway as EVMGateway } from './abi/evm/ThresholdL2WormholeGateway';
import { receiveTbtc, sendTbtc } from './abi/solana/WormholeGateway';
import { fetchVaa, getUnsignedVaaEvm } from 'utils/vaa';
import { arrayify, hexlify, parseUnits } from 'ethers/lib/utils.js';
import { BaseRoute } from '../bridge';
import { toDecimals } from 'utils/balance';
import { postVaa, signAndSendTransaction, TransferWallet } from 'utils/wallet';
import { getNativeVersionOfToken } from 'store/transferInput';
import { CHAIN_ID_ETH } from '@xlabs-libs/wallet-aggregator-core';

export const THRESHOLD_ARBITER_FEE = 0;
export const THRESHOLD_NONCE = 0;
export const TBTC_TOKEN_SYMBOL = 'tBTC';

export const isTBTCCanonicalChain = (chain: ChainId | ChainName): boolean =>
  !!THRESHOLD_GATEWAYS[wh.toChainId(chain)];

const THRESHOLD_GATEWAYS_MAINNET: { [key in ChainId]?: string } = {
  [CHAIN_ID_POLYGON]: '0x09959798B95d00a3183d20FaC298E4594E599eab',
  [CHAIN_ID_OPTIMISM]: '0x1293a54e160D1cd7075487898d65266081A15458',
  [CHAIN_ID_ARBITRUM]: '0x1293a54e160D1cd7075487898d65266081A15458',
  [CHAIN_ID_BASE]: '0x09959798B95d00a3183d20FaC298E4594E599eab',
  [CHAIN_ID_SOLANA]: '87MEvHZCXE3ML5rrmh5uX1FbShHmRXXS32xJDGbQ7h5t', // Solana TBTC Gateway Program
};

const THRESHOLD_GATEWAYS_TESTNET: { [key in ChainId]?: string } = {
  [CHAIN_ID_POLYGON]: '0x91fe7128f74dbd4f031ea3d90fc5ea4dcfd81818',
  [CHAIN_ID_OPTIMISM]: '0x6449F4381f3d63bDfb36B3bDc375724aD3cD4621',
  [CHAIN_ID_ARBITRUM]: '0x31A15e213B59E230b45e8c5c99dAFAc3d1236Ee2',
  [CHAIN_ID_BASE]: '0xe3e0511EEbD87F08FbaE4486419cb5dFB06e1343',
  [CHAIN_ID_SOLANA]: '87MEvHZCXE3ML5rrmh5uX1FbShHmRXXS32xJDGbQ7h5t', // Solana TBTC Gateway Program
};

const THRESHOLD_GATEWAYS = isMainnet
  ? THRESHOLD_GATEWAYS_MAINNET
  : THRESHOLD_GATEWAYS_TESTNET;

/*
const THRESHOLD_TBTC_CONTRACTS_MAINNET: { [key in ChainId]?: string } = {
  [CHAIN_ID_ETH]: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
  [CHAIN_ID_POLYGON]: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b',
  [CHAIN_ID_OPTIMISM]: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
  [CHAIN_ID_ARBITRUM]: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
  [CHAIN_ID_BASE]: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b',
  [CHAIN_ID_SOLANA]: '6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU', // Solana TBTC Mint
};

const THRESHOLD_TBTC_CONTRACTS_TESTNET: { [key in ChainId]?: string } = {
  [CHAIN_ID_ETH]: '0x679874fBE6D4E7Cc54A59e315FF1eB266686a937',
  [CHAIN_ID_POLYGON]: '0xBcD7917282E529BAA6f232DdDc75F3901245A492',
  [CHAIN_ID_OPTIMISM]: '0x1a53759DE2eADf73bd0b05c07a4F1F5B7912dA3d',
  [CHAIN_ID_ARBITRUM]: '0x85727F4725A4B2834e00Db1AA8e1b843a188162F',
  [CHAIN_ID_BASE]: '0x783349cd20f26CE12e747b1a17bC38D252c9e119',
  [CHAIN_ID_SOLANA]: '6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU', // Solana TBTC Mint
};
*/

export class TBTCRoute extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;

  isSupportedChain(chain: ChainName): boolean {
    return !!wh.getContracts(chain)?.token_bridge;
  }

  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    console.log('foo');
    if (!token) return false;
    return token.symbol === TBTC_TOKEN_SYMBOL;
  }

  async isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    console.log('foo');
    if (!token) return false;
    return token.symbol === TBTC_TOKEN_SYMBOL;
  }

  /*
  async supportedSourceTokens(
    tokens: TokenConfig[],
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<TokenConfig[]> {
    if (!destToken) return tokens;
    const shouldAdd = await Promise.allSettled(
      tokens.map((token) =>
        this.isSupportedSourceToken(token, destToken, sourceChain, destChain),
      ),
    );
    return tokens.filter((_token, i) => {
      const res = shouldAdd[i];
      return res.status === 'fulfilled' && res.value;
    });
  }

  async supportedDestTokens(
    tokens: TokenConfig[],
    sourceToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<TokenConfig[]> {
    if (!sourceToken) return tokens;
    const shouldAdd = await Promise.allSettled(
      tokens.map((token) =>
        this.isSupportedDestToken(token, sourceToken, sourceChain, destChain),
      ),
    );
    return tokens.filter((_token, i) => {
      const res = shouldAdd[i];
      return res.status === 'fulfilled' && res.value;
    });
  }
  */

  // The route is available if the token is tBTC and the gateway contract exists
  // on either the source or target chain
  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (
      !ROUTES.includes(Route.TBTC) ||
      !sourceChain ||
      !destChain ||
      TOKENS[sourceToken]?.symbol !== TBTC_TOKEN_SYMBOL ||
      TOKENS[destToken]?.symbol !== TBTC_TOKEN_SYMBOL
    ) {
      return false;
    }
    return isTBTCCanonicalChain(sourceChain) || isTBTCCanonicalChain(destChain);
  }

  async computeReceiveAmount(
    sendAmount: number | undefined,
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
    console.log('estimateSendGas');
    const chainId = wh.toChainId(sendingChain);
    const decimals = getTokenDecimals(chainId, token);
    const baseAmountParsed = parseUnits(amount, decimals);
    const feeParsed = parseUnits('0', decimals);
    const transferAmountParsed = baseAmountParsed.add(feeParsed);
    if (isEvmChain(chainId)) {
      const gatewayAddress = THRESHOLD_GATEWAYS[chainId];
      if (gatewayAddress) {
        const signer = wh.mustGetSigner(sendingChain);
        const L2WormholeGateway = new Contract(
          gatewayAddress,
          EVMGateway,
          signer,
        );
        // We need to truncate any dust from the amount so the token bridge
        // doesn't send it to the gateway contract
        const denormalizedAmount = deNormalizeAmount(
          normalizeAmount(transferAmountParsed, decimals),
          decimals,
        );
        // TODO: make sure this works for solana
        const formattedRecipient = wh.formatAddress(
          recipientAddress,
          recipientChain,
        );
        return await L2WormholeGateway.estimateGas.sendTbtc(
          denormalizedAmount,
          wh.toChainId(recipientChain),
          formattedRecipient,
          THRESHOLD_ARBITER_FEE,
          THRESHOLD_NONCE,
        );
      } else {
        const context = wh.getContext(
          sendingChain,
        ) as EthContext<WormholeContext>;
        // TODO: we should be estimating send with payload here
        const est = await context.estimateSendGas(
          token,
          transferAmountParsed.toString(),
          sendingChain,
          senderAddress,
          recipientChain,
          recipientAddress,
        );
        console.log(`estimateSendGas: ${est.toString()}`);
        return est;
      }
    }
    throw new Error('not implemented');
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  getMinSendAmount(routeOptions: any): number {
    return 0;
  }

  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
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
    const fromChainId = wh.toChainId(sendingChain);
    const fromChainName = wh.toChainName(sendingChain);
    const toChainId = wh.toChainId(recipientChain);
    const formattedRecipient = wh.formatAddress(
      recipientAddress,
      recipientChain,
    );
    const decimals = getTokenDecimals(fromChainId, token);
    const baseAmountParsed = parseUnits(amount, decimals);
    const feeParsed = parseUnits('0', decimals);
    const transferAmountParsed = baseAmountParsed.add(feeParsed);
    if (isEvmChain(sendingChain)) {
      const signer = wh.mustGetSigner(sendingChain);
      const sourceGatewayAddress = THRESHOLD_GATEWAYS[fromChainId];
      // Use the gateway contract to send if it exists
      if (sourceGatewayAddress) {
        const chainContext = wh.getContext(
          sendingChain,
        ) as EthContext<WormholeContext>;
        const L2WormholeGateway = new Contract(
          sourceGatewayAddress,
          EVMGateway,
          signer,
        );
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
        const estimateGas = await L2WormholeGateway.estimateGas.sendTbtc(
          denormalizedAmount,
          toChainId,
          formattedRecipient,
          THRESHOLD_ARBITER_FEE,
          THRESHOLD_NONCE,
        );
        // We increase the gas limit estimation here by a factor of 10% to account for
        // some faulty public JSON-RPC endpoints.
        const gasLimit = estimateGas.mul(1100).div(1000);
        const overrides = {
          gasLimit,
          // We use the legacy tx envelope here to avoid triggering gas price autodetection using EIP1559 for polygon.
          // EIP1559 is not actually implemented in polygon. The node is only API compatible but this breaks some clients
          // like ethers when choosing fees automatically.
          ...(fromChainId === CHAIN_ID_POLYGON && { type: 0 }),
        };
        const tx = await L2WormholeGateway.sendTbtc(
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
        // The gateway contract must exist on the target chain
        const targetGatewayAddress = THRESHOLD_GATEWAYS[toChainId];
        if (!targetGatewayAddress) {
          throw new Error(
            `No gateway contract found on target chain ${toChainId}`,
          );
        }
        // If the gateway contract on the source chain doesn't exist (e.g. on ethereum),
        // we use the token bridge contract to send a transfer with payload to the gateway contract
        // on the target chain with the recipient address as the payload.
        const tx = await wh.send(
          token,
          transferAmountParsed.toString(),
          sendingChain,
          senderAddress,
          recipientChain,
          targetGatewayAddress,
          undefined,
          formattedRecipient,
        );
        const txId = await signAndSendTransaction(
          fromChainName,
          tx,
          TransferWallet.SENDING,
        );
        return txId;
      }
    } else if (fromChainId === CHAIN_ID_SOLANA) {
      const context = wh.getContext(
        fromChainId,
      ) as SolanaContext<WormholeContext>;
      const connection = context.connection;
      if (!connection) {
        throw new Error('Connection not found');
      }
      const tx = await sendTbtc(
        transferAmountParsed.toString(),
        toChainId,
        formattedRecipient,
        senderAddress,
        isTBTCCanonicalChain(toChainId),
        connection,
      );
      const txId = await signAndSendTransaction(
        fromChainName,
        tx,
        TransferWallet.SENDING,
      );
      return txId;
    } else {
      throw new Error(`Chain ${fromChainName} not supported`);
    }
  }

  async redeem(
    destChain: ChainName | ChainId,
    message: SignedTokenTransferMessage,
    payer: string,
  ): Promise<string> {
    const destChainId = wh.toChainId(destChain);
    const destChainName = wh.toChainName(destChain);
    if (isEvmChain(destChain)) {
      const destGatewayAddress = THRESHOLD_GATEWAYS[destChainId];
      // Use the gateway contract to receive if it exists
      if (destGatewayAddress) {
        const signer = wh.mustGetSigner(destChain);
        const L2WormholeGateway = new Contract(
          destGatewayAddress,
          EVMGateway,
          signer,
        );
        const estimateGas = await L2WormholeGateway.estimateGas.receiveTbtc(
          message.vaa,
        );
        // We increase the gas limit estimation here by a factor of 10% to account for some faulty public JSON-RPC endpoints.
        const gasLimit = estimateGas.mul(1100).div(1000);
        const overrides = {
          gasLimit,
          // We use the legacy tx envelope here to avoid triggering gas price autodetection using EIP1559 for polygon.
          // EIP1559 is not actually implemented in polygon. The node is only API compatible but this breaks some clients
          // like ethers when choosing fees automatically.
          ...(destChain === CHAIN_ID_POLYGON && { type: 0 }),
        };
        const tx = await L2WormholeGateway.receiveTbtc(message.vaa, overrides);
        const receipt = await tx.wait();
        const txId = await signAndSendTransaction(
          destChainName,
          receipt,
          TransferWallet.RECEIVING,
        );
        return txId;
      } else {
        // If the gateway contract doesn't exist, then redeem with the token bridge
        const tx = await wh.redeem(destChain, arrayify(message.vaa), undefined);
        const txId = await signAndSendTransaction(
          destChainName,
          tx,
          TransferWallet.RECEIVING,
        );
        return txId;
      }
    } else if (destChainId === CHAIN_ID_SOLANA) {
      console.log(`vaa: ${message.vaa}`);
      const signedVaa = Buffer.from(
        arrayify(message.vaa, { allowMissingPrefix: true }),
      );
      const context = wh.getContext(
        destChain,
      ) as SolanaContext<WormholeContext>;
      const connection = context.connection;
      if (!connection) {
        throw new Error('Connection not found');
      }
      const core = wh.mustGetContracts(destChain).core;
      if (!core) {
        throw new Error('Core not found');
      }
      await postVaa(connection, core, signedVaa);
      const tx = await receiveTbtc(signedVaa, payer, connection);
      const txId = await signAndSendTransaction(
        destChainName,
        tx,
        TransferWallet.RECEIVING,
      );
      return txId;
    } else {
      throw new Error(`Chain ${destChainName} not supported`);
    }
  }

  public async getPreview(
    token: TokenConfig,
    destToken: TokenConfig,
    amount: number,
    sendingChain: ChainName | ChainId,
    receipientChain: ChainName | ChainId,
    sendingGasEst: string,
    claimingGasEst: string,
    routeOptions?: any,
  ): Promise<TransferDisplayData> {
    const sendingChainName = wh.toChainName(sendingChain);
    const receipientChainName = wh.toChainName(receipientChain);
    const sourceGasToken = CHAINS[sendingChainName]?.gasToken;
    const destinationGasToken = CHAINS[receipientChainName]?.gasToken;
    const sourceGasTokenSymbol = sourceGasToken
      ? getDisplayName(TOKENS[sourceGasToken])
      : '';
    const destinationGasTokenSymbol = destinationGasToken
      ? getDisplayName(TOKENS[destinationGasToken])
      : '';
    return [
      {
        title: 'Amount',
        value: `${amount} ${getDisplayName(destToken)}`,
      },
      {
        title: 'Total fee estimates',
        value:
          sendingGasEst && claimingGasEst
            ? `${sendingGasEst} ${sourceGasTokenSymbol} & ${claimingGasEst} ${destinationGasTokenSymbol}`
            : '',
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : 'Not available',
          },
          {
            title: 'Destination chain gas estimate',
            value: claimingGasEst
              ? `~ ${claimingGasEst} ${destinationGasTokenSymbol}`
              : 'Not available',
          },
        ],
      },
    ];
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
  ): Promise<BigNumber> {
    return BigNumber.from(0);
  }

  async getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const chainId = wh.toChainId(chain);
    if (chainId === CHAIN_ID_ETH || isTBTCCanonicalChain(chainId)) {
      // The gateway contracts mint canonical tBTC
      // Find the canonical tBTC token for the chain
      const addr = TOKENS_ARR.find(
        (t) =>
          t.symbol === TBTC_TOKEN_SYMBOL &&
          t.nativeChain === chain &&
          t.tokenId?.chain === chain,
      )?.tokenId?.address;
      if (!addr) throw new Error(`${TBTC_TOKEN_SYMBOL} not found for ${chain}`);
      return addr;
    } else {
      // If there's no gateway contract then wormhole-wrapped tBTC is canonical
      return await wh.getForeignAsset(token, chain);
    }
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<TBTCMessage> {
    const chainId = wh.toChainId(chain);
    if (isEvmChain(chain)) {
      const provider = wh.mustGetProvider(chain);
      const receipt = await provider.getTransactionReceipt(tx);
      if (!receipt) {
        throw new Error(`No receipt for ${tx} on ${chain}`);
      }
      const vaaInfo = await getUnsignedVaaEvm(chain, receipt);
      if (!vaaInfo) {
        throw new Error(`No VAA found for ${tx} on ${chain}`);
      }
      const context = wh.getContext(chain) as EthContext<WormholeContext>;
      const tokenBridge = context.contracts.mustGetBridge(chain);
      const transfer = vaaInfo.payload.startsWith('0x01')
        ? await tokenBridge.parseTransfer(vaaInfo.payload)
        : await tokenBridge.parseTransferWithPayload(vaaInfo.payload);
      const toChain = wh.toChainName(transfer.toChain);
      const tokenChain = wh.toChainName(transfer.tokenChain);
      const tokenContext = wh.getContext(tokenChain);
      const tokenAddress = await tokenContext.parseAssetAddress(
        hexlify(transfer.tokenAddress),
      );
      const tokenId: TokenId = {
        chain: tokenChain,
        address: tokenAddress,
      };
      const token = getTokenById(tokenId);
      if (!token) {
        throw new Error(`Token ${tokenId} not found`);
      }
      const decimals = getTokenDecimals(wh.toChainId(chain), tokenId);
      const destContext = wh.getContext(toChain);
      const gasFee =
        receipt.gasUsed && receipt.effectiveGasPrice
          ? receipt.gasUsed.mul(receipt.effectiveGasPrice)
          : BigNumber.from(0);
      const recipient = destContext.parseAddress(
        'payload' in transfer ? transfer.payload : transfer.to,
      );
      const message: TBTCMessage = {
        sendTx: tx,
        sender: receipt.from,
        amount: transfer.amount.toString(),
        payloadID: transfer.payloadID,
        recipient,
        toChain,
        fromChain: wh.toChainName(chain),
        tokenAddress,
        tokenChain,
        tokenId,
        sequence: vaaInfo.sequence.toString(),
        emitterAddress: hexlify(formatAddress(chain, tokenBridge.address)),
        block: receipt.blockNumber,
        gasFee: gasFee.toString(),
        tokenKey: token.key,
        tokenDecimals: decimals,
        receivedTokenKey: getNativeVersionOfToken(token.symbol, toChain),
        to: destContext.parseAddress(hexlify(transfer.to)),
        payload: 'payload' in transfer ? transfer.payload : undefined,
      };
      return message;
    } else if (chainId === CHAIN_ID_SOLANA) {
      throw new Error('Solana case not implemented yet');
    } else {
      throw new Error(`Chain ${chain} not supported`);
    }
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

  async getTransferSourceInfo({
    txData,
  }: TransferInfoBaseParams): Promise<TransferDisplayData> {
    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    const { gasToken: sourceGasTokenKey } = CHAINS[txData.fromChain]!;
    const sourceGasToken = TOKENS[sourceGasTokenKey];
    const decimals = getTokenDecimals(
      toChainId(sourceGasToken.nativeChain),
      'native',
    );
    const formattedGas =
      txData.gasFee && toDecimals(txData.gasFee, decimals, MAX_DECIMALS);
    const token = TOKENS[txData.tokenKey];

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${getDisplayName(token)}`,
      },
      {
        title: 'Gas fee',
        value: formattedGas
          ? `${formattedGas} ${getDisplayName(sourceGasToken)}`
          : NO_INPUT,
      },
    ];
  }

  async getTransferDestInfo({
    txData,
    receiveTx,
    gasEstimate,
  }: TransferDestInfoBaseParams): Promise<TransferDisplayData> {
    const token = TOKENS[txData.tokenKey];
    const { gasToken } = CHAINS[txData.toChain]!;

    let gas = gasEstimate;
    if (receiveTx) {
      const gasFee = await wh.getTxGasFee(txData.toChain, receiveTx);
      if (gasFee) {
        gas = formatGasFee(txData.toChain, gasFee);
      }
    }

    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${getDisplayName(token)}`,
      },
      {
        title: receiveTx ? 'Gas fee' : 'Gas estimate',
        value: gas ? `${gas} ${getDisplayName(TOKENS[gasToken])}` : NO_INPUT,
      },
    ];
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedMessage: SignedMessage,
  ): Promise<boolean> {
    if (!isSignedWormholeMessage(signedMessage)) {
      throw new Error('Invalid signed message');
    }
    return wh.isTransferCompleted(destChain, hexlify(signedMessage.vaa));
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

  static async isTxForThisRoute(
    txHash: string,
    chain: ChainName | ChainId,
  ): Promise<boolean> {
    const chainId = wh.toChainId(chain);
    if (isEvmChain(chain)) {
      const provider = wh.mustGetProvider(chain);
      const receipt = await provider.getTransactionReceipt(txHash);
      const vaaInfo = await getUnsignedVaaEvm(chain, receipt);
      const context = wh.getContext(chain) as EthContext<WormholeContext>;
      const tokenBridge = context.contracts.mustGetBridge(chain);
      let transfer;
      try {
        transfer = vaaInfo.payload.startsWith('0x01')
          ? await tokenBridge.parseTransfer(vaaInfo.payload)
          : await tokenBridge.parseTransferWithPayload(vaaInfo.payload);
      } catch {
        return false;
      }
      const tokenChain = wh.toChainName(transfer.tokenChain);
      const tokenContext = wh.getContext(tokenChain);
      const tokenAddress = await tokenContext.parseAssetAddress(
        hexlify(transfer.tokenAddress),
      );
      const tokenId: TokenId = {
        chain: tokenChain,
        address: tokenAddress,
      };
      // This must be a tBTC transfer
      const token = getTokenById(tokenId);
      if (!token || token.symbol !== TBTC_TOKEN_SYMBOL) {
        return false;
      }
      const fromChain = wh.toChainId(chain);
      const toChain = wh.toChainId(transfer.toChain);
      // This must be a transfer to or from a tBTC gateway chain
      return isTBTCCanonicalChain(fromChain) || isTBTCCanonicalChain(toChain);
    } else if (chainId === CHAIN_ID_SOLANA) {
      const context = wh.getContext(chain) as SolanaContext<WormholeContext>;
      const connection = context.connection;
      if (!connection) {
        throw new Error('Connection not found');
      }
      const response = await connection.getParsedTransaction(txHash);
      if (!response) {
        return false;
      }
      console.log(JSON.stringify(response, null, 2));
      // TODO: implement
      return false;
    } else {
      throw new Error('Not implemented');
    }
  }
}
