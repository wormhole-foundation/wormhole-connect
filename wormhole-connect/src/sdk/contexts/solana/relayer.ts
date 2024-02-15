import { Connection, PublicKey, PublicKeyInitData } from '@solana/web3.js';
import { TokenBridgeRelayer } from './utils/types/tokenBridgeRelayer';
import { createTokenBridgeRelayerProgramInterface } from './utils/tokenBridgeRelayer';
import { BN, Program } from '@project-serum/anchor';
import { ChainId } from 'sdk/types';
import { NATIVE_MINT } from '@solana/spl-token';
import {
  RegisteredToken,
  deriveRegisteredTokenAddress,
  RedeemerConfig,
  deriveRedeemerConfigAddress,
  ForeignContract,
  deriveForeignContractAddress,
} from './utils/tokenBridgeRelayer/accounts';

const SOL_DECIMALS = 9;
const TEN = new BN(10);
const SWAP_RATE_PRECISION = new BN(100_000_000);

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
      await this.getRegisteredToken(new PublicKey(mint));
      return true;
    } catch (e: any) {
      if (e.message?.includes('Account does not exist')) {
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
    const [{ fee }, { swapRate }, { relayerFeePrecision }] = await Promise.all([
      this.getForeignContract(targetChain),
      this.getRegisteredToken(mint),
      this.getRedeemerConfig(),
    ]);
    const relayerFee = TEN.pow(new BN(decimals))
      .mul(fee)
      .mul(SWAP_RATE_PRECISION)
      .div(new BN(relayerFeePrecision).mul(swapRate));

    return BigInt(relayerFee.toString());
  }

  async calculateMaxSwapAmountIn(
    mint: PublicKey,
    decimals: number,
  ): Promise<bigint> {
    const [{ swapRate, maxNativeSwapAmount }, { swapRate: solSwapRate }] =
      await Promise.all([
        this.getRegisteredToken(mint),
        this.getRegisteredToken(NATIVE_MINT),
      ]);
    const nativeSwapRate = this.calculateNativeSwapRate(solSwapRate, swapRate);
    const maxSwapAmountIn =
      decimals > SOL_DECIMALS
        ? maxNativeSwapAmount
            .mul(nativeSwapRate)
            .mul(TEN.pow(new BN(decimals - SOL_DECIMALS)))
            .div(SWAP_RATE_PRECISION)
        : maxNativeSwapAmount
            .mul(nativeSwapRate)
            .div(
              TEN.pow(new BN(SOL_DECIMALS - decimals)).mul(SWAP_RATE_PRECISION),
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
    const [{ swapRate }, { swapRate: solSwapRate }] = await Promise.all([
      this.getRegisteredToken(mint),
      this.getRegisteredToken(NATIVE_MINT),
    ]);
    const nativeSwapRate = this.calculateNativeSwapRate(solSwapRate, swapRate);
    const swapAmountOut =
      decimals > SOL_DECIMALS
        ? SWAP_RATE_PRECISION.mul(new BN(toNativeAmount.toString())).div(
            nativeSwapRate.mul(TEN.pow(new BN(decimals - SOL_DECIMALS))),
          )
        : SWAP_RATE_PRECISION.mul(new BN(toNativeAmount.toString()))
            .mul(TEN.pow(new BN(SOL_DECIMALS - decimals)))
            .div(nativeSwapRate);

    return BigInt(swapAmountOut.toString());
  }

  async fetchSwapEvent(signature: string): Promise<SwapEvent | null> {
    const transaction = await this.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
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

  private calculateNativeSwapRate(solSwapRate: BN, swapRate: BN): BN {
    return SWAP_RATE_PRECISION.mul(solSwapRate).div(swapRate);
  }

  private async getForeignContract(chain: ChainId): Promise<ForeignContract> {
    return await this.program.account.foreignContract.fetch(
      deriveForeignContractAddress(this.program.programId, chain),
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
