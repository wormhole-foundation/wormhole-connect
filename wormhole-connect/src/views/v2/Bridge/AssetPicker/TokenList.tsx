import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Skeleton,
  useTheme,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';
import { toNative } from '@wormhole-foundation/sdk';

import type { ChainConfig } from 'config/types';
import { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v2/Bridge/AssetPicker/SearchableList';
import TokenItem from 'views/v2/Bridge/AssetPicker/TokenItem';
import { calculateUSDPrice } from 'utils';
import config from 'config';
import { useTokens } from 'contexts/TokensContext';
import { Balances } from 'store/transferInput';

const useStyles = makeStyles()((theme: any) => ({
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
}));

type Props = {
  tokenList: Array<Token>;
  balances: Balances;
  isFetchingBalances: boolean;
  isFetching?: boolean;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  sourceToken?: Token;
  wallet: WalletData;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSelectToken: (key: Token) => void;
  fetchTokensProgress?: null | number;
};

const TokenList = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const tokenPastingIsEnabled = config.ui.disableUserInputtedTokens !== true;

  const {
    getOrFetchToken,
    isFetchingToken,
    getTokenPrice,
    isFetchingTokenPrices,
  } = useTokens();

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

  const noTokensMessage = useMemo(
    () => (
      <Typography variant="body2" color={theme.palette.grey.A400}>
        No supported tokens found in wallet
      </Typography>
    ),
    [theme.palette.grey.A400],
  );

  const shouldShowEmptyMessage =
    sortedTokens.length === 0 &&
    !props.isFetchingBalances &&
    !props.isFetching &&
    !isFetchingTokenPrices;

  if (shouldShowEmptyMessage) {
    console.log(
      sortedTokens,
      props.balances,
      props.isFetchingBalances,
      props.isFetching,
      isFetchingTokenPrices,
    );
  }

  console.log(shouldShowEmptyMessage, props.balances);

  const placeholder = `Search for a token${
    tokenPastingIsEnabled ? ' or paste an address' : ''
  }`;

  const searchList = (
    <SearchableList<Token>
      searchPlaceholder={placeholder}
      className={classes.tokenList}
      dataTestId="token-search-list"
      listTitle={
        shouldShowEmptyMessage ? (
          noTokensMessage
        ) : (
          <Box display="flex" width="100%">
            <Typography
              style={{ flexGrow: '2' }}
              fontSize={14}
              color={theme.palette.text.secondary}
            >
              Tokens on {props.selectedChainConfig.displayName}
            </Typography>

            <Box style={{ flexGrow: '1', padding: '6px 0' }}>
              {props.fetchTokensProgress ? (
                <LinearProgress
                  variant="determinate"
                  value={props.fetchTokensProgress * 100}
                />
              ) : null}
            </Box>
          </Box>
        )
      }
      loading={
        (props.isFetching || Object.keys(props.balances).length === 0) &&
        [1, 2, 3].map((x) => (
          <ListItemButton className={classes.tokenLoader} dense>
            <Box padding="8px 16px">
              <Skeleton key={x} variant="circular" width="36px" height="36px" />
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
        const price = balance
          ? calculateUSDPrice(getTokenPrice, balance, token)
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
    <Card className={classes.card} variant="elevation">
      <CardContent className={classes.tokenListContainer}>
        <Box sx={{ display: 'flex', width: '100%', padding: '0 16px' }}>
          <Typography width="100%" className={classes.title}>
            Select a token
          </Typography>
          {isFetchingToken ? (
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

export default TokenList;
