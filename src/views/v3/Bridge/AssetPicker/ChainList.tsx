import React, { useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
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
import SearchableList from 'views/v3/Bridge/AssetPicker/SearchableList';

import type { Chain } from '@wormhole-foundation/sdk';

type Props = {
  chainList?: ChainConfig[];
  selectedChainConfig?: ChainConfig;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  wallet: WalletData;
  onChainSelect: (chain: Chain) => void;
};

const SHORT_LIST_SIZE = 5;

function ChainList(props: Props) {
  const theme = useTheme();
  const [chainSearchQuery, setChainSearchQuery] = useState('');

  const styles = useMemo(
    () => ({
      card: {
        background: theme.palette.input.background,
        maxWidth: '420px',
        [theme.breakpoints.down('sm')]: {
          width: '100vw',
        },
      },
      cardContent: {
        paddingBottom: '0!important',
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
        maxHeight: '480px',
        [theme.breakpoints.down('sm')]: {
          maxHeight: '640px',
        },
      },
      chainButton: {
        display: 'flex',
        flexDirection: 'column' as const,
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
        flexDirection: 'row' as const,
        padding: '8px',
        borderRadius: '8px',
      },
    }),
    [theme],
  );

  const {
    chainList,
    selectedChainConfig,
    showSearch,
    setShowSearch,
    onChainSelect,
  } = props;

  const topChains = useMemo(() => {
    const allChains = chainList ?? [];

    // Find the selected chain in supported chains
    const selectedChainIndex = allChains.findIndex((chain) => {
      return chain.sdkName === selectedChainConfig?.sdkName;
    });
    // If the selected chain is outside the top list, we add it to the top;
    // otherwise we do not change its index in the top list
    if (
      selectedChainConfig &&
      selectedChainIndex &&
      selectedChainIndex >= SHORT_LIST_SIZE
    ) {
      return [selectedChainConfig, ...allChains.slice(0, SHORT_LIST_SIZE - 1)];
    }

    return allChains.slice(0, SHORT_LIST_SIZE);
  }, [chainList, selectedChainConfig]);

  const showMoreButton = (chainList?.length ?? 0) > SHORT_LIST_SIZE;

  const shortList = useMemo(() => {
    return (
      <List component={Stack} direction="row" data-testid="chain-short-list">
        {topChains.map((chain: ChainConfig) => (
          <Tooltip key={chain.sdkName} title={chain.displayName}>
            <ListItemButton
              selected={selectedChainConfig?.sdkName === chain.sdkName}
              sx={styles.chainButton}
              data-testid={`chain-button-${chain.sdkName.toLowerCase()}`}
              onClick={() => onChainSelect(chain.sdkName)}
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

        {showMoreButton ? (
          <ListItemButton
            sx={styles.chainButton}
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
        ) : null}
      </List>
    );
  }, [
    styles.chainButton,
    onChainSelect,
    selectedChainConfig?.sdkName,
    setShowSearch,
    showMoreButton,
    topChains,
  ]);

  const searchList = useMemo(
    () => (
      <SearchableList<ChainConfig>
        searchPlaceholder="Search for a chain"
        sx={styles.chainSearch}
        items={chainList ?? []}
        searchQuery={chainSearchQuery}
        onQueryChange={setChainSearchQuery}
        filterFn={(chain, query) =>
          !query ||
          chain.displayName.toLowerCase().includes(query.toLowerCase())
        }
        renderFn={(chain) => (
          <ListItemButton
            key={chain.sdkName}
            dense
            sx={styles.chainItem}
            onClick={() => {
              onChainSelect(chain.sdkName);
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
      chainSearchQuery,
      styles.chainItem,
      styles.chainSearch,
      onChainSelect,
      setShowSearch,
    ],
  );

  if (topChains.length < 2) {
    return null;
  }

  return (
    <Card sx={styles.card} variant="elevation">
      <CardContent sx={styles.cardContent}>
        <Typography sx={styles.title} fontSize="16px" fontWeight={500}>
          Select a network
        </Typography>
        {showSearch ? searchList : shortList}
      </CardContent>
    </Card>
  );
}

export default React.memo(ChainList);
