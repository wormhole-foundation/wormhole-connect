import React, { useMemo } from 'react';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import { useTheme } from '@mui/material/styles';

import ChainIcon from 'icons/ChainIcons';
import TokenIcon from 'icons/TokenIcons';

import type { ChainConfig } from 'config/types';
import type { Token } from 'config/tokens';

type Props = {
  chainConfig?: ChainConfig;
  token?: Token;
};

function AssetBadge(props: Props) {
  const theme = useTheme();
  const { chainConfig, token } = props;

  const styles = useMemo(
    () => ({
      badgeContent: {
        border: `2px solid ${theme.palette.input.background}`,
        borderRadius: '4px',
      },
    }),
    [theme],
  );

  return (
    <Badge
      badgeContent={
        <Box sx={styles.badgeContent}>
          <ChainIcon icon={chainConfig?.icon} height={13} />
        </Box>
      }
      sx={{
        zIndex: 0,
        height: '34px',
        marginRight: '8px',
        '& .MuiBadge-badge': {
          right: 0,
          top: 30,
        },
      }}
    >
      <TokenIcon
        icon={token?.icon}
        style={{ width: '34px', height: '34px' }}
        containerStyle={{ width: '34px', height: '34px' }}
      />
    </Badge>
  );
}

export default AssetBadge;
