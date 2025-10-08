import type { Chain, Network, Signer } from '@wormhole-foundation/sdk-connect';
import { chainToPlatform, routes } from '@wormhole-foundation/sdk-connect';
import type {
  PermitDomain,
  PermitValue,
  PermitTypes,
} from '@mayanfinance/swap-sdk';
import { getHyperCoreUSDCDepositPermitParams } from '@mayanfinance/swap-sdk';
import type { Eip6963Wallet } from '@wormhole-labs/wallet-aggregator-evm';
import type {
  Quote,
  TransferParams,
  ValidationResult,
} from '../routes/mayan/types';
import { TransferWallet } from 'utils/wallet';
import type { WormholeConnectWalletProvider } from 'utils/wallet/types';
import { getWormholeContextV2 } from 'config';
import { isEvmChain } from './evm';

// Note: Hyperliquid bridge = Arbitrum bridge + custom payload for USDC deposit to Hyperliquid

const ARBITRUM = 'Arbitrum';

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
  const { fromChain, toChain } = request;

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

  const wh = await getWormholeContextV2();
  const platform = wh.getPlatform(chainToPlatform(ARBITRUM));
  const rpc = platform.getRpc(ARBITRUM);

  if (!rpc) {
    throw new Error(
      `Could not resolve ${ARBITRUM} RPC connection needed for HyperCore`,
    );
  }

  let domain: PermitDomain;
  let types: typeof PermitTypes;
  let value: PermitValue;

  try {
    ({ domain, types, value } = await getHyperCoreUSDCDepositPermitParams(
      quoteDetails,
      destinationAddress,
      rpc,
    ));
  } catch (e) {
    throw new Error(
      `Failed to fetch HyperCore USDC permit params: ${(e as Error).message}`,
    );
  }

  const signerWithProvider = signer as SignerWithProvider<N>;

  const walletProvider = signerWithProvider?.provider?.();

  if (!walletProvider) {
    throw new Error('No wallet provider available for HyperCore permit');
  }

  const walletToSwitch = isEvmChain(request.fromChain.chain)
    ? TransferWallet.SENDING
    : TransferWallet.RECEIVING;

  const wallet = walletProvider.getWallet(ARBITRUM, walletToSwitch) as
    | Eip6963Wallet
    | undefined;

  if (!wallet) {
    throw new Error(
      `An ${ARBITRUM} wallet connection is required to sign the HyperCore permit`,
    );
  }

  try {
    console.log(wallet);
    await wallet.switchChain(42161);
  } catch (e) {
    const reason = e instanceof Error ? `: ${e.message}` : '';
    throw new Error(
      `Unable to switch the connected wallet to ${ARBITRUM} (chainId 42161) for the HyperCore permit${reason}`,
    );
  }

  const nativeSigner = await wallet.getSigner();

  if (!nativeSigner) {
    throw new Error('Failed to access signer for HyperCore permit');
  }

  return nativeSigner.signTypedData(domain, types, value);
}
