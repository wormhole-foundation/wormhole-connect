import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, useTheme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';
import { amount as sdkAmount, toNative } from '@wormhole-foundation/sdk';

import useGetTokenBalances from 'hooks/useGetTokenBalances';
import type { ChainConfig, NonSDKChain } from 'config/types';
import { isTokenTuple, Token, tokenIdFromTuple } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v2/Bridge/AssetPicker/SearchableList';
import TokenItem from 'views/v2/Bridge/AssetPicker/TokenItem';
import { calculateUSDPrice, isFrankensteinToken } from 'utils';
import config from 'config';
import { useTokens } from 'contexts/TokensContext';
const useStyles = makeStyles()((_theme) => ({
  card: {
    maxWidth: '420px',
  },
  cardContent: {
    paddingTop: 0,
  },
  title: {
    fontSize: 14,
    marginBottom: '8px',
  },
  tokenLoader: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  tokenList: {
    maxHeight: 340,
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
  selectedNonSDKChain?: NonSDKChain | undefined;
};

const TokenList = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const tokenPastingIsEnabled = config.ui.disableUserInputtedTokens !== true;

  const { getOrFetchToken, isFetchingToken, getTokenPrice } = useTokens();

  const [searchQuery, setSearchQuery] = useState('');

  const { isFetching: isFetchingTokenBalances, balances } = useGetTokenBalances(
    props.wallet,
    props.selectedChainConfig,
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
  }, [searchQuery, props.selectedChainConfig.sdkName, getOrFetchToken]);

  const sortedTokens = useMemo(() => {
    const nativeToken = config.tokens.getGasToken(
      props.selectedChainConfig.sdkName,
    );

    const tokenSet: Set<string> = new Set();
    const tokens: Array<Token> = [];

    // First: Add previously selected token at the top of the list,
    // only if it's the selected token's chain
    if (
      props.selectedToken &&
      props.selectedToken!.chain === props.selectedChainConfig.key &&
      !tokenSet.has(props.selectedToken.address.toString())
    ) {
      tokenSet.add(props.selectedToken.address.toString());
      tokens.push(props.selectedToken);
    }

    // Check if any token's address is an exact match on the search query
    // If so, add that one next
    const searchResult = props.tokenList?.find(
      (t) => t.address.toString().toLowerCase() === searchQuery.toLowerCase(),
    );
    if (searchResult && !tokenSet.has(searchResult.address.toString())) {
      tokenSet.add(searchResult.address.toString());
      tokens.push(searchResult);
    }

    // Second: add any tokens with a matching symbol to the source token, ignoring leading Ws (for wrapped),
    // but NOT if they are wrapped and there's a non-wrapped (native) token with the same symbol also in the list
    //
    // This basically prioritizes token bridge outputs in a somewhat hacky way.
    if (props.sourceToken) {
      props.tokenList?.forEach((t) => {
        const symbolMatch =
          t.symbol.replace(/^W?/, '') ===
          props.sourceToken!.symbol.replace(/^W?/, '');
        const originatesFromSourceChain =
          t.isTokenBridgeWrappedToken &&
          t.tokenBridgeOriginalTokenId!.chain === props.sourceToken!.chain;

        if (
          symbolMatch &&
          originatesFromSourceChain &&
          !props.tokenList!.find(
            (ot) => !ot.isTokenBridgeWrappedToken && ot.symbol === t.symbol,
          ) &&
          !tokenSet.has(t.address.toString())
        ) {
          tokenSet.add(t.address.toString());
          tokens.push(t);
        }
      });
    }

    // Third: Add the native gas token unless non-SDK destination chain is Hyperliquid
    if (
      nativeToken &&
      nativeToken.address.toString() !==
        props.selectedToken?.address.toString() &&
      !tokenSet.has(nativeToken.address.toString()) &&
      props.selectedChainConfig.displayName !== 'Hyperliquid'
    ) {
      tokenSet.add(nativeToken.address.toString());
      tokens.push(nativeToken);
    }

    // Fourth: Add tokens with a balances in the connected wallet
    Object.entries(balances).forEach(([key, val]) => {
      if (val?.balance && sdkAmount.units(val.balance) > 0n) {
        const tokenConfig = props.tokenList?.find((t) => t.key === key);

        if (tokenConfig && !tokenSet.has(tokenConfig.address.toString())) {
          tokenSet.add(tokenConfig.address.toString());
          tokens.push(tokenConfig);
        }
      }
    });

    // Finally: If this is destination token or no wallet is connected,
    // fill up any remaining space from supported and non-Frankenstein tokens
    if (!props.isSource || !props.wallet?.address) {
      props.tokenList?.forEach((t) => {
        // Check if previously added
        if (tokenSet.has(t.address.toString())) {
          return;
        }

        // Exclude frankenstein tokens
        if (isFrankensteinToken(t, props.selectedChainConfig.key)) {
          return;
        }

        tokenSet.add(t.address.toString());
        tokens.push(t);
      });
    }

    if (config.tokenWhitelist && config.tokenWhitelist.length > 0) {
      // If integrator has specified a token whitelist, the last step is to filter the token list by this whitelist.
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

        for (const token of tokens) {
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
              `Ambigous token whitelist item "${symbol}"; found ${wrapped.length} matching wrapped tokens.`,
            );
          }
        }
      }

      return tokens.filter(({ address }) =>
        filteredTokens.has(address.toString()),
      );
    }

    return tokens;
  }, [
    balances,
    props.tokenList,
    props.selectedChainConfig.sdkName,
    props.selectedChainConfig.key,
    props.selectedChainConfig.displayName,
    props.sourceToken,
    props.isSource,
    props.wallet?.address,
    props.selectedToken,
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
        props.isFetching && (
          <ListItemButton className={classes.tokenLoader} dense>
            <CircularProgress />
          </ListItemButton>
        )
      }
      items={sortedTokens}
      onQueryChange={(query) => {
        setSearchQuery(query);
      }}
      filterFn={(token, query) => {
        if (query.length === 0) return true;

        const chain = props.selectedChainConfig.key;

        // Exclude frankenstein tokens with no balance
        const balance = balances?.[token.key]?.balance;
        const hasBalance = balance && sdkAmount.units(balance) > 0n;

        if (isFrankensteinToken(token, chain) && !hasBalance) {
          return false;
        }

        // Exclude wormhole-wrapped tokens with no balance
        // unless it's canonical
        if (props.isSource && token.isTokenBridgeWrappedToken && !hasBalance) {
          return false;
        }

        const queryLC = query.toLowerCase();

        const symbolMatch = [token.symbol, token.name].some((criteria) =>
          criteria?.toLowerCase()?.includes?.(queryLC),
        );
        if (symbolMatch) return true;

        if (token.address.toString().toLowerCase().includes(queryLC)) {
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
            isFetchingBalance={isFetchingTokenBalances}
          />
        );
      }}
    />
  );

  return (
    <Card className={classes.card} variant="elevation">
      <CardContent className={classes.cardContent}>
        <Box sx={{ display: 'flex', width: '100%' }}>
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
