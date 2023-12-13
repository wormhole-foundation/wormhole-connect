import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { OPACITY } from '../../utils/style';
import { THEME } from 'config';

const colors = {
  bg: '#030712',
  purple: '#3B234E',
  blue: '#302A60',
  pink: '#5A1E46',
};

const useStyles = makeStyles()(() => ({
  container: {
    backgroundColor: `${colors.bg} !important`,
    width: '100%',
    minHeight: '100vh',
    height: '100%',
    zIndex: '-2',
  },
  bg: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  circles: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minWidth: '600px',
    height: '100%',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overscrollBehaviorY: 'none',
    backgroundImage: `url(circles.svg)`,
    backgroundPosition: 'top center',
    backgroundRepeat: 'repeat-y',
    backgroundSize: '120%',
    zIndex: '-1',
    pointerEvent: 'none',
  },
  background: {
    position: 'absolute',
    width: '100%',
    minWidth: '600px',
    height: '100%',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    zIndex: '-2',
    pointerEvent: 'none',
  },
  gradientRight: {
    position: 'absolute',
    top: '72px',
    right: '-1000px',
    width: '1757px',
    minWidth: '600px',
    height: '1506px',
    background: `radial-gradient(closest-side at 50% 50%, ${colors.blue} 0%, ${colors.blue}00 100%)`,
    opacity: '0.5',
    transform: 'matrix(0.87, 0.48, -0.48, 0.87, 0, 0)',
    zIndex: '-1',
    pointerEvent: 'none',
  },
  gradientLeft: {
    top: '-530px',
    left: '-350px',
    width: '1379px',
    minWidth: '600px',
    height: '1378px',
    position: 'absolute',
    background: `radial-gradient(closest-side at 50% 50%, ${colors.pink}${OPACITY[60]} 0%, ${colors.pink}00 100%)`,
    opacity: '0.5',
    zIndex: '-1',
    pointerEvent: 'none',
  },
  gradientLeft2: {
    bottom: '-330px',
    left: '-350px',
    width: '1379px',
    height: '1378px',
    position: 'absolute',
    background: `radial-gradient(closest-side at 50% 50%, ${colors.purple} 0%, ${colors.purple}00 100%)`,
    opacity: '0.5',
    zIndex: '-1',
    pointerEvent: 'none',
  },
  gradientRight2: {
    position: 'absolute',
    bottom: '-900px',
    right: '-1000px',
    width: '1757px',
    minWidth: '600px',
    height: '1506px',
    background: `radial-gradient(closest-side at 50% 50%, ${colors.purple} 0%, ${colors.purple}00 100%)`,
    opacity: '0.5',
    transform: 'matrix(0.87, 0.48, -0.48, 0.87, 0, 0);',
    zIndex: '-1',
    pointerEvent: 'none',
  },
  children: {
    width: '100%',
  },
}));

type Props = {
  children: JSX.Element | JSX.Element[];
};

function Background({ children }: Props) {
  const { classes } = useStyles();

  return THEME.background.default === 'wormhole' ? (
    <div className="container">
      <div className={classes.bg}>
        {children}
        <div className={classes.circles}></div>
        <div className={classes.background}></div>
        <div className={classes.gradientRight}></div>
        <div className={classes.gradientRight2}></div>
        <div className={classes.gradientLeft}></div>
        <div className={classes.gradientLeft2}></div>
      </div>
    </div>
  ) : (
    <div className={classes.children}>{children}</div>
  );
}

export default Background;
