import type { Chain, Network, Signer } from '@wormhole-foundation/sdk-connect';
import { routes } from '@wormhole-foundation/sdk-connect';
import type {
  PermitDomain,
  PermitValue,
  PermitTypes,
} from '@mayanfinance/swap-sdk';
import { getHyperCoreUSDCDepositPermitParams } from '@mayanfinance/swap-sdk';
import { isEvmNativeSigner } from '@wormhole-foundation/sdk-evm';
import type { Eip6963Wallet } from '@wormhole-labs/wallet-aggregator-evm';
import type {
  Quote,
  TransferParams,
  ValidationResult,
} from '../routes/mayan/types';
import { TransferWallet } from 'utils/wallet';
import type { WormholeConnectWalletProvider } from 'utils/wallet/types';
import { isEvmChain } from './evm';
import { isUSDCToken } from './usdc';

type SignerWithProvider<N extends Network> = Signer<N> & {
  provider?: () => WormholeConnectWalletProvider;
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
): ValidationResult | null {
  const { fromChain, toChain, destination } = request;

  if (isHyperCoreChain(fromChain.chain)) {
    return {
      valid: false,
      params,
      error: new routes.UnavailableError(
        new Error('HyperCore cannot be used as a source chain'),
      ),
    };
  }

  if (!isHyperCoreChain(toChain.chain)) {
    return null;
  }

  if (toChain.network !== 'Mainnet') {
    return {
      valid: false,
      params,
      error: new routes.UnavailableError(
        new Error('HyperCore is only available on Mainnet'),
      ),
    };
  }

  if (!isEvmChain(fromChain.chain)) {
    return {
      valid: false,
      params,
      error: new routes.UnavailableError(
        new Error('HyperCore only supports EVM source chains'),
      ),
    };
  }

  const isDestUSDC = isUSDCToken(
    toChain.chain,
    toChain.network,
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

  const signerWithProvider = signer as SignerWithProvider<N>;

  if (typeof signerWithProvider.provider === 'function') {
    const walletProvider = signerWithProvider.provider();

    if (!walletProvider) {
      throw new Error('No wallet provider available for HyperCore permit');
    }

    const wallet = walletProvider.getWallet(
      'Arbitrum',
      TransferWallet.SENDING,
    ) as Eip6963Wallet | undefined;

    if (!wallet) {
      throw new Error(
        'An Arbitrum wallet connection is required to sign the HyperCore permit',
      );
    }

    try {
      await wallet.switchChain(42161);
    } catch (e) {
      const reason = e instanceof Error ? `: ${e.message}` : '';
      throw new Error(
        `Unable to switch the connected wallet to Arbitrum (chainId 42161) for the HyperCore permit${reason}`,
      );
    }

    const nativeSigner = await wallet.getSigner();

    if (!nativeSigner) {
      throw new Error('Failed to access signer for HyperCore permit');
    }

    return nativeSigner.signTypedData(domain, types, value);
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
