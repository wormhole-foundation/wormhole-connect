import React from 'react';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material';

type Props = {
  height: string,
  children: JSX.Element,
}

const useStyles = makeStyles((theme: Theme) => ({
  anchor: {
    position: 'relative',
    width: '100%',
  },
  scrollContainer: {
    width: '100%',
    height: 'calc(100% - 48px)',
    overflowX: 'scroll',
    padding: 0,
  },
  fadeOverlay: {
    position: 'absolute',
    left: '0',
    right: '0',
    bottom: '0',
    height: '40px',
    zIndex: '5',
    backgroundImage: `linear-gradient(${theme.palette.primary[800] + '00'} 0%, ${theme.palette.primary[800] + 'ff'} 100%)`,
    pointerEvents: 'none',
  },
  fadeOverlayTop: {
    position: 'absolute',
    left: '0',
    right: '0',
    top: '0',
    height: '8px',
    zIndex: '5',
    backgroundImage: `linear-gradient(${theme.palette.primary[800] + 'ff'} 0%, ${theme.palette.primary[800] + '00'} 100%)`,
    pointerEvents: 'none',
  },
  content: {
    padding: '8px 0 16px 0',
  },
}));

function Scroll(props: Props) {
  const classes = useStyles();
  return (
    <div className={classes.anchor}>
      <div className={classes.scrollContainer} style={{maxHeight: props.height}}>
        <div className={classes.fadeOverlayTop} />
        <div className={classes.fadeOverlay} />
        <div className={classes.content}>
          {props.children}
        </div>
      </div>
    </div>
  );
}

export default Scroll;
