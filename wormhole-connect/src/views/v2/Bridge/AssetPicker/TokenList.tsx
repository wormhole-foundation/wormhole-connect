import React, { useMemo, useState } from 'react';
import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

import SearchIcon from '@mui/icons-material/Search';
import TokenIcon from 'icons/TokenIcons';

import config from 'config';

import { makeStyles } from 'tss-react/mui';

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
}));

type Props = {
  tokenList?: Array<TokenConfig> | undefined;
  selectedChainConfig?: ChainConfig | undefined;
  selectedToken?: string | undefined;
  wallet: WalletData;
  onClick?: any;
};

const SHORT_LIST_SIZE = 5;

const TokenList = (props: Props) => {
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');

  const { classes } = useStyles();

  const theme = useTheme();

  const topTokens = useMemo(() => {
    const { selectedToken } = props;
    const selectedTokenConfig = selectedToken
      ? config.tokens[selectedToken]
      : undefined;
    const tokens: Array<TokenConfig> = selectedTokenConfig
      ? [selectedTokenConfig]
      : [];
    props.tokenList?.forEach((t) => {
      if (
        tokens.length < SHORT_LIST_SIZE &&
        t.key !== selectedTokenConfig?.key
      ) {
        tokens.push(t);
      }
    });
    return tokens;
  }, [props.tokenList]);

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
        {tokens?.map((token: TokenConfig, i: number) => {
          const nativeChainConfig = config.chains[token.nativeChain];
          const nativeChain = nativeChainConfig?.displayName || '';
          return (
            <ListItemButton
              key={token.key}
              dense
              sx={{
                display: 'flex',
                flexDirection: 'row',
              }}
              onClick={() => {
                props.onClick?.(token.key);
              }}
            >
              <ListItemIcon>
                <TokenIcon icon={token.icon} height={32} />
              </ListItemIcon>
              <div>
                <Typography fontSize={16}>{token.symbol}</Typography>
                <Typography fontSize={10}>{nativeChain}</Typography>
              </div>
            </ListItemButton>
          );
        })}
      </List>
    );
  }, [tokenSearchQuery, topTokens]);

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
