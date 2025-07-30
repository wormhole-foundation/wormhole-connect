import React, { memo } from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { type Chain } from '@wormhole-foundation/sdk';

import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import type { Token } from 'config/tokens';
import type { Balances } from 'utils/wallet/types';
import ChainList from 'views/v3/Bridge/AssetPicker/ChainList';
import TokenList from 'views/v3/Bridge/AssetPicker/TokenList';

interface AssetPickerDrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (value: boolean) => void;
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

function AssetPickerDrawer({
  isDrawerOpen,
  setIsDrawerOpen,
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
}: AssetPickerDrawerProps) {
  const theme = useTheme();

  // Drawer handle - static content, no need to memoize
  const drawerHandle = (
    <Stack alignItems="center" paddingBottom="4px" paddingTop="8px">
      <Box
        sx={{
          width: '40px',
          height: '5px',
          backgroundColor: theme.palette.text.secondary,
          borderRadius: '8px',
        }}
      />
    </Stack>
  );

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={isDrawerOpen}
      slotProps={{
        paper: {
          sx: {
            background: theme.palette.input.background,
            borderRadius: '8px',
            height: 'calc(100vh - 40px)', // Force full-height on small mobile devices with 40px padding at the top
            maxWidth: '100vw', // Force full-width on small mobile devices
          },
        },
      }}
      transitionDuration={200}
      onOpen={() => setIsDrawerOpen(true)}
      onClose={() => setIsDrawerOpen(false)}
    >
      {drawerHandle}
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
    </SwipeableDrawer>
  );
}

export default memo(AssetPickerDrawer);
