import { makeStyles } from '@mui/styles';
import React from 'react';
import { Theme } from '@mui/material';
import NoNetworkIcon from '../icons/no-network.png'

const useStyles = makeStyles((theme: Theme) => ({
  connectTile: {
    width: '100%',
    backgroundImage: `linear-gradient(180deg, ${theme.palette.primary[800] + 'b0'} 0%, ${theme.palette.primary[800] + '50'} 100%)`,
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    height: '48px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  connectText: {
    fontSize: '14px',
  },
}));

type Props = {
  // title: string
};

function NetworksModal(props: Props) {
  const classes = useStyles();
  return (
    <div className={classes.connectTile}>
      <div className={classes.connectText}>Connect wallet</div>
    </div>
  );
}

export default NetworksModal;
