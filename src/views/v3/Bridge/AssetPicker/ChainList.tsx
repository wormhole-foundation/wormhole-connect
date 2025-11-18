import React, { useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';

import ChainIcon from 'icons/ChainIcons';
import SearchableList from 'views/v3/Bridge/AssetPicker/SearchableList';
import ChainShortList from 'views/v3/Bridge/AssetPicker/ChainShortList';

import type { Chain } from '@wormhole-foundation/sdk';
import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';

type Props = {
  chainList?: ChainConfig[];
  selectedChainConfig?: ChainConfig;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  wallet: WalletData;
  onChainSelect: (chain: Chain) => void;
};

const SHORT_LIST_SIZE = 10; // including "other" button

function ChainList(props: Props) {
  const theme = useTheme();
  const [chainSearchQuery, setChainSearchQuery] = useState('');

  const styles = useMemo(
    () => ({
      card: {
        background: theme.palette.input.background,
        maxWidth: '488px',
        [theme.breakpoints.down('sm')]: {
          width: '100vw',
          minHeight: '194px', // Ensure enough height for 2-row chain grid on mobile
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
        fontSize: '24px',
        fontWeight: 600,
        lineHeight: '32px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      chainSearchList: {
        maxHeight: '516px',
        [theme.breakpoints.down('sm')]: {
          maxHeight: '640px',
        },
      },
      chainSearchItem: {
        display: 'flex',
        flexDirection: 'row' as const,
        padding: '8px',
        borderRadius: '8px',
      },
      chainIcon: {
        borderRadius: '100%',
        width: '24px',
        height: '24px',
        overflow: 'hidden',
        pointerEvents: 'none',
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
      selectedChainIndex >= SHORT_LIST_SIZE - 1 // Subtract 1 to account for "other" button
    ) {
      return [selectedChainConfig, ...allChains.slice(0, SHORT_LIST_SIZE - 2)];
    }

    return allChains.slice(0, SHORT_LIST_SIZE - 1); // Leave room for "other" button
  }, [chainList, selectedChainConfig]);

  const showMoreButton = (chainList?.length ?? 0) > SHORT_LIST_SIZE - 1;

  const searchList = useMemo(
    () => (
      <SearchableList<ChainConfig>
        searchPlaceholder="Search for a chain"
        sx={styles.chainSearchList}
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
            sx={styles.chainSearchItem}
            onClick={() => {
              onChainSelect(chain.sdkName);
              setShowSearch(false);
            }}
          >
            <ListItemIcon sx={{ minWidth: '50px' }}>
              <Box sx={styles.chainIcon}>
                <ChainIcon icon={chain.icon} height={24} />
              </Box>
            </ListItemIcon>
            <Typography fontSize="16px" fontWeight={500}>
              {chain.displayName}
            </Typography>
          </ListItemButton>
        )}
      />
    ),
    [
      styles.chainSearchList,
      styles.chainSearchItem,
      styles.chainIcon,
      chainList,
      chainSearchQuery,
      onChainSelect,
      setShowSearch,
    ],
  );

  if (topChains.length < 1) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', paddingY: 5 }}>
        <Typography>No available chains</Typography>
      </Box>
    );
  }

  return (
    <Card sx={styles.card} variant="elevation">
      <CardContent sx={styles.cardContent}>
        <Typography
          fontSize="14px"
          fontWeight={500}
          paddingBottom="16px"
          role="heading"
          aria-level={3}
        >
          Choose network
        </Typography>
        {showSearch ? (
          searchList
        ) : (
          <ChainShortList
            chains={topChains}
            selectedChain={selectedChainConfig}
            showMoreButton={showMoreButton}
            onChainSelect={onChainSelect}
            onShowMore={() => setShowSearch(true)}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(ChainList);
