import { makeStyles } from '@mui/styles';
import React from 'react';
import { Theme } from '@mui/material';
import TokenIcon from '../../icons/TokenIcons';
import { ERROR_BORDER, joinClass } from '../../utils/style';
import { NetworkConfig } from '../../config/types';

const useStyles = makeStyles((theme: Theme) => ({
  networkTile: {
    backgroundColor: theme.palette.card.secondary,
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    marginRight: '8px',
    textAlign: 'center',
  },
  networkNone: {
    justifyContent: 'center',
    gap: '16px',
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
  error: ERROR_BORDER(theme),
}));

type Props = {
  network?: NetworkConfig;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  error?: boolean;
};

function NetworksTile(props: Props) {
  const classes = useStyles();
  return props.network ? (
    <div
      className={joinClass([
        classes.networkTile,
        !!props.error && classes.error,
      ])}
      onClick={props.onClick}
    >
      <div className={classes.networkHeader}>Network</div>
      <TokenIcon name={props.network.icon} height={56} />
      <div className={classes.networkName}>{props.network.displayName}</div>
    </div>
  ) : (
    <div
      className={joinClass([
        classes.networkTile,
        classes.networkNone,
        !!props.error && classes.error,
      ])}
      onClick={props.onClick}
    >
      <TokenIcon name="no network" height={56} />
      <div className={classes.networkName}>Select network</div>
    </div>
  );
}

export default NetworksTile;
