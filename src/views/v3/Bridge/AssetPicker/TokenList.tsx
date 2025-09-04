import React, { useMemo } from 'react';
import { Box, Card, CardContent, Skeleton, useTheme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';

import type { ChainConfig } from 'config/types';
import type { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v3/Bridge/AssetPicker/SearchableList';
import TokenItem from 'views/v3/Bridge/AssetPicker/TokenItem';
import { getUSDFormat, calculateUSDPriceRaw } from 'utils';
import config from 'config';
import { useTokens } from 'contexts/TokensContext';
import type { Balances } from 'utils/wallet/types';
import { useTokenListWithSearch } from 'hooks/useTokenListWithSearch';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

type Props = {
  tokenList: Array<Token>;
  balances: Balances;
  isFetchingBalances: boolean;
  isFetching?: boolean;
  isConnectingWallet?: boolean;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  sourceToken?: Token;
  isSameChainSwap: boolean;
  isSource: boolean;
  wallet: WalletData;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSelectToken: (key: Token) => void;
  fetchTokensProgress?: null | number;
};

const TokenList = (props: Props) => {
  const theme = useTheme();
  const tokenPastingIsEnabled = config.ui.disableUserInputtedTokens !== true;
  const { isFetchingToken } = useTokens();

  const { sortedTokens, tokenPrices } = useTokenListWithSearch({
    baseTokenList: props.tokenList,
    searchQuery: props.searchQuery,
    chain: props.selectedChainConfig.sdkName,
    isSource: props.isSource,
    isSameChainSwap: props.isSameChainSwap,
    sourceToken: props.sourceToken,
    balances: props.balances,
    walletAddress: props.wallet.address,
    tokenPastingEnabled: tokenPastingIsEnabled,
  });

  const emptyMessage = useMemo(() => {
    let message = '';

    if (props.isSource) {
      message = props.wallet?.address
        ? 'No supported tokens found in wallet'
        : '';
    } else {
      message = 'No supported destination tokens for this route';
    }

    return (
      <Typography variant="body2" color={theme.palette.grey.A400}>
        {message}
      </Typography>
    );
  }, [props.wallet?.address, props.isSource, theme.palette.grey.A400]);

  const placeholder = `Search for a token${
    tokenPastingIsEnabled ? ' or paste an address' : ''
  }`;

  const styles = useMemo(
    () => ({
      card: {
        background: theme.palette.input.background,
        maxWidth: '420px',
      },
      tokenListContainer: {
        padding: '16px 0 0 0 !important',
      },
      title: {
        fontSize: 14,
        marginBottom: '8px',
      },
      tokenLoader: {
        padding: 0,
        display: 'flex',
        justifyContent: 'space-between',
      },
      tokenList: {
        maxHeight: '360px',
        [theme.breakpoints.down('sm')]: {
          maxHeight: '520px',
        },
      },
    }),
    [theme],
  );

  // Determine the current state of the token list
  const listState = useMemo(() => {
    // Currently fetching initial data
    if (props.isFetching) {
      return 'loading';
    }

    // We have data but no tokens to show
    if (sortedTokens.length === 0) {
      return 'empty';
    }

    // Normal state - show the token list
    return 'ready';
  }, [
    props.isSource,
    props.wallet?.address,
    props.isConnectingWallet,
    props.isFetching,
    sortedTokens.length,
  ]);

  const shouldShowLoadingState = listState === 'loading';
  const shouldShowEmptyMessage = listState === 'empty';

  // Build sectioned list for source picker when not searching
  const isGroupingEnabled = props.isSource && !props.searchQuery;

  const { itemsForRender, ownedCount } = useMemo(() => {
    if (!isGroupingEnabled) {
      return { itemsForRender: sortedTokens, ownedCount: 0 };
    }

    const hasPositiveBalance = (token: Token) => {
      const bal = props.balances?.[token.key]?.balance;
      return !!(bal && sdkAmount.units(bal) > 0n);
    };

    const nativeToken = sortedTokens.find((token) => token.isNativeGasToken);
    const ownedTokens = sortedTokens.filter((tok) => hasPositiveBalance(tok));
    const ownedSet = new Set(ownedTokens.map((token) => token.key));

    const items: Token[] = [];
    // Owned tokens first, preserving order from sortedTokens
    items.push(...ownedTokens);

    // Include native gas token next if not owned and exists
    if (nativeToken && !ownedSet.has(nativeToken.key)) {
      items.push(nativeToken);
    }

    // Then the rest
    for (const token of sortedTokens) {
      if (ownedSet.has(token.key)) continue;
      if (nativeToken && token.key === nativeToken.key) continue;
      items.push(token);
    }

    return { itemsForRender: items, ownedCount: ownedTokens.length };
  }, [isGroupingEnabled, props.balances, sortedTokens]);

  const searchList = (
    <SearchableList<Token>
      searchPlaceholder={placeholder}
      sx={styles.tokenList}
      dataTestId="token-search-list"
      searchQuery={props.searchQuery}
      listTitle={
        shouldShowEmptyMessage ? (
          emptyMessage
        ) : (
          <Box display="flex" width="100%">
            <Typography
              style={{ flexGrow: '2' }}
              fontSize={14}
              color={theme.palette.text.secondary}
            >
              Tokens on {props.selectedChainConfig.displayName}
            </Typography>
          </Box>
        )
      }
      loading={
        shouldShowLoadingState &&
        [1, 2, 3].map((x) => (
          <ListItemButton sx={styles.tokenLoader} dense key={x}>
            <Box padding="8px 16px">
              <Skeleton variant="circular" width="36px" height="36px" />
            </Box>
          </ListItemButton>
        ))
      }
      items={itemsForRender}
      onQueryChange={(query) => {
        props.onSearchQueryChange(query);
      }}
      renderFn={(token: Token, index: number) => {
        const balance = props.balances?.[token.key]?.balance;
        const tokenPrice = tokenPrices.get(token.key);
        const price =
          balance && tokenPrice !== undefined
            ? getUSDFormat(calculateUSDPriceRaw(tokenPrice, balance, token))
            : null;

        const isRestSection = isGroupingEnabled && index >= ownedCount;

        return (
          <>
            {isGroupingEnabled && index === 0 && ownedCount > 0 && (
              <Box sx={{ padding: '4px 16px' }}>
                <Typography fontSize={10} color={theme.palette.text.secondary}>
                  Your wallet tokens
                </Typography>
              </Box>
            )}
            {isGroupingEnabled && index === ownedCount && (
              <Box sx={{ padding: '4px 16px' }}>
                <Typography fontSize={10} color={theme.palette.text.secondary}>
                  All tokens
                </Typography>
              </Box>
            )}
            <TokenItem
              key={token.key}
              token={token}
              chain={props.selectedChainConfig.sdkName}
              onClick={() => {
                props.onSelectToken(token);
              }}
              isSource={props.isSource}
              balance={balance}
              price={price}
              isSelected={token.key === props.selectedToken?.key}
              isFetchingBalance={props.isFetchingBalances}
              dimmed={isRestSection}
            />
          </>
        );
      }}
    />
  );

  return (
    <Card sx={styles.card} variant="elevation">
      <CardContent sx={styles.tokenListContainer}>
        <Box sx={{ display: 'flex', padding: '0 16px' }}>
          <Typography width="100%" sx={styles.title}>
            Select a token
          </Typography>
          {isFetchingToken || props.isFetchingBalances ? (
            <CircularProgress
              sx={{ alignSelf: 'flex-end', marginBottom: '12px' }}
              size={14}
            />
          ) : null}
        </Box>
        {searchList}
      </CardContent>
    </Card>
  );
};

export default React.memo(TokenList);
