import React, { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import TokenIcon from 'icons/TokenIcons';

import { makeStyles } from 'tss-react/mui';

import { isDisabledChain } from 'store/transferInput';

import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import SearchableList from './SearchableList';
import { ChainName } from 'sdklegacy';

const useStyles = makeStyles()((theme) => ({
  card: {
    width: '420px',
  },
  cardContent: {
    paddingBottom: 0,
  },
  title: {
    fontSize: 14,
    marginBottom: 12,
  },
  chainSearch: {
    maxHeight: 400,
  },
  chainButton: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 8,
    '&.Mui-selected': {
      border: '1px solid #C1BBF6',
    },
  },
  chainItem: {
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
}));

type Props = {
  chainList?: ChainConfig[];
  selectedChainConfig?: ChainConfig;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  wallet: WalletData;
  onChainSelect: (chain: ChainName) => void;
};

const SHORT_LIST_SIZE = 5;

const ChainList = (props: Props) => {
  const { classes } = useStyles();

  const topChains = useMemo(() => {
    const allChains = props.chainList ?? [];
    const selectedChain = props.selectedChainConfig;

    // Find the selected chain in supported chains
    const selectedChainIndex = allChains.findIndex((chain) => {
      return chain.key === selectedChain?.key;
    });

    // If the selected chain is outside the top list, we add it to the top;
    // otherwise we do not change its index in the top list
    if (
      selectedChain &&
      selectedChainIndex &&
      selectedChainIndex >= SHORT_LIST_SIZE
    ) {
      return [selectedChain, ...allChains.slice(0, SHORT_LIST_SIZE - 1)];
    }

    return allChains.slice(0, SHORT_LIST_SIZE);
  }, [props.chainList, props.selectedChainConfig]);

  const shortList = useMemo(() => {
    return (
      <List component={Stack} direction="row" gap={1}>
        {topChains.map((chain: ChainConfig) => (
          <ListItemButton
            key={chain.key}
            disabled={isDisabledChain(chain.key, props.wallet)}
            selected={props.selectedChainConfig?.key === chain.key}
            className={classes.chainButton}
            onClick={() => props.onChainSelect(chain.key)}
          >
            <TokenIcon icon={chain.icon} height={32} />
            <Typography fontSize={12}>{chain.displayName}</Typography>
          </ListItemButton>
        ))}
        <ListItemButton
          className={classes.chainButton}
          onClick={() => {
            props.setShowSearch(true);
          }}
        >
          <AddIcon
            sx={{
              width: '32px',
              height: '32px',
            }}
          />
          <Typography fontSize={12}>other</Typography>
        </ListItemButton>
      </List>
    );
  }, [topChains]);

  const searchList = useMemo(
    () => (
      <SearchableList<ChainConfig>
        searchPlaceholder="Search for a network"
        className={classes.chainSearch}
        items={props.chainList ?? []}
        filterFn={(chain, query) =>
          !query ||
          chain.displayName.toLowerCase().includes(query.toLowerCase())
        }
        renderFn={(chain) => (
          <ListItemButton
            key={chain.key}
            dense
            disabled={isDisabledChain(chain.key, props.wallet)}
            className={classes.chainItem}
            onClick={() => {
              props.onChainSelect(chain.key);
              props.setShowSearch(false);
            }}
          >
            <ListItemIcon sx={{ minWidth: 50 }}>
              <TokenIcon icon={chain.icon} height={36} />
            </ListItemIcon>
            <Typography fontSize={16} fontWeight={500}>
              {chain.displayName}
            </Typography>
          </ListItemButton>
        )}
      />
    ),
    [props.chainList, props.wallet],
  );

  return (
    <Card className={classes.card} variant="elevation">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.title} fontSize={16} fontWeight={500}>
          Select a network
        </Typography>
        {props.showSearch ? searchList : shortList}
      </CardContent>
    </Card>
  );
};

export default ChainList;
