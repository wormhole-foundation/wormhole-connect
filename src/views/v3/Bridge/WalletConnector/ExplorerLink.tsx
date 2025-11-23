import React, { useCallback } from 'react';

import type { ExplorerConfig } from 'config/ui';
import type { SxProps, Theme } from '@mui/material';
import { ListItemButton, ListItemIcon, Typography } from '@mui/material';
import { ExternalLinkIcon } from 'lucide-react';

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
      <Typography>{label}</Typography>
      <ListItemIcon>
        <ExternalLinkIcon size={14} />
      </ListItemIcon>
    </ListItemButton>
  );
};

export default ExplorerLink;
