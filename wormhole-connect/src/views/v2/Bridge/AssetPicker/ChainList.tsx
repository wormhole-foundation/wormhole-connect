import React, { useMemo } from 'react';
import { makeStyles } from 'tss-react/mui';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ChainIcon from 'icons/ChainIcons';
import PlusIcon from 'icons/Plus';

import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v2/Bridge/AssetPicker/SearchableList';

import { Chain } from '@wormhole-foundation/sdk';
import { useMediaQuery, useTheme } from '@mui/material';

const useStyles = makeStyles()((theme) => ({
  card: {
    width: '420px',
    [theme.breakpoints.down('sm')]: {
      maxWidth: '420px',
      width: '360px',
    },
    '@media (max-width: 366px)': {
      width: '330px',
    },
  },
  cardContent: {
    paddingBottom: 0,
    [theme.breakpoints.down('sm')]: {
      padding: '16px 10px',
      ':last-child': {
        padding: '16px 10px',
      },
    },
  },
  title: {
    fontSize: '14px',
    marginBottom: '12px',
  },
  chainSearch: {
    maxHeight: '400px',
  },
  chainButton: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px',
    border: '1px solid transparent',
    borderRadius: '8px',
    '&.Mui-selected': {
      border: '1px solid',
      borderColor: theme.palette.primary.main,
    },
  },
  chainItem: {
    display: 'flex',
    flexDirection: 'row',
    padding: '8px',
    borderRadius: '8px',
  },
}));

type Props = {
  chainList?: ChainConfig[];
  selectedChainConfig?: ChainConfig;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  wallet: WalletData;
  onChainSelect: (chain: Chain) => void;
};

const SHORT_LIST_SIZE = 5;
const SHORT_LIST_SIZE_MOBILE = 4;

const ChainList = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    chainList,
    selectedChainConfig,
    showSearch,
    setShowSearch,
    onChainSelect,
  } = props;

  const topChains = useMemo(() => {
    const allChains = chainList ?? [];
    const selectedChain = selectedChainConfig;

    // Find the selected chain in supported chains
    const selectedChainIndex = allChains.findIndex((chain) => {
      return chain.key === selectedChain?.key;
    });
    const shortListSize = mobile ? SHORT_LIST_SIZE_MOBILE : SHORT_LIST_SIZE;
    // If the selected chain is outside the top list, we add it to the top;
    // otherwise we do not change its index in the top list
    if (
      selectedChain &&
      selectedChainIndex &&
      selectedChainIndex >= shortListSize
    ) {
      return [selectedChain, ...allChains.slice(0, shortListSize - 1)];
    }

    return allChains.slice(0, shortListSize);
  }, [mobile, chainList, selectedChainConfig]);

  const shortList = useMemo(() => {
    return (
      <List component={Stack} direction="row">
        {topChains.map((chain: ChainConfig) => (
          <Tooltip key={chain.key} title={chain.displayName}>
            <ListItemButton
              selected={selectedChainConfig?.key === chain.key}
              className={classes.chainButton}
              onClick={() => onChainSelect(chain.key)}
            >
              <ChainIcon icon={chain.icon} />
              <Typography
                fontSize="12px"
                lineHeight="12px"
                marginTop="8px"
                whiteSpace="nowrap"
              >
                {chain.symbol}
              </Typography>
            </ListItemButton>
          </Tooltip>
        ))}
        <ListItemButton
          className={classes.chainButton}
          onClick={() => {
            setShowSearch(true);
          }}
        >
          <PlusIcon sx={{ height: '36px', width: '36px' }} />
          <Typography
            fontSize="12px"
            lineHeight="12px"
            marginTop="8px"
            whiteSpace="nowrap"
          >
            other
          </Typography>
        </ListItemButton>
      </List>
    );
  }, [
    classes.chainButton,
    onChainSelect,
    selectedChainConfig?.key,
    setShowSearch,
    topChains,
  ]);

  const searchList = useMemo(
    () => (
      <SearchableList<ChainConfig>
        searchPlaceholder="Search for a chain"
        className={classes.chainSearch}
        items={chainList ?? []}
        filterFn={(chain, query) =>
          !query ||
          chain.displayName.toLowerCase().includes(query.toLowerCase())
        }
        renderFn={(chain) => (
          <ListItemButton
            key={chain.key}
            dense
            className={classes.chainItem}
            onClick={() => {
              onChainSelect(chain.key);
              setShowSearch(false);
            }}
          >
            <ListItemIcon sx={{ minWidth: '50px' }}>
              <ChainIcon icon={chain.icon} height={36} />
            </ListItemIcon>
            <Typography fontSize="16px" fontWeight={500}>
              {chain.displayName}
            </Typography>
          </ListItemButton>
        )}
      />
    ),
    [
      chainList,
      classes.chainItem,
      classes.chainSearch,
      onChainSelect,
      setShowSearch,
    ],
  );

  return (
    <Card className={classes.card} variant="elevation">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.title} fontSize="16px" fontWeight={500}>
          Select a network
        </Typography>
        {showSearch ? searchList : shortList}
      </CardContent>
    </Card>
  );
};

export default ChainList;
