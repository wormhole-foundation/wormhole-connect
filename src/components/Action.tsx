import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { joinClass } from '../utils/style';
import { keyframes } from '@mui/system';

const middle = keyframes`
  0% {
    opacity: 0.6;
  } 60% {
    width: 18px;
    height: 18px;
    opacity: 0.4;
  } 95% {
    width: 22px;
    height: 22px;
    opacity: 0 !important;
  } 100% {
    opacity: 0;
  }
`;

const outer = keyframes`
  0% {
    opacity: 0.5;
  } 60% {
    width: 26px;
    height: 26px;
    opacity: 0.2;
  } 95% {
    width: 34px;
    height: 34px;
    opacity: 0 !important;
  } 100% {
    opacity: 0;
  }
`;

const useStyles = makeStyles()((theme) => ({
  container: {
    position: 'relative',
    width: '32px',
    height: '32px',
  },
  baseCircle: {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
    margin: 'auto',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: theme.palette.button.action,
  },
  middle: {
    animation: `${middle} 1.5s ease-out infinite`,
  },
  outer: {
    animation: `${outer} 1.5s ease-out infinite`,
  },
}));

function ActionIndicator() {
  const { classes } = useStyles();
  return (
    <div>
      <div className={classes.container}>
        <div className={classes.baseCircle} />
        <div className={joinClass([classes.baseCircle, classes.middle])} />
        <div className={joinClass([classes.baseCircle, classes.outer])} />
      </div>
    </div>
  );
}

export default ActionIndicator;
