import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { OPACITY } from 'utils/style';

const useStyles = makeStyles<{ blendColor: string }>()(
  (theme, { blendColor }) => ({
    anchor: {
      position: 'relative',
      width: '100%',
    },
    scrollContainer: {
      width: '100%',
      height: 'calc(100% - 48px)',
      overflowY: 'scroll',
      overflowX: 'hidden',
      padding: 0,
    },
    fadeOverlay: {
      position: 'absolute',
      left: '0',
      right: '0',
      bottom: '0',
      height: '40px',
      zIndex: '5',
      backgroundImage: `linear-gradient(${blendColor + OPACITY[0]} 0%, ${
        blendColor + OPACITY[100]
      } 100%)`,
      pointerEvents: 'none',
    },
    fadeOverlayTop: {
      position: 'absolute',
      left: '0',
      right: '0',
      top: '0',
      height: '8px',
      zIndex: '5',
      backgroundImage: `linear-gradient(${blendColor + OPACITY[100]} 0%, ${
        blendColor + OPACITY[0]
      } 100%)`,
      pointerEvents: 'none',
    },
    content: {
      padding: '8px 0 16px 0',
    },
  }),
);

type Props = {
  height: string;
  blendColor: string;
  children: JSX.Element | JSX.Element[];
};

function Scroll(props: Props) {
  const { classes } = useStyles({ blendColor: props.blendColor });
  return (
    <div className={classes.anchor}>
      <div
        className={classes.scrollContainer}
        style={{ maxHeight: props.height }}
      >
        <div className={classes.fadeOverlayTop} />
        <div className={classes.fadeOverlay} />
        <div className={classes.content}>{props.children}</div>
      </div>
    </div>
  );
}

export default Scroll;
