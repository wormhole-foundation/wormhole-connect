import type { Route } from '@lifi/sdk';
import { getStepTransaction } from '@lifi/sdk';
import type { TokenId, Network } from '@wormhole-foundation/sdk-connect';
import {
  isNative,
  amount as sdkAmount,
} from '@wormhole-foundation/sdk-connect';
import type { EvmChains } from '@wormhole-foundation/sdk-evm';
import {
  EvmPlatform,
  EvmUnsignedTransaction,
} from '@wormhole-foundation/sdk-evm';
import { ethers } from 'ethers';
import type { PlatformContext } from '../types';
import { executeTransaction } from '../utils';

export function generateThrowawayAddress(): string {
  return ethers.Wallet.createRandom().address;
}

export async function executeEvmSteps<N extends Network>(
  route: Route,
  context: PlatformContext<N>,
  quote: any,
  nativeChainId: bigint,
  toLifiTokenAddress: (tokenId: TokenId) => string,
): Promise<void> {
  const { request, signer, rpc, txs } = context;

  // Handle token approvals if needed
  if (!isNative(request.source.id.address)) {
    const tokenContract = EvmPlatform.getTokenImplementation(
      rpc,
      toLifiTokenAddress(request.source.id),
    );

    const firstStep = route.steps[0];
    const approvalAddress = firstStep?.estimate?.approvalAddress;

    if (approvalAddress) {
      const allowance = await tokenContract.allowance(
        signer.address(),
        approvalAddress,
      );

      const amt = sdkAmount.units(quote.sourceToken.amount);
      if (allowance < amt) {
        const txReq = await tokenContract.approve.populateTransaction(
          approvalAddress,
          amt,
        );

        const approvalTxReq = new EvmUnsignedTransaction(
          {
            from: signer.address(),
            chainId: nativeChainId as bigint,
            ...txReq,
          },
          request.fromChain.network,
          request.fromChain.chain as EvmChains,
          'Approve Allowance',
        );

        await executeTransaction(
          approvalTxReq,
          signer,
          rpc,
          request.fromChain.chain,
          EvmPlatform,
          txs,
        );
      }
    }
  }

  for (const step of route.steps) {
    const populatedStep = await getStepTransaction(step);
    const txData = populatedStep.transactionRequest;

    if (!txData) {
      throw new Error(`No transaction data in LiFi step: ${step.tool}`);
    }

    const txReq = new EvmUnsignedTransaction(
      {
        from: signer.address(),
        chainId: nativeChainId,
        to: txData.to,
        data: txData.data,
        value: txData.value || '0x0',
        gasLimit: txData.gasLimit,
        gasPrice: txData.gasPrice,
      },
      request.fromChain.network,
      request.fromChain.chain as EvmChains,
      `LiFi Step: ${step.tool}`,
    );

    await executeTransaction(
      txReq,
      signer,
      rpc,
      request.fromChain.chain,
      EvmPlatform,
      txs,
    );
  }
}
