import { Chain } from '@wormhole-foundation/sdk';
import { Alignment } from 'components/Header';

export type UiConfig = {
  title: string;
  cta?: {
    text: string;
    link: string;
  };
  explorer?: ExplorerConfig;
  bridgeDefaults?: BridgeDefaults;
  cctpWarning: string;
  pageHeader?: string | PageHeader;
  pageSubHeader?: string;
  menu: MenuEntry[];
  searchTx?: SearchTxConfig;
  moreTokens?: MoreTokenConfig;
  moreNetworks?: MoreChainConfig;
  partnerLogo?: string;
  walletConnectProjectId?: string;
  showHamburgerMenu: boolean;
  previewMode?: boolean; // Disables making transfers
};

export interface BridgeDefaults {
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

export type MoreTokenConfig = {
  label: string;
  href: string;
  target?: '_blank' | '_self';
};

export type MoreChainConfig = {
  href: string;
  target?: '_blank' | '_self';
  description: string;
  networks: MoreChainDefinition[];
};

export type MoreChainDefinition = {
  icon: string;
  href?: string;
  label: string;
  name?: string;
  description?: string;
  target?: '_blank' | '_self';
  showOpenInNewIcon?: boolean;
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
    bridgeDefaults: customConfig?.bridgeDefaults,
    cctpWarning: customConfig?.cctpWarning || '',
    pageHeader: customConfig?.pageHeader,
    pageSubHeader: customConfig?.pageSubHeader,
    menu: customConfig?.menu ?? [],
    searchTx: customConfig?.searchTx,
    moreTokens: customConfig?.moreTokens,
    moreNetworks: customConfig?.moreNetworks,
    partnerLogo: customConfig?.partnerLogo,
    walletConnectProjectId:
      customConfig?.walletConnectProjectId ??
      import.meta.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
    showHamburgerMenu: customConfig?.showHamburgerMenu ?? false,
    previewMode: !!customConfig?.previewMode,
  };
}
