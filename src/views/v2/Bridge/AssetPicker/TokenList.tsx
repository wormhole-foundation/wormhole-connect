import React, { useMemo } from 'react';
import { Box, Card, CardContent, Skeleton, useTheme } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';

import type { ChainConfig } from 'config/types';
import type { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v2/Bridge/AssetPicker/SearchableList';
import TokenItem from 'views/v2/Bridge/AssetPicker/TokenItem';
import { getUSDFormat, calculateUSDPriceRaw } from 'utils';
import config from 'config';
import type { Balances } from 'utils/wallet/types';
import { useTokenListWithSearch } from 'hooks/useTokenListWithSearch';

type Props = {
  tokenList: Array<Token>;
  balances: Balances;
  isFetchingBalances: boolean;
  isFetching?: boolean;
  isConnectingWallet?: boolean;
  isSameChainSwap: boolean;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  sourceToken?: Token;
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

  const { sortedTokens, tokenPrices, userTokens, otherTokens } =
    useTokenListWithSearch({
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

    if (!props.wallet?.address) {
      message = 'Connect wallet to see available tokens';
    } else if (props.isSource) {
      message = 'No supported tokens found in wallet';
    } else if (!props.sourceToken) {
      message = 'Please select a source token first';
    } else {
      message = 'No supported destination tokens for this route';
    }

    return (
      <Typography variant="body2" color={theme.palette.grey.A400}>
        {message}
      </Typography>
    );
  }, [
    props.wallet?.address,
    props.isSource,
    props.sourceToken,
    theme.palette.grey.A400,
  ]);

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
          maxHeight: '480px',
        },
      },
    }),
    [theme],
  );

  // Determine the current state of the token list
  const listState = useMemo(() => {
    // Currently fetching initial data
    if (props.isFetching || props.isFetchingBalances) {
      return 'loading';
    }

    // We have data but no tokens to show
    if (sortedTokens.length === 0) {
      return 'empty';
    }

    // Normal state - show the token list
    return 'ready';
  }, [props.isFetching, props.isFetchingBalances, sortedTokens.length]);

  const shouldShowLoadingState = listState === 'loading';
  const shouldShowEmptyMessage = listState === 'empty';
  const shouldShowSections =
    props.isSource &&
    props.wallet?.address &&
    !props.searchQuery &&
    (userTokens.length > 0 || otherTokens.length > 0);

  const renderTokenItem = (token: Token) => {
    const balance = props.balances?.[token.key]?.balance;
    const tokenPrice = tokenPrices.get(token.key);
    const price =
      balance && tokenPrice !== undefined
        ? getUSDFormat(calculateUSDPriceRaw(tokenPrice, balance, token))
        : null;

    return (
      <TokenItem
        key={token.key}
        token={token}
        chain={props.selectedChainConfig.sdkName}
        onClick={() => {
          props.onSelectToken(token);
        }}
        balance={balance}
        price={price}
        isSelected={token.key === props.selectedToken?.key}
        isFetchingBalance={props.isFetchingBalances}
        isSource={props.isSource}
      />
    );
  };

  // Create a combined list with section markers for sectioned display
  const displayItems = useMemo(() => {
    if (!shouldShowSections) {
      return sortedTokens;
    }

    const items: (Token | { isSection: true; title: string })[] = [];

    if (userTokens.length > 0) {
      items.push({ isSection: true, title: 'Your tokens' });
      items.push(...userTokens);
    }

    if (otherTokens.length > 0) {
      items.push({ isSection: true, title: 'Other available tokens' });
      items.push(...otherTokens);
    }

    return items;
  }, [shouldShowSections, sortedTokens, userTokens, otherTokens]);

  const searchList = (
    <SearchableList<Token | { isSection: true; title: string }>
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
      items={displayItems}
      onQueryChange={(query) => {
        props.onSearchQueryChange(query);
      }}
      renderFn={(
        item: Token | { isSection: true; title: string },
        index: number,
      ) => {
        if ('isSection' in item && item.isSection) {
          return (
            <Typography
              key={`section-${index}`}
              sx={{
                padding: '8px 16px',
                fontWeight: 600,
                marginTop: index > 0 ? '8px' : 0,
              }}
              fontSize={12}
              color={theme.palette.text.secondary}
            >
              {item.title}
            </Typography>
          );
        }

        return renderTokenItem(item as Token);
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
        </Box>
        {searchList}
      </CardContent>
    </Card>
  );
};

export default TokenList;
