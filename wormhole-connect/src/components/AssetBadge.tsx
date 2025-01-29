import React from 'react';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import { makeStyles } from 'tss-react/mui';

import ChainIcon from 'icons/ChainIcons';
import TokenIcon from 'icons/TokenIcons';

import type { ChainConfig } from 'config/types';
import { Token } from 'config/tokens';

const useStyles = makeStyles()((theme: any) => ({
  badgeContent: {
    border: `1.5px solid ${theme.palette.input.background}`,
    borderRadius: '4px',
  },
}));

type Props = {
  chainConfig?: ChainConfig;
  token?: Token;
};

function AssetBadge(props: Props) {
  const { classes } = useStyles();
  const { chainConfig, token } = props;

  return (
    <Badge
      badgeContent={
        <Box className={classes.badgeContent}>
          <ChainIcon icon={chainConfig?.icon} height={13} />
        </Box>
      }
      sx={{
        zIndex: 0,
        height: '38px', // Icon height (36px) + the distance from badge's bottom (2px)
        marginRight: '8px',
        '& .MuiBadge-badge': {
          right: 2,
          top: 32,
        },
      }}
    >
      <TokenIcon icon={token?.icon} height={36} />
    </Badge>
  );
}

export default AssetBadge;
