import { makeStyles } from '@mui/styles';
import React from 'react';
import { Theme } from '@mui/material';
import { ChainConfig } from '@wormhole-foundation/wormhole-connect-sdk';
import TokenIcon from '../../icons/components/TokenIcons';
import { ERROR_BORDER, joinClass } from '../../utils/style';

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
    maxWidth: '158px',
    height: '158px',
    cursor: 'pointer',
    marginRight: '8px',
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
    },
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
  network?: ChainConfig;
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
