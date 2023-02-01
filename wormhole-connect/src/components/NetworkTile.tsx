import { makeStyles } from '@mui/styles';
import React from 'react';
import { Theme } from '@mui/material';
import { ChainConfig } from '../sdk/types';
import TokenIcon from '../icons/components/TokenIcons';

const useStyles = makeStyles((theme: Theme) => ({
  networkTile: {
    backgroundColor: theme.palette.card.secondary,
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    width: '100%',
    maxWidth: '152px',
    height: '152px',
    cursor: 'pointer',
    marginRight: '8px',
  },
  networkIcon: {
    width: '56px',
    height: '56px',
  },
  networkHeader: {
    fontSize: '16px',
    opacity: '60%',
  },
  networkName: {
    fontSize: '16px',
  },
}));

type Props = {
  network?: ChainConfig;
  onClick: React.MouseEventHandler<HTMLDivElement>;
};

function NetworksTile(props: Props) {
  const classes = useStyles();
  return props.network ? (
    <div className={classes.networkTile} onClick={props.onClick}>
      <div className={classes.networkHeader}>Network</div>
      <TokenIcon name={props.network.icon} height={56} />
      <div className={classes.networkName}>{props.network.displayName}</div>
    </div>
  ) : (
    <div className={classes.networkTile} onClick={props.onClick}>
      <TokenIcon name="no network" height={56} />
      <div className={classes.networkName}>Select network</div>
    </div>
  );
}

export default NetworksTile;
