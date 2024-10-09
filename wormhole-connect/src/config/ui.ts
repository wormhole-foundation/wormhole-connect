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
  showHamburgerMenu?: boolean;
  previewMode?: boolean; // Disables making transfers

  getHelpUrl?: string;

  // Shows in-progress widgets
  showInProgressWidget?: boolean;
};

export interface DefaultInputs {
  fromChain?: Chain;
  toChain?: Chain;
  tokenKey?: string;
  requiredChain?: Chain;
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

export function createUiConfig(customConfig: Partial<UiConfig>): UiConfig {
  return {
    title: customConfig?.title ?? 'Wormhole Connect',
    cta: customConfig?.cta,
    explorer: customConfig?.explorer,
    defaultInputs: customConfig?.defaultInputs,
    pageHeader: customConfig?.pageHeader,
    menu: customConfig?.menu ?? [],
    getHelpUrl: customConfig?.getHelpUrl,
    searchTx: customConfig?.searchTx,
    partnerLogo: customConfig?.partnerLogo,
    walletConnectProjectId:
      customConfig?.walletConnectProjectId ??
      import.meta.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
    showHamburgerMenu: customConfig?.showHamburgerMenu ?? false,
    previewMode: !!customConfig?.previewMode,
    showInProgressWidget: !!customConfig?.showInProgressWidget,
  };
}
