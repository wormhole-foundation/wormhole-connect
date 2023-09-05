import { Connection, PublicKey, PublicKeyInitData } from '@solana/web3.js';
import { TokenBridgeRelayer } from './utils/types/tokenBridgeRelayer';
import { createTokenBridgeRelayerProgramInterface } from './utils/tokenBridgeRelayer';
import { BN, Program } from '@project-serum/anchor';
import { ChainId } from 'types';
import { NATIVE_MINT } from '@solana/spl-token';
import {
  RelayerFee,
  deriveRelayerFeeAddress,
  RegisteredToken,
  deriveRegisteredTokenAddress,
  RedeemerConfig,
  deriveRedeemerConfigAddress,
} from './utils/tokenBridgeRelayer/accounts';

const SOL_DECIMALS = 9;
const TEN = new BN(10);

export interface SwapEvent {
  recipient: string;
  relayer: string;
  token: string;
  tokenAmount: string;
  nativeAmount: string;
}

export class SolanaRelayer {
  private program: Program<TokenBridgeRelayer>;

  constructor(programId: PublicKeyInitData, private connection: Connection) {
    this.program = createTokenBridgeRelayerProgramInterface(
      programId,
      connection,
    );
  }

  async isAcceptedToken(mint: string): Promise<boolean> {
    try {
      const { isRegistered } = await this.getRegisteredToken(
        new PublicKey(mint),
      );
      return isRegistered;
    } catch (e) {
      if (e instanceof Error && e.message?.includes('Account does not exist')) {
        // the token is not registered
        return false;
      }
      throw e;
    }
  }

  async calculateRelayerFee(
    targetChain: ChainId,
    mint: PublicKey,
    decimals: number,
  ): Promise<bigint> {
    const [{ fee }, { swapRate }, { relayerFeePrecision, swapRatePrecision }] =
      await Promise.all([
        this.getRelayerFee(targetChain),
        this.getRegisteredToken(mint),
        this.getRedeemerConfig(),
      ]);
    const relayerFee = TEN.pow(new BN(decimals))
      .mul(fee)
      .mul(new BN(swapRatePrecision))
      .div(new BN(relayerFeePrecision).mul(swapRate));

    return BigInt(relayerFee.toString());
  }

  async calculateMaxSwapAmountIn(
    mint: PublicKey,
    decimals: number,
  ): Promise<bigint> {
    const [
      { swapRate, maxNativeSwapAmount },
      { swapRate: solSwapRate },
      { swapRatePrecision },
    ] = await Promise.all([
      this.getRegisteredToken(mint),
      this.getRegisteredToken(NATIVE_MINT),
      this.getRedeemerConfig(),
    ]);
    const swapRatePrecisionBN = new BN(swapRatePrecision);
    const nativeSwapRate = this.calculateNativeSwapRate(
      swapRatePrecisionBN,
      solSwapRate,
      swapRate,
    );
    const maxSwapAmountIn =
      decimals > SOL_DECIMALS
        ? maxNativeSwapAmount
            .mul(nativeSwapRate)
            .mul(TEN.pow(new BN(decimals - SOL_DECIMALS)))
            .div(swapRatePrecisionBN)
        : maxNativeSwapAmount
            .mul(nativeSwapRate)
            .div(
              TEN.pow(new BN(SOL_DECIMALS - decimals)).mul(swapRatePrecisionBN),
            );

    return BigInt(maxSwapAmountIn.toString());
  }

  async calculateNativeSwapAmountOut(
    mint: PublicKey,
    toNativeAmount: bigint,
    decimals: number,
  ): Promise<bigint> {
    if (toNativeAmount === 0n) {
      return 0n;
    }
    const [{ swapRate }, { swapRate: solSwapRate }, { swapRatePrecision }] =
      await Promise.all([
        this.getRegisteredToken(mint),
        this.getRegisteredToken(NATIVE_MINT),
        this.getRedeemerConfig(),
      ]);
    const swapRatePrecisionBN = new BN(swapRatePrecision);
    const nativeSwapRate = this.calculateNativeSwapRate(
      swapRatePrecisionBN,
      solSwapRate,
      swapRate,
    );
    const swapAmountOut =
      decimals > SOL_DECIMALS
        ? swapRatePrecisionBN
            .mul(new BN(toNativeAmount.toString()))
            .div(nativeSwapRate.mul(TEN.pow(new BN(decimals - SOL_DECIMALS))))
        : swapRatePrecisionBN
            .mul(new BN(toNativeAmount.toString()))
            .mul(TEN.pow(new BN(SOL_DECIMALS - decimals)))
            .div(nativeSwapRate);

    return BigInt(swapAmountOut.toString());
  }

  async fetchSwapEvent(signature: string): Promise<SwapEvent | null> {
    const transaction = await this.connection.getParsedTransaction(signature);
    if (transaction) {
      const logMessages = transaction.meta?.logMessages || [];
      for (const msg of logMessages) {
        const matches =
          /Swap executed successfully, recipient: (\w+), relayer: (\w+), token: (\w+), tokenAmount: (\w+), nativeAmount: (\w+)/.exec(
            msg,
          );
        if (matches) {
          return {
            recipient: matches[1],
            relayer: matches[2],
            token: matches[3],
            tokenAmount: matches[4],
            nativeAmount: matches[5],
          };
        }
      }
    }
    return null;
  }

  private calculateNativeSwapRate(
    swapRatePrecision: BN,
    solSwapRate: BN,
    swapRate: BN,
  ): BN {
    return swapRatePrecision.mul(solSwapRate).div(swapRate);
  }

  private async getRelayerFee(chain: ChainId): Promise<RelayerFee> {
    return await this.program.account.relayerFee.fetch(
      deriveRelayerFeeAddress(this.program.programId, chain),
    );
  }

  private async getRegisteredToken(mint: PublicKey): Promise<RegisteredToken> {
    return await this.program.account.registeredToken.fetch(
      deriveRegisteredTokenAddress(this.program.programId, mint),
    );
  }

  private async getRedeemerConfig(): Promise<RedeemerConfig> {
    return await this.program.account.redeemerConfig.fetch(
      deriveRedeemerConfigAddress(this.program.programId),
    );
  }
}
