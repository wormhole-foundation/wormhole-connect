import React, { memo } from 'react';
import { useTheme } from '@mui/material';
import Popover from '@mui/material/Popover';
import { bindPopover } from 'material-ui-popup-state/hooks';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { type Chain } from '@wormhole-foundation/sdk';

import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import type { Token } from 'config/tokens';
import type { Balances } from 'utils/wallet/types';
import ChainList from 'views/v3/Bridge/AssetPicker/ChainList';
import TokenList from 'views/v3/Bridge/AssetPicker/TokenList';

interface AssetPickerPopoverProps {
  popupState: PopupState;
  anchorEl: HTMLElement | null;
  chainList: Array<ChainConfig>;
  chainConfig?: ChainConfig;
  showChainSearch: boolean;
  setShowChainSearch: (value: boolean) => void;
  wallet: WalletData;
  sortedTokens: Token[];
  balances: Balances;
  isFetchingBalances: boolean;
  isConnectingWallet?: boolean;
  isFetchingTokens?: boolean;
  token?: Token;
  sourceToken?: Token;
  isSource: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onChainSelect: (value: Chain) => void;
  onTokenSelect: (value: Token) => void;
}

function AssetPickerPopover({
  popupState,
  anchorEl,
  chainList,
  chainConfig,
  showChainSearch,
  setShowChainSearch,
  wallet,
  sortedTokens,
  balances,
  isFetchingBalances,
  isConnectingWallet,
  isFetchingTokens,
  token,
  sourceToken,
  isSource,
  searchQuery,
  setSearchQuery,
  onChainSelect,
  onTokenSelect,
}: AssetPickerPopoverProps) {
  const theme = useTheme();

  return (
    <Popover
      {...bindPopover(popupState)}
      transitionDuration={200}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      marginThreshold={4}
      slotProps={{
        paper: {
          sx: {
            width: '100%',
            maxWidth: '420px',
            borderRadius: '8px',
            background: theme.palette.input.background,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)', // Safari support
          },
        },
        root: {
          sx: {
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)', // Safari support
          },
        },
      }}
    >
      <ChainList
        chainList={chainList}
        selectedChainConfig={chainConfig}
        showSearch={showChainSearch}
        setShowSearch={setShowChainSearch}
        wallet={wallet}
        onChainSelect={onChainSelect}
      />
      {!showChainSearch && chainConfig && (
        <TokenList
          tokenList={sortedTokens}
          balances={balances}
          isFetchingBalances={isFetchingBalances}
          isConnectingWallet={isConnectingWallet}
          isFetching={isFetchingTokens}
          selectedChainConfig={chainConfig}
          selectedToken={token}
          sourceToken={sourceToken}
          isSource={isSource}
          wallet={wallet}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSelectToken={onTokenSelect}
        />
      )}
    </Popover>
  );
}

export default memo(AssetPickerPopover);
