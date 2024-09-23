import React, { useMemo } from 'react';
import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import useGetTokenBalances from 'hooks/useGetTokenBalances';
import type { ChainConfig, TokenConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v2/Bridge/AssetPicker/SearchableList';
import TokenItem from 'views/v2/Bridge/AssetPicker/TokenItem';
import {
  getDisplayName,
  isCanonicalToken,
  isFrankensteinToken,
  isWrappedToken,
} from 'utils';
import { getTokenBridgeWrappedTokenAddressSync } from 'utils/sdkv2';

const useStyles = makeStyles()((theme) => ({
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
  tokenList?: Array<TokenConfig>;
  isFetching?: boolean;
  selectedChainConfig: ChainConfig;
  selectedToken?: string;
  sourceToken?: string;
  wallet: WalletData;
  onSelectToken: (key: string) => void;
  isSource: boolean;
};

const TokenList = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();

  const { isFetching: isFetchingTokenBalances, balances } = useGetTokenBalances(
    props.wallet?.address || '',
    props.selectedChainConfig.key,
    props.tokenList || [],
  );

  const sortedTokens = useMemo(() => {
    const { selectedToken, selectedChainConfig } = props;

    const selectedTokenConfig = selectedToken
      ? config.tokens[selectedToken]
      : undefined;

    const nativeTokenConfig = props.tokenList?.find(
      (t) => t.key === selectedChainConfig.gasToken,
    );

    const tokenSet: Set<string> = new Set();
    const tokens: Array<TokenConfig> = [];

    const addToken = (tokenConfig: TokenConfig) => {
      // Get token balance
      const tokenBalance = balances?.[tokenConfig.key]?.balance;
      // Check "no balance" only when a wallet is connected
      const noBalance =
        props.wallet?.address && (!tokenBalance || Number(tokenBalance) === 0);

      // Exclude frankenstein tokens with no balance
      if (
        isFrankensteinToken(tokenConfig, selectedChainConfig.key) &&
        noBalance
      ) {
        return;
      }

      // Exclude tokens with no balance on source list
      if (props.isSource && noBalance && props.wallet?.address) {
        return;
      }

      // Exclude wormhole-wrapped tokens with no balance
      // unless it's canonical
      if (
        props.isSource &&
        isWrappedToken(tokenConfig, selectedChainConfig.key) &&
        !isCanonicalToken(tokenConfig, selectedChainConfig.key) &&
        noBalance
      ) {
        return;
      }

      if (!tokenSet.has(tokenConfig.key)) {
        tokenSet.add(tokenConfig.key);
        tokens.push(tokenConfig);
      }
    };

    // First: Add previously selected token at the top of the list
    if (selectedTokenConfig) {
      addToken(selectedTokenConfig);
    }

    // Second: Add the wrapped token of the source token, if sourceToken is defined (meaning
    // this is being rendered with destination tokens).
    if (props.sourceToken) {
      const sourceToken = config.tokens[props.sourceToken];
      if (sourceToken) {
        const destTokenKey = sourceToken.wrappedAsset;
        if (destTokenKey) {
          const destToken = props.tokenList?.find(
            (t) =>
              t.key === destTokenKey &&
              // Only add the wrapped token if it actually exists on the destination chain
              !!getTokenBridgeWrappedTokenAddressSync(
                t,
                selectedChainConfig.key,
              ),
          );
          if (destToken) {
            addToken(destToken);
          }
        }
      }
    }

    // Third: Add the native gas token, if not previously selected
    if (
      nativeTokenConfig &&
      nativeTokenConfig.key !== selectedTokenConfig?.key
    ) {
      addToken(nativeTokenConfig);
    }

    // Fourth: Add tokens with a balances in the connected wallet
    Object.entries(balances).forEach(([key, val]) => {
      if (val?.balance && Number(val.balance) > 0) {
        const tokenConfig = props.tokenList?.find((t) => t.key === key);
        const tokenNotAdded = !tokens.find(
          (addedToken) => addedToken.key === key,
        );

        if (tokenConfig && tokenNotAdded) {
          addToken(tokenConfig);
        }
      }
    });

    // Finally: If no wallet is connected, fill up any remaining space from supported tokens
    if (!props.wallet?.address) {
      props.tokenList?.forEach((t) => {
        // Adding remaining tokens
        if (!tokenSet.has(t.key)) {
          addToken(t);
        }
      });
    }

    return tokens;
  }, [balances, props.tokenList, props.sourceToken]);

  const noTokensMessage = useMemo(
    () => (
      <Typography variant="body2" color={theme.palette.grey.A400}>
        No supported tokens found in wallet
      </Typography>
    ),
    [],
  );

  const shouldShowEmptyMessage =
    sortedTokens.length === 0 && !isFetchingTokenBalances && !props.isFetching;

  const searchList = (
    <SearchableList<TokenConfig>
      searchPlaceholder="Search for a token"
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
      filterFn={(token, query) => {
        if (query.length === 0) return true;

        const chain = props.selectedChainConfig.key;

        // Exclude frankenstein tokens with no balance
        const balance = Number(balances?.[token.key]?.balance);
        if (isFrankensteinToken(token, chain) && !balance) {
          return false;
        }

        // Exclude wormhole-wrapped tokens with no balance
        // unless it's canonical
        if (
          props.isSource &&
          isWrappedToken(token, chain) &&
          !isCanonicalToken(token, chain) &&
          !balance
        ) {
          return false;
        }

        const queryLC = query.toLowerCase();

        const symbolMatch = token.symbol?.toLowerCase().includes(queryLC);
        if (symbolMatch) return true;

        const displayNameMatch = getDisplayName(token, chain)
          .toLowerCase()
          .includes(queryLC);
        if (displayNameMatch) return true;

        const tokenAddress = isWrappedToken(token, chain)
          ? getTokenBridgeWrappedTokenAddressSync(token, chain)?.toString()
          : token.tokenId?.address;

        const tokenAddressMatch = tokenAddress?.toLowerCase().includes(queryLC);
        if (tokenAddressMatch) return true;

        return false;
      }}
      renderFn={(token: TokenConfig) => {
        const balance = balances?.[token.key]?.balance;
        const disabled =
          props.isSource && !!props.wallet?.address && !!balances && !balance;

        return (
          <TokenItem
            key={token.key}
            token={token}
            chain={props.selectedChainConfig.key}
            disabled={disabled}
            onClick={() => {
              props.onSelectToken(token.key);
            }}
            balance={balance ?? ''}
            isFetchingBalance={isFetchingTokenBalances}
          />
        );
      }}
    />
  );

  return (
    <Card className={classes.card} variant="elevation">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.title}>Select a token</Typography>
        {searchList}
      </CardContent>
    </Card>
  );
};

export default TokenList;
