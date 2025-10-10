import React, { useCallback, useMemo } from 'react';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';

import ChainIcon from 'icons/ChainIcons';
import PlusIcon from 'icons/Plus';

import type { Chain } from '@wormhole-foundation/sdk';
import type { ChainConfig } from 'config/types';
import { OPACITY } from 'utils/style';

type ChainShortListProps = {
  chains: ChainConfig[];
  selectedChain?: ChainConfig;
  showMoreButton: boolean;
  onChainSelect: (chain: Chain) => void;
  onShowMore: () => void;
};

function ChainShortList({
  chains,
  selectedChain,
  showMoreButton,
  onChainSelect,
  onShowMore,
}: ChainShortListProps) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const styles = useMemo(
    () => ({
      chainButton: {
        display: 'flex',
        flexDirection: 'column' as const,
        padding: '8px',
        backgroundColor: theme.palette.primary.main + OPACITY[10],
        border: '1px solid transparent',
        borderRadius: '8px',
        width: mobile ? '56px' : '71px',
        minWidth: '56px',
        maxWidth: '71px',
        position: 'relative',
        overflow: 'hidden',
        '&.Mui-selected': {
          border: '1px solid',
          borderColor: theme.palette.primary.main,
        },
        '& svg': {
          pointerEvents: 'none',
        },
        '&:hover': {
          backgroundColor: theme.palette.primary.main + OPACITY[10],
          border: '1px solid',
          borderColor: theme.palette.primary.main,
        },
      },
      chainTileLabel: {
        color: theme.palette.text.secondary,
        fontSize: '10px',
        fontFamily: theme.typography.fontFamily,
        fontWeight: 400,
        lineHeight: '12px',
        marginTop: '8px',
        whiteSpace: 'nowrap',
      },
      chainIcon: {
        borderRadius: '100%',
        width: '24px',
        height: '24px',
        overflow: 'hidden',
        pointerEvents: 'none',
      },
    }),
    [theme, mobile],
  );

  const chainRows = useMemo(() => {
    const chainsPerRow = Math.ceil(chains.length / 2);

    const firstRowChains = chains.slice(0, chainsPerRow);
    const secondRowChains = chains.slice(chainsPerRow);

    return {
      firstRowChains,
      secondRowChains,
    };
  }, [chains]);

  const renderChainButton = useCallback(
    (chain: ChainConfig) => (
      <ListItemButton
        key={chain.sdkName}
        selected={selectedChain?.sdkName === chain.sdkName}
        sx={styles.chainButton}
        data-testid={`chain-button-${chain.sdkName.toLowerCase()}`}
        aria-label={`Select ${chain.displayName}`}
        onClick={() => onChainSelect(chain.sdkName)}
      >
        <Box sx={styles.chainIcon}>
          <ChainIcon icon={chain.icon} height={24} />
        </Box>
        <Typography sx={styles.chainTileLabel}>{chain.displayName}</Typography>
      </ListItemButton>
    ),
    [
      onChainSelect,
      selectedChain,
      styles.chainButton,
      styles.chainIcon,
      styles.chainTileLabel,
    ],
  );

  const moreButton = useMemo(
    () => (
      <ListItemButton
        key="moreButton"
        sx={styles.chainButton}
        onClick={onShowMore}
      >
        <Box sx={styles.chainIcon}>
          <PlusIcon sx={{ height: '24px', width: '24px' }} />
        </Box>
        <Typography sx={styles.chainTileLabel}>More</Typography>
      </ListItemButton>
    ),
    [onShowMore, styles.chainButton, styles.chainIcon, styles.chainTileLabel],
  );

  return (
    <Box sx={{ maxWidth: '420px' }}>
      {/* First row */}
      <Box display="flex" flexDirection="row" gap="16px" marginBottom="16px">
        {chainRows.firstRowChains.map((chain) => renderChainButton(chain))}
      </Box>
      {/* Second row */}
      {chainRows.secondRowChains.length > 0 && (
        <Box display="flex" flexDirection="row" gap="16px">
          {chainRows.secondRowChains.map((chain) => renderChainButton(chain))}
          {showMoreButton && moreButton}
        </Box>
      )}
    </Box>
  );
}

export default React.memo(ChainShortList);
