import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import { ExplorerConfig } from 'config/types';

const useStyles = makeStyles()((theme: any) => ({
  dropdownItem: {
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.popover.secondary,
    },
  },
}));

type ExplorerLinkProps = {
  address: string;
} & ExplorerConfig;

// Renders the link of a chain explorer
const ExplorerLink = (props: ExplorerLinkProps) => {
  const { address, href, target = '_blank', label = 'Transactions' } = props;

  const { classes } = useStyles();

  const handleOpenExplorer = useCallback(
    () => window.open(href.replace('{:address}', address), target),
    [address, href, target],
  );

  return (
    <div className={classes.dropdownItem} onClick={handleOpenExplorer}>
      {label}
    </div>
  );
};

export default ExplorerLink;
