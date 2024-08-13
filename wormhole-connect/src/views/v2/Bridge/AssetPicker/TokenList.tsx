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

import SearchableList from './SearchableList';
import TokenItem from './TokenItem';

const useStyles = makeStyles()((theme) => ({
  card: {
    width: '420px',
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
  tokenList?: Array<TokenConfig> | undefined;
  isFetching?: boolean;
  selectedChainConfig?: ChainConfig | undefined;
  selectedToken?: string | undefined;
  wallet: WalletData;
  onSelectToken: (key: string) => void;
};

const SHORT_LIST_SIZE = 5;

const TokenList = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();

  const { isFetching: isFetchingTokenBalances, balances } = useGetTokenBalances(
    props.wallet?.address || '',
    props.selectedChainConfig?.key,
    props.tokenList || [],
  );

  const topTokens = useMemo(() => {
    const { selectedToken, selectedChainConfig } = props;

    const selectedTokenConfig = selectedToken
      ? config.tokens[selectedToken]
      : undefined;

    const nativeTokenConfig = props.tokenList?.find(
      (t) => t.key === selectedChainConfig?.gasToken,
    );

    // First: Add previously selected token at the top of the list
    const tokens: Array<TokenConfig> = selectedTokenConfig
      ? [selectedTokenConfig]
      : [];

    // Second: Add the native token, if not previously selected
    if (
      nativeTokenConfig &&
      nativeTokenConfig.key !== selectedTokenConfig?.key
    ) {
      tokens.push(nativeTokenConfig);
    }

    // Third: Add tokens with a balances in the connected wallet
    Object.entries(balances).forEach(([key, val]) => {
      if (Number(val?.balance) > 0) {
        const tokenConfig = props.tokenList?.find((t) => t.key === key);
        const tokenNotAdded = !tokens.find(
          (addedToken) => addedToken.key === key,
        );

        if (tokenConfig && tokenNotAdded && tokens.length < SHORT_LIST_SIZE) {
          tokens.push(tokenConfig);
        }
      }
    });

    // Fourth: Fill up any remaining space from supported tokens
    props.tokenList?.forEach((t) => {
      const tokenNotAdded = !tokens.find(
        (addedToken) => addedToken.key === t.key,
      );

      if (tokens.length < SHORT_LIST_SIZE && tokenNotAdded) {
        tokens.push(t);
      }
    });

    return tokens;
  }, [balances, props.tokenList]);

  const searchList = (
    <SearchableList<TokenConfig>
      searchPlaceholder="Search for a token"
      className={classes.tokenList}
      listTitle={
        props.selectedChainConfig && (
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
      initialItems={topTokens}
      items={props.tokenList ?? []}
      filterFn={(token, query) => {
        if (query.length === 0) return true;
        const queryLC = query.toLowerCase();
        return Boolean(
          token.symbol?.toLowerCase().includes(queryLC) ||
            token.displayName?.toLowerCase().includes(queryLC),
        );
      }}
      renderFn={(token: TokenConfig) => {
        const balance = balances?.[token.key]?.balance;
        const disabled = !!props.wallet?.address && !!balances && !balance;

        return (
          <TokenItem
            key={token.key}
            token={token}
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
