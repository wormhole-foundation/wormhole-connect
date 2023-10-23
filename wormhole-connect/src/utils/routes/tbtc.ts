import { BigNumber, ContractReceipt, Contract } from 'ethers';
import {
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';

import { CHAINS, ROUTES, TOKENS, isMainnet } from 'config';
import { TokenConfig, Route } from 'config/types';
import {
  MAX_DECIMALS,
  getTokenDecimals,
  toNormalizedDecimals,
  getDisplayName,
} from 'utils';
import { isEvmChain, toChainId, wh } from 'utils/sdk';
//import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
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
} from './types';
import { BaseRoute } from './baseRoute';
import { toDecimals } from '../balance';
import { formatGasFee } from './utils';
import {
  CHAIN_ID_POLYGON,
  CHAIN_ID_OPTIMISM,
  CHAIN_ID_ARBITRUM,
  CHAIN_ID_BASE,
  CHAIN_ID_SOLANA,
  CHAIN_ID_ETH,
  hexToUint8Array,
} from '@certusone/wormhole-sdk';
import { ThresholdL2WormholeGateway } from 'utils/ThresholdL2WormholeGateway';
import { adaptParsedMessage } from './common';
import { fetchVaa } from 'utils/vaa';
import { hexlify, hexZeroPad, parseUnits } from 'ethers/lib/utils.js';

export const THRESHOLD_ARBITER_FEE = 0;
export const THRESHOLD_NONCE = 0;

export const TBTCTokenSymbol = 'tBTC';
export const TBTC_CHAINS: ChainName[] = [
  'ethereum',
  'goerli',
  'optimism',
  'arbitrum',
  'base',
  'polygon',
  'optimismgoerli',
  'arbitrumgoerli',
  'basegoerli',
  'mumbai',
];

const THRESHOLD_GATEWAYS_MAINNET: any = {
  [CHAIN_ID_POLYGON]: '0x09959798B95d00a3183d20FaC298E4594E599eab',
  [CHAIN_ID_OPTIMISM]: '0x1293a54e160D1cd7075487898d65266081A15458',
  [CHAIN_ID_ARBITRUM]: '0x1293a54e160D1cd7075487898d65266081A15458',
  [CHAIN_ID_BASE]: '0x09959798B95d00a3183d20FaC298E4594E599eab',
  [CHAIN_ID_SOLANA]: '87MEvHZCXE3ML5rrmh5uX1FbShHmRXXS32xJDGbQ7h5t', // Solana TBTC Gateway Program
} as const;

const THRESHOLD_GATEWAYS_TESTNET: any = {
  [CHAIN_ID_POLYGON]: '0x91fe7128f74dbd4f031ea3d90fc5ea4dcfd81818',
  [CHAIN_ID_OPTIMISM]: '0x6449F4381f3d63bDfb36B3bDc375724aD3cD4621',
  [CHAIN_ID_ARBITRUM]: '0x31A15e213B59E230b45e8c5c99dAFAc3d1236Ee2',
  [CHAIN_ID_BASE]: '0xe3e0511EEbD87F08FbaE4486419cb5dFB06e1343',
  [CHAIN_ID_SOLANA]: '87MEvHZCXE3ML5rrmh5uX1FbShHmRXXS32xJDGbQ7h5t', // Solana TBTC Gateway Program
} as const;

const THRESHOLD_GATEWAYS = isMainnet
  ? THRESHOLD_GATEWAYS_MAINNET
  : THRESHOLD_GATEWAYS_TESTNET;

const THRESHOLD_TBTC_CONTRACTS_MAINNET: any = {
  [CHAIN_ID_ETH]: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
  [CHAIN_ID_POLYGON]: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b',
  [CHAIN_ID_OPTIMISM]: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
  [CHAIN_ID_ARBITRUM]: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
  [CHAIN_ID_BASE]: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b',
  [CHAIN_ID_SOLANA]: '6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU', // Solana TBTC Mint
} as const;

const THRESHOLD_TBTC_CONTRACTS_TESTNET: any = {
  [CHAIN_ID_ETH]: '0x679874fBE6D4E7Cc54A59e315FF1eB266686a937',
  [CHAIN_ID_POLYGON]: '0xBcD7917282E529BAA6f232DdDc75F3901245A492',
  [CHAIN_ID_OPTIMISM]: '0x1a53759DE2eADf73bd0b05c07a4F1F5B7912dA3d',
  [CHAIN_ID_ARBITRUM]: '0x85727F4725A4B2834e00Db1AA8e1b843a188162F',
  [CHAIN_ID_BASE]: '0x783349cd20f26CE12e747b1a17bC38D252c9e119',
  [CHAIN_ID_SOLANA]: '6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU', // Solana TBTC Mint
} as const;
const THRESHOLD_TBTC_CONTRACTS = isMainnet
  ? THRESHOLD_TBTC_CONTRACTS_MAINNET
  : THRESHOLD_TBTC_CONTRACTS_TESTNET;

export const TBTC_ASSET_ADDRESS = THRESHOLD_TBTC_CONTRACTS[CHAIN_ID_ETH].slice(
  2,
).padStart(64, '0');

// Threshold normalize amounts
function normalizeAmount(amount: BigNumber, decimals: number): BigNumber {
  if (decimals > 8) {
    amount = amount.div(BigNumber.from(10).pow(decimals - 8));
  }
  return amount;
}

function deNormalizeAmount(amount: BigNumber, decimals: number): BigNumber {
  if (decimals > 8) {
    amount = amount.mul(BigNumber.from(10).pow(decimals - 8));
  }
  return amount;
}

export class TBTCRoute extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;

  isSupportedChain(chain: ChainName): boolean {
    return !!THRESHOLD_TBTC_CONTRACTS[wh.toChainId(chain)];
  }

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (!ROUTES.includes(Route.TBTC)) {
      return false;
    }

    const sourceTokenConfig = TOKENS[sourceToken];
    const destTokenConfig = TOKENS[destToken];

    if (!sourceChain || !destChain || !sourceTokenConfig || !destTokenConfig)
      return false;
    /*
     * if THRESHOLD_GATEWAYS[chainId] has something
     * we have a gateway contract on the target chain to use
     */
    const isCanonicalTarget = !!THRESHOLD_GATEWAYS[sourceChain];
    if (isCanonicalTarget) return false;

    const sourceChainName = wh.toChainName(sourceChain);
    const destChainName = wh.toChainName(destChain);
    if (sourceTokenConfig.symbol !== TBTCTokenSymbol) return false;
    if (destTokenConfig.symbol !== TBTCTokenSymbol) return false;
    if (sourceTokenConfig.nativeChain !== sourceChainName) return false;
    if (destTokenConfig.nativeChain !== destChainName) return false;

    return (
      TBTC_CHAINS.includes(sourceChainName) &&
      TBTC_CHAINS.includes(destChainName)
    );
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
  // preguntar el fee estimado en tbtc
  async estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions?: any,
  ): Promise<BigNumber> {
    return await wh.estimateSendGas(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
    );
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  /**
   * These operations have to be implemented in subclasses.
   */
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
    try {
      // only works on EVM chains
      if (isEvmChain(sendingChain)) {
        const fromChainId = wh.toChainId(sendingChain);
        const toChainId = wh.toChainId(recipientChain);
        const decimals = getTokenDecimals(fromChainId, token);
        const baseAmountParsed = parseUnits(amount, decimals);
        const feeParsed = parseUnits(
          /*(await this.getRelayerFee(recipientChain, sendingChain, typeof token === "string" ? token : token.chain)).toString() ||*/ '0',
          decimals,
        );
        const transferAmountParsed = baseAmountParsed.add(feeParsed);

        let receipt: ContractReceipt;
        const sourceAddress = THRESHOLD_GATEWAYS[fromChainId].toLowerCase();
        console.log(
          sourceAddress,
          ThresholdL2WormholeGateway,
          wh.getSigner(sendingChain)!,
        );
        const L2WormholeGateway = new Contract(
          sourceAddress,
          ThresholdL2WormholeGateway,
          wh.getSigner(sendingChain)!,
        );

        const amountNormalizeAmount = deNormalizeAmount(
          normalizeAmount(transferAmountParsed, decimals),
          decimals,
        );
        //error Error sending: Error: invalid BigNumber string (argument="value", value="mumbai", code=INVALID_ARGUMENT, version=bignumber/5.7.0)

        const emitterAddress = hexZeroPad(
          recipientAddress,
          32,
        ); /*.substring(2)*/
        const address = hexToUint8Array(emitterAddress);
        const estimateGas = await L2WormholeGateway.estimateGas.sendTbtc(
          amountNormalizeAmount,
          toChainId,
          address,
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
          amountNormalizeAmount,
          recipientChain,
          recipientAddress,
          THRESHOLD_ARBITER_FEE,
          THRESHOLD_NONCE,
          overrides,
        );

        receipt = await tx.wait();
        return receipt.transactionHash;
      } else {
        //solana case
        throw new Error(`Not implemented yet`);
      }
    } catch (e) {
      throw new Error(`Error sending: ${e}`);
    }
  }

  async redeem(
    destChain: ChainName | ChainId,
    message: SignedMessage, // vaa?
    payer: string,
  ): Promise<string> {
    let receipt;
    const targetAddress = THRESHOLD_GATEWAYS[destChain];
    const L2WormholeGateway = new Contract(
      targetAddress,
      ThresholdL2WormholeGateway,
      wh.getSigner(destChain)!,
    );

    const estimateGas = await L2WormholeGateway.estimateGas.receiveTbtc(
      message,
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

    const tx = await L2WormholeGateway.receiveTbtc(message, overrides);
    receipt = await tx.wait();
    return receipt.transactionHash;
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
    const asset = await wh.getForeignAsset(token, chain);
    console.log('getForeignAsset', asset, token, chain);
    return asset;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedMessage> {
    const message = await wh.getMessage(tx, chain);
    return adaptParsedMessage(message);
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
}
