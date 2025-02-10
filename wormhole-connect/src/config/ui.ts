import { Chain } from '@wormhole-foundation/sdk';
import { Alignment } from 'components/Header';

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

  // Set to true to disable the ability to paste in a token address
  disableUserInputtedTokens?: boolean;
};

export interface DefaultInputs {
  fromChain?: Chain;
  toChain?: Chain;
  fromToken?: string; // Address or symbol
  toToken?: string; // Address or symbol
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
    walletConnectProjectId:
      customConfig?.walletConnectProjectId ??
      import.meta.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
  };
}
