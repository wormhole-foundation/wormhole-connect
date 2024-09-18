import React, { useCallback } from 'react';

import { ExplorerConfig } from 'config/ui';
import { ListItemButton, Typography } from '@mui/material';

type ExplorerLinkProps = {
  address: string;
} & ExplorerConfig;

// Renders the link of a chain explorer
const ExplorerLink = (props: ExplorerLinkProps) => {
  const { address, href, target = '_blank', label = 'Transactions' } = props;

  const handleOpenExplorer = useCallback(
    () => window.open(href.replace('{:address}', address), target),
    [address, href, target],
  );

  return (
    <ListItemButton onClick={handleOpenExplorer}>
      <Typography fontSize={14}>{label}</Typography>
    </ListItemButton>
  );
};

export default ExplorerLink;
