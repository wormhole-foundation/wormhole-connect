import {
  Implementation__factory,
  TokenImplementation__factory,
} from '@certusone/wormhole-sdk/lib/esm/ethers-contracts';
import { createNonce, keccak256 } from '@certusone/wormhole-sdk';
import {
  BigNumber,
  BigNumberish,
  constants,
  ContractReceipt,
  ethers,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
} from 'ethers';
import { utils } from 'ethers';

import {
  TokenId,
  ChainName,
  ChainId,
  NATIVE,
  ParsedRelayerMessage,
  ParsedMessage,
  Context,
  ParsedRelayerPayload,
} from '../../types';
import { WormholeContext } from '../../wormhole';
import { EthContracts } from './contracts';
import { parseVaa } from '../../vaa';
import { RelayerAbstract } from '../abstracts/relayer';
import { arrayify } from 'ethers/lib/utils';
import { TokenNotSupportedForRelayError } from '../../errors';

export const NO_VAA_FOUND = 'No message publish found in logs';
export const INSUFFICIENT_ALLOWANCE = 'Insufficient token allowance';

const ADDR_BYTE_LEN = 20;

export class EthContext<
  T extends WormholeContext,
> extends RelayerAbstract<ethers.ContractReceipt> {
  readonly type = Context.ETH;
  readonly contracts: EthContracts<T>;
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
    this.contracts = new EthContracts(context);
  }

  /**
   * Approves amount for bridge transfer. If no amount is specified, the max amount is approved
   *
   * @param token The tokenId (chain and address) of the token being sent
   * @param Amount The amount to approve. If absent, will approve the maximum amount
   * @throws If unable to get the signer or contracts
   */
  async approve(
    chain: ChainName | ChainId,
    contractAddress: string,
    token: string,
    amount?: BigNumberish,
    overrides: PayableOverrides & { from?: string | Promise<string> } = {},
  ): Promise<ethers.ContractReceipt | void> {
    const signer = this.context.getSigner(chain);
    if (!signer) throw new Error(`No signer for ${chain}`);
    const senderAddress = await signer.getAddress();
    const tokenImplementation = TokenImplementation__factory.connect(
      token,
      signer,
    );
    if (!tokenImplementation)
      throw new Error(`token contract not available for ${token}`);

    const approved = await tokenImplementation.allowance(
      senderAddress,
      contractAddress,
    );
    const approveAmount = amount || constants.MaxUint256;
    // Approve if necessary
    if (approved.lt(approveAmount)) {
      const tx = await tokenImplementation.approve(
        contractAddress,
        approveAmount,
        overrides,
      );
      await tx.wait();
      // Metamask allows users to set a different amount than specified above
      // Check to make sure that the amount set was at least the requested amount
      const nowApproved = await tokenImplementation.allowance(
        senderAddress,
        contractAddress,
      );
      if (nowApproved.lt(approveAmount)) {
        throw new Error(INSUFFICIENT_ALLOWANCE);
      }
    }
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean> {
    const tokenBridge = this.contracts.mustGetBridge(destChain);
    const doubleHash = keccak256(
      parseVaa(utils.arrayify(signedVaa, { allowMissingPrefix: true })).hash,
    );
    return await tokenBridge.isTransferCompleted(doubleHash);
  }

  formatAddress(address: string): Uint8Array {
    return Buffer.from(utils.zeroPad(address, 32));
  }

  parseAddress(address: ethers.utils.BytesLike): string {
    const trimmed = utils.zeroPad(utils.stripZeros(address), ADDR_BYTE_LEN);
    const parsed = utils.hexlify(trimmed);
    return utils.getAddress(parsed);
  }

  async formatAssetAddress(address: string): Promise<Uint8Array> {
    return this.formatAddress(address);
  }

  async parseAssetAddress(address: string): Promise<string> {
    return this.parseAddress(address);
  }

  async getCurrentBlock(chain: ChainName | ChainId): Promise<number> {
    const provider = this.context.mustGetProvider(chain);
    return await provider.getBlockNumber();
  }

  async getWrappedNativeTokenId(chain: ChainName | ChainId): Promise<TokenId> {
    const bridge = this.contracts.mustGetBridge(chain);
    return {
      address: await bridge.WETH(),
      chain: this.context.toChainName(chain),
    };
  }
}
