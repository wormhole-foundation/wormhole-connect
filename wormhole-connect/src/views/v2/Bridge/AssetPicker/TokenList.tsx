import React, { useMemo, useState } from 'react';
import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import useGetTokenBalances from 'hooks/useGetTokenBalances';
import TokenIcon from 'icons/TokenIcons';

import type { ChainConfig, TokenConfig } from 'config/types';
import type { WalletData } from 'store/wallet';

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
  tokenListItem: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  tokenDetails: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
}));

type Props = {
  tokenList?: Array<TokenConfig> | undefined;
  isFetching?: boolean;
  selectedChainConfig?: ChainConfig | undefined;
  selectedToken?: string | undefined;
  wallet: WalletData;
  onClick?: (key: string) => void;
};

const SHORT_LIST_SIZE = 5;

const TokenList = (props: Props) => {
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');

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

  const searchList = useMemo(() => {
    const tokens = tokenSearchQuery
      ? props.tokenList?.filter((t: TokenConfig) => {
          const query = tokenSearchQuery.toLowerCase();
          return (
            t.symbol?.toLowerCase().includes(query) ||
            t.displayName?.toLowerCase().includes(query)
          );
        })
      : topTokens;

    return (
      <List>
        <ListItem>
          <TextField
            autoFocus
            fullWidth
            inputProps={{
              style: {
                fontSize: 12,
              },
            }}
            placeholder="Search for a token"
            size="small"
            variant="outlined"
            onChange={(e) => setTokenSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </ListItem>
        {props.selectedChainConfig && (
          <ListItem>
            <Typography
              fontSize={14}
              color={theme.palette.text.secondary}
            >{`Tokens on ${props.selectedChainConfig.displayName}`}</Typography>
          </ListItem>
        )}
        {props.isFetching ? (
          <ListItemButton className={classes.tokenListItem} dense>
            <CircularProgress />
          </ListItemButton>
        ) : (
          tokens?.map((token: TokenConfig, i: number) => {
            const nativeChainConfig = config.chains[token.nativeChain];
            const nativeChain = nativeChainConfig?.displayName || '';
            const balance = balances?.[token.key]?.balance;

            return (
              <ListItemButton
                key={token.key}
                className={classes.tokenListItem}
                dense
                disabled={!!props.wallet?.address && !!balances && !balance}
                onClick={() => {
                  props.onClick?.(token.key);
                }}
              >
                <div className={classes.tokenDetails}>
                  <ListItemIcon>
                    <TokenIcon icon={token.icon} height={32} />
                  </ListItemIcon>
                  <div>
                    <Typography fontSize={16}>{token.symbol}</Typography>
                    <Typography
                      fontSize={10}
                      color={theme.palette.text.secondary}
                    >
                      {nativeChain}
                    </Typography>
                  </div>
                </div>
                <Typography fontSize={14}>
                  {isFetchingTokenBalances ? (
                    <CircularProgress size={24} />
                  ) : (
                    balance
                  )}
                </Typography>
              </ListItemButton>
            );
          })
        )}
      </List>
    );
  }, [
    isFetchingTokenBalances,
    balances,
    props.isFetching,
    tokenSearchQuery,
    topTokens,
  ]);

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
