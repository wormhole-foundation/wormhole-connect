import type { Chain, Network, Signer } from '@wormhole-foundation/sdk-connect';
import { routes } from '@wormhole-foundation/sdk-connect';
import type {
  PermitDomain,
  PermitValue,
  PermitTypes,
} from '@mayanfinance/swap-sdk';
import { getHyperCoreUSDCDepositPermitParams } from '@mayanfinance/swap-sdk';
import { isEvmNativeSigner } from '@wormhole-foundation/sdk-evm';
import type {
  Quote,
  TransferParams,
  ValidationResult,
} from '../routes/mayan/types';

export type HyperCoreValidators = {
  isEvmChain: (chain: Chain) => boolean;
  isCanonicalUSDCToken: (chain: Chain, tokenAddress: string) => boolean;
};

export function isHyperCoreChain(chain: Chain): boolean {
  return chain === 'HyperCore';
}

/**
 * Enforces HyperCore routing rules: only EVM -> HyperCore flows with USDC
 * inbound, and disallow HyperCore-originated USDC.
 */
export function validateHyperCoreTransfer<N extends Network>(
  request: routes.RouteTransferRequest<N>,
  params: TransferParams,
  validators: HyperCoreValidators,
): ValidationResult | null {
  const { fromChain, toChain, source, destination } = request;
  const { isEvmChain, isCanonicalUSDCToken } = validators;

  if (isHyperCoreChain(toChain.chain)) {
    if (!isEvmChain(fromChain.chain)) {
      return {
        valid: false,
        params,
        error: new routes.UnavailableError(
          new Error('HyperCore only supports EVM source chains'),
        ),
      };
    }

    const isDestUSDC = isCanonicalUSDCToken(
      toChain.chain,
      destination.id.address.toString(),
    );

    if (!isDestUSDC) {
      return {
        valid: false,
        params,
        error: new routes.UnavailableError(
          new Error('HyperCore only supports USDC as destination token'),
        ),
      };
    }
  }

  if (isHyperCoreChain(fromChain.chain)) {
    const isSourceUSDC = isCanonicalUSDCToken(
      fromChain.chain,
      source.id.address.toString(),
    );

    if (isSourceUSDC) {
      return {
        valid: false,
        params,
        error: new routes.UnavailableError(
          new Error('Cannot transfer USDC from HyperCore'),
        ),
      };
    }
  }

  return null;
}

/**
 * Fetches the HyperCore USDC permit params and asks the signer to sign them
 * when the quote indicates a permit is required.
 */
export async function maybeGetHyperCorePermitSignature<N extends Network>(
  request: routes.RouteTransferRequest<N>,
  signer: Signer<N>,
  quote: Quote,
  destinationAddress: string,
): Promise<string | undefined> {
  // Detect when a quote includes HyperCore metadata requiring an EIP-712 permit.
  const requiresPermit =
    isHyperCoreChain(request.toChain.chain) &&
    quote.details?.hyperCoreParams !== undefined;

  if (!requiresPermit) return undefined;

  const quoteDetails = quote.details;

  if (!quoteDetails) {
    throw new Error('Missing HyperCore quote details required for permit');
  }

  const arbitrumRpc = (await request.toChain.getRpc()) ?? null;

  if (!arbitrumRpc) {
    throw new Error('Could not resolve HyperCore RPC connection');
  }

  let domain: PermitDomain;
  let types: typeof PermitTypes;
  let value: PermitValue;

  try {
    ({ domain, types, value } = await getHyperCoreUSDCDepositPermitParams(
      quoteDetails,
      destinationAddress,
      arbitrumRpc,
    ));
  } catch (e) {
    throw new Error(
      `Failed to fetch HyperCore USDC permit params: ${(e as Error).message}`,
    );
  }

  if (typeof (signer as any).signTypedData === 'function') {
    return await (signer as any).signTypedData(domain, types, value);
  }

  if (isEvmNativeSigner(signer)) {
    const nativeSigner = signer.unwrap();
    return await nativeSigner.signTypedData(domain, types, value);
  }

  throw new Error(
    'Signer must support EIP-712 typed data signing to bridge USDC to HyperCore',
  );
}
