import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Skeleton, useTheme } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { toNative } from '@wormhole-foundation/sdk';

import type { ChainConfig } from 'config/types';
import type { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v2/Bridge/AssetPicker/SearchableList';
import TokenItem from 'views/v2/Bridge/AssetPicker/TokenItem';
import { getUSDFormat, calculateUSDPriceRaw } from 'utils';
import config from 'config';
import { useTokens } from 'contexts/TokensContext';
import type { Balances } from 'utils/wallet/types';

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
  const [tokenPrices, setTokenPrices] = useState<
    Map<string, number | undefined>
  >(new Map());

  const { getOrFetchToken, getTokenPrices, lastTokenPriceUpdate } = useTokens();

  // Get token prices using the synchronous hook pattern
  // Re-calculate when token list or price updates occur
  useEffect(() => {
    const prices = getTokenPrices(props.tokenList);
    setTokenPrices(prices);
  }, [props.tokenList, getTokenPrices, lastTokenPriceUpdate]);

  useEffect(() => {
    // When the search query or chain changes, see if the search query is a valid address on the selected chain.
    // If it is, see if we have a token in the token cache for that address.
    // If not, try to find it.
    if (tokenPastingIsEnabled) {
      try {
        if (props.searchQuery !== '') {
          const chain = props.selectedChainConfig.sdkName;
          const address = toNative(chain, props.searchQuery);

          if (address) {
            const existing = config.tokens.get(chain, props.searchQuery);
            if (!existing) {
              getOrFetchToken({ chain, address });
            }
          }
        }
      } catch (_e) {
        // Failed to parse the search query as an address... this is expected to happen a lot
      }
    }
    // Run the side-effect only when search query or chain changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.searchQuery, props.selectedChainConfig.sdkName]);

  const sortedTokens = props.tokenList;

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
    // No wallet connected - show empty state
    if (!props.wallet?.address && !props.isConnectingWallet) {
      return 'empty';
    }

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
  }, [
    props.wallet?.address,
    props.isConnectingWallet,
    props.isFetching,
    props.isFetchingBalances,
    props.isSource,
    props.balances,
    tokenPrices,
    sortedTokens.length,
  ]);

  const shouldShowLoadingState = listState === 'loading';
  const shouldShowEmptyMessage = listState === 'empty';

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
      items={sortedTokens}
      onQueryChange={(query) => {
        props.onSearchQueryChange(query);
      }}
      filterFn={(token, query) => {
        if (query.length === 0) return true;

        if (
          !props.isSource &&
          props.isSameChainSwap &&
          token.addressString === props.sourceToken?.addressString
        ) {
          // For same chain swaps don't show the source token
          // when we are filtering the destination token list.
          // For source token list allow showing the same token
          // which will automatically adjust the destination token
          // when selected.
          return false;
        }

        const queryLC = query.toLowerCase();

        const symbolMatch = [token.symbol, token.name].some((criteria) =>
          criteria?.toLowerCase()?.startsWith?.(queryLC),
        );
        if (symbolMatch) return true;

        if (token.address.toString().toLowerCase() === queryLC) {
          return true;
        }

        if (
          token.tokenBridgeOriginalTokenId &&
          token.tokenBridgeOriginalTokenId.address
            .toString()
            .toLowerCase()
            .includes(queryLC)
        ) {
          return true;
        }

        return false;
      }}
      renderFn={(token: Token) => {
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
          />
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
        </Box>
        {searchList}
      </CardContent>
    </Card>
  );
};

export default TokenList;
