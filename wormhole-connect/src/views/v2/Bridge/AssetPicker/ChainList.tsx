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

import { makeStyles } from 'tss-react/mui';

import { isDisabledChain } from 'store/transferInput';

import type { ChainConfig } from 'config/types';
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
  selectedChainConfig?: ChainConfig | undefined;
  showSearch: boolean;
  setShowSearch: any;
  wallet: WalletData;
  onClick?: any;
};

const SHORT_LIST_SIZE = 5;

const ChainList = (props: Props) => {
  const [chainSearchQuery, setChainSearchQuery] = useState('');

  const { classes } = useStyles();

  const topChains = useMemo(() => {
    const chains: Array<ChainConfig> = [];
    const { chainList = [] } = props;

    // Find the selected chain in supported chains
    const selectedChainIndex = props.chainList?.findIndex((c) => {
      return c.key === props.selectedChainConfig?.key;
    });

    // If the selected chain is outside the top list, we add it to the top;
    // otherwise we do not change its index in the top list
    if (
      props.selectedChainConfig &&
      selectedChainIndex &&
      selectedChainIndex >= SHORT_LIST_SIZE
    ) {
      return chains.concat(
        [props.selectedChainConfig],
        chainList.slice(0, SHORT_LIST_SIZE - 1),
      );
    }

    return chains.concat(chainList.slice(0, SHORT_LIST_SIZE));
  }, [props.chainList, props.selectedChainConfig]);

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
              selected={props.selectedChainConfig?.key === chain.key}
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
            props.setShowSearch?.(true);
          }}
        >
          <IconButton
            sx={{
              width: 32,
              height: 32,
              '&:hover': {
                // removing the hover effect, which the parent ListItemButton already has
                backgroundColor: 'unset',
              },
            }}
          >
            <AddIcon />
          </IconButton>
          <Typography fontSize={12}>other</Typography>
        </ListItemButton>
      </List>
    );
  }, [topChains]);

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
                props.setShowSearch?.(false);
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
        <Typography className={classes.title} fontSize={14}>
          Select a network
        </Typography>
        {props.showSearch ? searchList : shortList}
      </CardContent>
    </Card>
  );
};

export default ChainList;
