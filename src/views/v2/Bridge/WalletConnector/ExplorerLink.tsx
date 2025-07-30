import React, { useCallback } from 'react';

import type { ExplorerConfig } from 'config/ui';
import type { SxProps, Theme } from '@mui/material';
import { ListItemButton, Typography } from '@mui/material';

type ExplorerLinkProps = {
  address: string;
  sx?: SxProps<Theme>;
} & ExplorerConfig;

// Renders the link of a chain explorer
const ExplorerLink = (props: ExplorerLinkProps) => {
  const {
    address,
    href,
    target = '_blank',
    label = 'Transactions',
    sx,
  } = props;

  const handleOpenExplorer = useCallback(
    () => window.open(href.replace('{:address}', address), target),
    [address, href, target],
  );

  return (
    <ListItemButton onClick={handleOpenExplorer} sx={sx}>
      <Typography fontSize={14}>{label}</Typography>
    </ListItemButton>
  );
};

export default ExplorerLink;
