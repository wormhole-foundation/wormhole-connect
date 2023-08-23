import { getTotalGasUsed } from '@mysten/sui.js';
import {
  AptosContext,
  ChainName,
  SuiContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Types } from 'aptos';
import { BigNumber } from 'ethers';
import { CHAINS, GAS_ESTIMATES, TOKENS } from '../config';
import { MAX_DECIMALS, getTokenDecimals } from './index';
import { toDecimals } from './balance';
import { estimateClaimGasFees } from './gasEstimates';
import { toChainId, wh } from './sdk';

/**
 * Retrieve the gas used for the execution of a redeem transaction
 * Falls back to gas estimations if the transaction id is not provided
 *
 * @param chain The transaction's chain
 * @param receiveTx The transaction's id
 * @returns
 */
export const calculateGas = async (chain: ChainName, receiveTx?: string) => {
  const { gasToken } = CHAINS[chain]!;
  const token = TOKENS[gasToken];
  const decimals = getTokenDecimals(toChainId(chain), token.tokenId);

  if (chain === 'solana') {
    return toDecimals(
      BigNumber.from(GAS_ESTIMATES.solana!.claim),
      decimals,
      MAX_DECIMALS,
    );
  }
  if (receiveTx) {
    if (chain === 'aptos') {
      const aptosClient = (
        wh.getContext('aptos') as AptosContext<WormholeContext>
      ).aptosClient;
      const txn = await aptosClient.getTransactionByHash(receiveTx);
      if (txn.type === 'user_transaction') {
        const userTxn = txn as Types.UserTransaction;
        const gasFee = BigNumber.from(userTxn.gas_used).mul(
          userTxn.gas_unit_price,
        );
        return toDecimals(gasFee || 0, decimals, MAX_DECIMALS);
      }
    } else if (chain === 'sui') {
      const provider = (wh.getContext('sui') as SuiContext<WormholeContext>)
        .provider;
      const txBlock = await provider.getTransactionBlock({
        digest: receiveTx,
        options: { showEvents: true, showEffects: true, showInput: true },
      });
      const gasFee = BigNumber.from(getTotalGasUsed(txBlock) || 0);
      return toDecimals(gasFee, decimals, MAX_DECIMALS);
    } else {
      const provider = wh.mustGetProvider(chain);
      const receipt = await provider.getTransactionReceipt(receiveTx);
      const { gasUsed, effectiveGasPrice } = receipt;
      if (!gasUsed || !effectiveGasPrice) return;
      const gasFee = gasUsed.mul(effectiveGasPrice);
      return toDecimals(gasFee, decimals, MAX_DECIMALS);
    }
  }
  return await estimateClaimGasFees(chain);
};
