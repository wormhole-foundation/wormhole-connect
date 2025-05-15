import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Skeleton, useTheme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';
import {
  circle,
  isNative,
  amount as sdkAmount,
  toNative,
} from '@wormhole-foundation/sdk';

import useGetTokenBalances from 'hooks/useGetTokenBalances';
import type { ChainConfig } from 'config/types';
import {
  isTokenTuple,
  isSameToken,
  Token,
  tokenIdFromTuple,
  tokenKey,
} from 'config/tokens';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v2/Bridge/AssetPicker/SearchableList';
import TokenItem from 'views/v2/Bridge/AssetPicker/TokenItem';
import {
  calculateUSDPrice,
  calculateUSDPriceRaw,
  isFrankensteinToken,
} from 'utils';
import config from 'config';
import { useTokens } from 'contexts/TokensContext';

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
  tokenList?: Array<Token>;
  isFetching?: boolean;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  sourceToken?: Token;
  wallet: WalletData;
  onSelectToken: (key: Token) => void;
  isSource: boolean;
};

const TokenList = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const tokenPastingIsEnabled = config.ui.disableUserInputtedTokens !== true;

  const { getOrFetchToken, isFetchingToken, getTokenPrice } = useTokens();

  const [searchQuery, setSearchQuery] = useState('');

  const { isFetching: isFetchingTokenBalances, balances } = useGetTokenBalances(
    props.wallet,
    props.selectedChainConfig.key,
    props.tokenList || [],
  );

  useEffect(() => {
    // When the search query or chain changes, see if the search query is a valid address on the selected chain.
    // If it is, see if we have a token in the token cache for that address.
    // If not, try to find it.
    if (tokenPastingIsEnabled) {
      try {
        if (searchQuery !== '') {
          const chain = props.selectedChainConfig.sdkName;
          const address = toNative(chain, searchQuery);

          if (address) {
            const existing = config.tokens.get(chain, searchQuery);
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
  }, [searchQuery, props.selectedChainConfig.sdkName]);

  // Returns a score for a given token used when sorting destination tokens
  const tokenPreferenceScore = (token: Token) => {
    // Currently selected token should be shown first
    if (props.selectedToken && isSameToken(props.selectedToken, token)) {
      return 4;
    }
    // Native gas tokens are next
    if (isNative(token.addressString)) {
      return 3;
    }
    // USDC preferred next
    const usdc = circle.usdcContract.get(config.network, token.chain);
    if (usdc && token.addressString === usdc) {
      return 2;
    }
    // Finally, prefer native non-wrapped tokens over wrapped ones
    if (!token.isTokenBridgeWrappedToken) {
      return 1;
    }
    // The rest is all the same as far as preference
    return 0;
  };

  // TODO this entire thing should be moved outside of this TokenList component. The component is doing way too much.
  const sortedTokens = useMemo(() => {
    if (!props.tokenList) return [];

    const unsortedTokens = props.tokenList;

    // Apply search input - find tokens with exact match of address, or partial match of symbol
    if (searchQuery) {
      let searchResults: Token[] = [];
      const byAddress = config.tokens.get(
        props.selectedChainConfig.sdkName,
        searchQuery,
      );
      if (byAddress) {
        searchResults.push(byAddress);
      }

      const queryResults = config.tokens
        .queryBySymbol(props.selectedChainConfig.sdkName, searchQuery)
        .filter(
          (t: Token) =>
            !isFrankensteinToken(t, props.selectedChainConfig.sdkName),
        );

      if (queryResults.length > 0) {
        searchResults = searchResults.concat(queryResults);
      }

      for (const result of searchResults) {
        if (
          !props.tokenList.find((existing) => isSameToken(result, existing))
        ) {
          unsortedTokens.push(result);
        }
      }
    }

    const usdBalance = (token: Token): number => {
      const balance = balances[tokenKey(token)];
      if (!balance || !balance.balance) {
        return 0;
      }
      return calculateUSDPriceRaw(getTokenPrice, balance.balance, token) ?? 0;
    };

    let sorted = unsortedTokens.sort((a, b) => {
      const scoreA = tokenPreferenceScore(a);
      const scoreB = tokenPreferenceScore(b);
      if (scoreA > scoreB) return -1;
      if (scoreB > scoreA) return 1;

      const balanceA = usdBalance(a);
      const balanceB = usdBalance(b);
      if (balanceA !== balanceB) {
        return balanceB - balanceA;
      } else {
        // If equal scores and USD balance, compare by symbol
        return a.symbol.localeCompare(b.symbol);
      }
    });

    if (config.tokenWhitelist && config.tokenWhitelist.length > 0) {
      // If integrator has specified a token whitelist, filter the token list by this whitelist.
      //
      // The logic behind how this works is a little complicated. The whitelist is an array of (string | TokenTuple).
      // The strings can be symbols like "USDC", which lets the integrator easily whitelist tokens across all supported chains.
      //
      // The way we handle symbols is that for each chain:
      // 1. If there is a single native token with that symbol, we simply use that
      // 2. If there is NO native token with that symbol but there is a wrapped token, we show that.
      // 3. If there are somehow multiple wrapped tokens with that symbol, which all passed through the isFrankensteinToken check above,
      //    we include them all but log a warning to the console for the integrator's benefit.
      //
      // The integrator can also specify exact tokens using TokenTuples like ["Solana", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"].

      const filteredTokens: Set<string> = new Set();
      const desiredSymbols: string[] = [];

      for (const item of config.tokenWhitelist) {
        if (typeof item === 'string') {
          // Treated as a symbol
          desiredSymbols.push(item);
        } else if (isTokenTuple(item)) {
          const tokenId = tokenIdFromTuple(item);
          if (tokenId.chain === props.selectedChainConfig.sdkName) {
            filteredTokens.add(tokenId.address.toString());
          }
        }
      }

      for (const symbol of desiredSymbols) {
        let foundNative = false;
        const wrapped: Token[] = [];

        for (const token of sorted) {
          if (token.symbol === symbol) {
            if (!token.isTokenBridgeWrappedToken) {
              filteredTokens.add(token.address.toString());
              foundNative = true;
            } else {
              wrapped.push(token);
            }
          }
        }

        if (!foundNative && wrapped.length > 0) {
          for (const { address } of wrapped) {
            filteredTokens.add(address.toString());
          }

          if (wrapped.length > 1) {
            console.warn(
              `Ambiguous token whitelist item "${symbol}"; found ${wrapped.length} matching wrapped tokens.`,
            );
          }
        }
      }

      sorted = sorted.filter((token) =>
        filteredTokens.has(token.address.toString()),
      );
    }

    if (config.isTokenSupportedHandler) {
      // The last step is to filter the tokens by the integrator's token support handler
      sorted = sorted.filter(config.isTokenSupportedHandler);
    }

    if (props.isSource && props.wallet.address) {
      sorted = sorted.filter((t) => {
        const bal = balances[tokenKey(t)]?.balance;
        return bal && sdkAmount.units(bal) > 0;
      });
    }

    return sorted;
  }, [
    props.selectedChainConfig.sdkName,
    props.selectedChainConfig.key,
    props.selectedToken,
    props.tokenList,
    props.sourceToken,
    props.isSource,
    props.wallet?.address,
    balances,
    searchQuery,
  ]);

  const noTokensMessage = useMemo(
    () => (
      <Typography variant="body2" color={theme.palette.grey.A400}>
        No supported tokens found in wallet
      </Typography>
    ),
    [theme.palette.grey.A400],
  );

  const shouldShowEmptyMessage =
    sortedTokens.length === 0 && !isFetchingTokenBalances && !props.isFetching;

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
          <Typography fontSize={14} color={theme.palette.text.secondary}>
            Tokens on {props.selectedChainConfig.displayName}
          </Typography>
        )
      }
      loading={
        props.isFetching &&
        [1, 2, 3].map((_) => (
          <ListItemButton className={classes.tokenLoader} dense>
            <Box height="39px" padding="8px 16px">
              <Skeleton variant="circular" width="36px" height="36px" />
            </Box>
          </ListItemButton>
        ))
      }
      items={sortedTokens}
      onQueryChange={(query) => {
        setSearchQuery(query);
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
        const balance = balances?.[token.key]?.balance;
        const price = balance
          ? calculateUSDPrice(getTokenPrice, balance, token)
          : null;
        const disabled =
          props.isSource &&
          !!props.wallet?.address &&
          !!balances &&
          (!balance || sdkAmount.units(balance) === 0n);

        return (
          <TokenItem
            key={token.key}
            token={token}
            chain={props.selectedChainConfig.key}
            disabled={disabled}
            onClick={() => {
              props.onSelectToken(token);
            }}
            balance={balance}
            price={price}
            isSelected={token.key === props.selectedToken?.key}
            isFetchingBalance={isFetchingTokenBalances}
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
