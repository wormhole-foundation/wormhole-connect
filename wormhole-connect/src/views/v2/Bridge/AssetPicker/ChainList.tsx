import React, { useMemo, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import TokenIcon from 'icons/TokenIcons';

import config from 'config';

import { makeStyles } from 'tss-react/mui';

import { isDisabledChain, selectChain } from 'store/transferInput';

import type { ChainConfig } from 'config/types';
import type { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import type { WalletData } from 'store/wallet';

const useStyles = makeStyles()((theme) => ({
  card: {
    width: '420px',
  },
  cardContent: {
    paddingBottom: 0,
  },
  title: {
    fontSize: 14,
    marginBottom: '8px',
  },
}));

type Props = {
  chainList?: Array<ChainConfig> | undefined;
  selectedChain?: ChainName | undefined;
  showSearch: boolean;
  onShowSearch: any;
  wallet: WalletData;
  onClick?: any;
};

const ChainList = (props: Props) => {
  const [chainSearchQuery, setChainSearchQuery] = useState('');

  const { classes } = useStyles();

  // Gets the config for the currently selected chain
  const selectedChainConfig = useMemo(() => {
    return props.selectedChain ? config.chains[props.selectedChain] : undefined;
  }, [props.selectedChain]);

  const topChains = useMemo(() => {
    // Put the selected chain at the top of the list
    const chains: Array<ChainConfig> = selectedChainConfig
      ? [selectedChainConfig]
      : [];

    props.chainList?.forEach((c) => {
      if (chains.length < 6 && c.key !== selectedChainConfig?.key) {
        chains.push(c);
      }
    });
    return chains;
  }, [props.chainList, selectedChainConfig]);

  const shortList = useMemo(() => {
    return (
      <List component={Stack} direction="row">
        {topChains.map((chain: ChainConfig, i: number) => {
          if (React.isValidElement(chain)) {
            return chain;
          }

          const disabled = isDisabledChain(chain.key, props.wallet);

          return (
            <ListItemButton
              key={i}
              disabled={disabled}
              selected={props.selectedChain === chain.key}
              sx={{
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={() => props.onClick?.(chain.key)}
            >
              <TokenIcon icon={chain.icon} height={32} />
              <Typography fontSize={14}>{chain.displayName}</Typography>
            </ListItemButton>
          );
        })}
        <ListItemButton
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={() => {
            props.onShowSearch(true);
          }}
        >
          <IconButton
            sx={{
              width: 32,
              height: 32,
              backgroundColor: 'transparent',
            }}
          >
            <AddIcon />
          </IconButton>
          <Typography fontSize={12}>other</Typography>
        </ListItemButton>
      </List>
    );
  }, [topChains, selectChain]);

  const searchList = useMemo(() => {
    const chains = chainSearchQuery
      ? props.chainList?.filter((c: any) => {
          return c.displayName
            ?.toLowerCase()
            .includes(chainSearchQuery.toLowerCase());
        })
      : topChains;

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
            placeholder="Search for a network"
            size="small"
            variant="outlined"
            onChange={(e) => setChainSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </ListItem>
        {chains?.map((chain: any, i: number) => {
          const disabled = isDisabledChain(chain.key, props.wallet);
          return (
            <ListItemButton
              dense
              disabled={disabled}
              sx={{
                display: 'flex',
                flexDirection: 'row',
              }}
              onClick={() => {
                props.onClick?.(chain.key);
                props.onShowSearch?.(false);
              }}
            >
              <ListItemIcon>
                <TokenIcon icon={chain.icon} height={32} />
              </ListItemIcon>
              <Typography fontSize={14}>{chain.displayName}</Typography>
            </ListItemButton>
          );
        })}
      </List>
    );
  }, [chainSearchQuery, topChains]);

  return (
    <Card className={classes.card} variant="elevation">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.title}>Select a network</Typography>
        {props.showSearch ? searchList : shortList}
      </CardContent>
    </Card>
  );
};

export default ChainList;
