import { makeStyles } from '@mui/styles';
import React from 'react';
import { Theme } from '@mui/material';

const useStyles = makeStyles((theme: Theme) => ({
  connectTile: {
    width: '100%',
    backgroundImage: `linear-gradient(180deg, ${theme.palette.primary[900]} 0%, ${theme.palette.card.background} 100%)`,
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
  onClick: React.MouseEventHandler<HTMLDivElement>;
};

function NetworksModal(props: Props) {
  const classes = useStyles();
  return (
    <div className={classes.connectTile} onClick={props.onClick}>
      <div className={classes.connectText}>Connect wallet</div>
    </div>
  );
}

export default NetworksModal;
