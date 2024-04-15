import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import {
  PublicKeyInitData,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
} from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import { NttQuoter as NttQuoterType, IDL } from './types/ntt_quoter';
import { solanaContext, toChainId } from 'utils/sdk';

//constants that must match ntt-quoter lib.rs / implementation:
const USD_UNIT = 1e6;
const WEI_PER_GWEI = 1e9;
const GWEI_PER_ETH = 1e9;
const SEED_PREFIX_INSTANCE = 'instance';
const SEED_PREFIX_REGISTERED_CHAIN = 'registered_chain';
const SEED_PREFIX_REGISTERED_NTT = 'registered_ntt';
const SEED_PREFIX_RELAY_REQUEST = 'relay_request';

const U64 = {
  MAX: new BN((2n ** 64n - 1n).toString()),
  to: (amount: number, unit: number) => {
    const ret = new BN(Math.round(amount * unit));

    if (ret.isNeg()) throw new Error('Value negative');

    if (ret.bitLength() > 64) throw new Error('Value too large');

    return ret;
  },
  from: (amount: BN, unit: number) => amount.toNumber() / unit,
};

export class NttQuoter {
  readonly connection: Connection;
  readonly program: Program<NttQuoterType>;
  readonly instance: PublicKey;

  constructor(programId: PublicKeyInitData) {
    const { connection } = solanaContext();
    if (!connection) throw new Error('Connection not found');
    this.connection = connection;
    this.program = new Program<NttQuoterType>(IDL, new PublicKey(programId), {
      connection,
    });
    this.instance = this.derivePda(Buffer.from(SEED_PREFIX_INSTANCE));
  }

  async isRelayEnabled(destChain: ChainName | ChainId) {
    try {
      const { paused } = await this.getRegisteredChain(destChain);
      return !paused;
    } catch (e: any) {
      if (e.message?.includes('Account does not exist')) {
        return false;
      }
      throw e;
    }
  }

  // calculates the relay cost in lamports
  async calcRelayCost(
    chain: ChainName | ChainId,
    nttProgramId: string,
    requestedGasDropoffEth = 0,
  ) {
    const [chainData, nttData, instanceData, rentCost] = await Promise.all([
      this.getRegisteredChain(chain),
      this.getRegisteredNtt(new PublicKey(nttProgramId)),
      this.getInstance(),
      this.program.provider.connection.getMinimumBalanceForRentExemption(
        this.program.account.relayRequest.size,
      ),
    ]);

    if (chainData.nativePriceUsd === 0) throw new Error('Native price is 0');
    if (instanceData.solPriceUsd === 0) throw new Error('SOL price is 0');
    if (requestedGasDropoffEth > chainData.maxGasDropoffEth)
      throw new Error('Requested gas dropoff exceeds allowed maximum');

    const totalNativeGasCostUsd =
      chainData.nativePriceUsd *
      (requestedGasDropoffEth +
        (chainData.gasPriceGwei * nttData.gasCost) / GWEI_PER_ETH);

    const totalCostSol =
      rentCost / LAMPORTS_PER_SOL +
      (chainData.basePriceUsd + totalNativeGasCostUsd) /
        instanceData.solPriceUsd;

    // Add 5% to account for possible price updates while the tx is in flight
    const cost = U64.to(totalCostSol * 1.05, LAMPORTS_PER_SOL);
    return cost;
  }

  async createRequestRelayInstruction(
    payer: PublicKey,
    outboxItem: PublicKey,
    chain: ChainName | ChainId,
    maxFee: BN,
    nttProgramId: string,
  ) {
    return this.program.methods
      .requestRelay({
        maxFee,
        gasDropoff: new BN(0),
      })
      .accounts({
        payer,
        instance: this.instance,
        registeredChain: this.registeredChainPda(toChainId(chain)),
        registeredNtt: this.registeredNttPda(new PublicKey(nttProgramId)),
        outboxItem,
        relayRequest: this.relayRequestPda(outboxItem),
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async getInstance() {
    const data = await this.program.account.instance.fetch(this.instance);
    return {
      owner: data.owner,
      assistant: data.assistant,
      feeRecipient: data.feeRecipient,
      solPriceUsd: U64.from(data.solPrice, USD_UNIT),
    };
  }

  async getRegisteredNtt(nttProgramId: PublicKey) {
    const data = await this.program.account.registeredNtt.fetch(
      this.registeredNttPda(nttProgramId),
    );

    return {
      gasCost: data.gasCost,
      wormholeTransceiverIndex: data.wormholeTransceiverIndex,
    };
  }

  async getRegisteredChain(chain: ChainName | ChainId) {
    const data = await this.program.account.registeredChain.fetch(
      this.registeredChainPda(toChainId(chain)),
    );

    return {
      paused: data.basePrice.eq(U64.MAX),
      maxGasDropoffEth: U64.from(data.maxGasDropoff, GWEI_PER_ETH),
      basePriceUsd: U64.from(data.basePrice, USD_UNIT),
      nativePriceUsd: U64.from(data.nativePrice, USD_UNIT),
      gasPriceGwei: U64.from(data.gasPrice, WEI_PER_GWEI),
    };
  }

  private registeredChainPda(chainId: number) {
    return this.derivePda([
      Buffer.from(SEED_PREFIX_REGISTERED_CHAIN),
      new BN(chainId).toBuffer('be', 2),
    ]);
  }

  private registeredNttPda(nttProgramId: PublicKey) {
    return this.derivePda([
      Buffer.from(SEED_PREFIX_REGISTERED_NTT),
      nttProgramId.toBytes(),
    ]);
  }

  private relayRequestPda(outboxItem: PublicKey) {
    return this.derivePda([
      Buffer.from(SEED_PREFIX_RELAY_REQUEST),
      outboxItem.toBytes(),
    ]);
  }

  private derivePda(seeds: Buffer | Array<Uint8Array | Buffer>): PublicKey {
    const seedsArray = seeds instanceof Buffer ? [seeds] : seeds;
    const [address] = PublicKey.findProgramAddressSync(
      seedsArray,
      this.program.programId,
    );
    return address;
  }
}
