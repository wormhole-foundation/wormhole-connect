import type { Chain } from '@wormhole-foundation/sdk';
import type { Alignment } from 'components/Header';

export type UiConfig = {
  title?: string;
  cta?: {
    text: string;
    link: string;
  };
  explorer?: ExplorerConfig;
  defaultInputs?: DefaultInputs;
  pageHeader?: string | PageHeader;
  menu?: MenuEntry[];
  searchTx?: SearchTxConfig;
  partnerLogo?: string;
  walletConnectProjectId?: string;
  previewMode?: boolean; // Disables making transfers

  getHelpUrl?: string;

  // Shows in-progress widgets
  showInProgressWidget?: boolean;

  // Shows FooterNav
  showFooter?: boolean;

  // Set to true to disable the ability to paste in a token address
  disableUserInputtedTokens?: boolean;

  // Set to true to make Connect hide manual route quotes if there are
  // successful automatic quotes
  onlyOfferManualRoutesAsFallback?: boolean;

  // UI test options
  testOptions?: TestOptions;

  // UI experimental features
  experimental?: Experimental;

  // Override token names for specific chains and addresses (ex: display "SOL" instead of "WSOL")
  tokenNameOverrides?: { [chain in Chain]?: { [address: string]: string } };

  // URL for terms of service
  termsOfServiceUrl?: string;

  // When enabled hides the swap inputs button
  hideSwapInputs?: boolean;

  // When enabled hides the history button
  hideHistory?: boolean;

  // When enabled hides the change wallet option for source wallets
  hideSourceChangeWallet?: boolean;

  // When enabled hides the disconnect wallet option for source wallets
  hideSourceDisconnectWallet?: boolean;

  // When enabled hides the change wallet option for desitnation wallets
  hideDestinationChangeWallet?: boolean;

  // When enabled hides the disconnect wallet option for desitnation wallets
  hideDestinationDisconnectWallet?: boolean;

  // Filter transaction history by specific chains
  transactionHistoryChains?: Chain[];

  // When enabled disables the source token picker button
  disableSourceTokenPicker?: boolean;

  // When enabled disables the destination token picker button
  disableDestinationTokenPicker?: boolean;

  // Specifies which chains should have gas drop-off auto-enabled
  // when the destination wallet has zero native balance
  autoEnableGasDropOffChains?: Chain[];

  // Route sorting priority ('fastest' or 'cheapest')
  // Controls how routes are sorted in the list
  // 'fastest' - Sort by ETA (fastest first)
  // 'cheapest' - Sort by destination amount (best output first)
  // Defaults to 'fastest' if not specified
  routeSortPriority?: 'fastest' | 'cheapest';

  // When enabled hides the Fastest/Cheapest route selection toggle pills
  hideRouteSelectionPills?: boolean;
};

export type TestOptions = {
  enableHeadlessSigner?: boolean;
};

export type Experiments = 'feeOffsetting';
export type Experimental = {
  [Experiment in Experiments]?: boolean;
};

export interface ChainTokenPair {
  chain: Chain;
  token?: string;
}

export interface DefaultInputs {
  source?: ChainTokenPair;
  destination?: ChainTokenPair;
  requiredChain?: Chain;
  preferredRouteName?: string;
}

export type ExplorerConfig = {
  href: string;
  label?: string;
  target?: '_blank' | '_self';
};

export type PageHeader = {
  text: string;
  align: Alignment;
};

export type SearchTxConfig = {
  txHash?: string;
  chainName?: string;
};

export interface MenuEntry {
  label: string;
  href: string;
  target?: string;
  order?: number;
}

export function createUiConfig(customConfig: UiConfig): UiConfig {
  return {
    ...customConfig,
    showFooter: customConfig.showFooter ?? true, // Footer is shown by default if not specified
    experimental: customConfig.experimental ?? {},
    walletConnectProjectId:
      customConfig?.walletConnectProjectId ??
      import.meta.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
  };
}
