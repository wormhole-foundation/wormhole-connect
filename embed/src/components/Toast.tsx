import React from 'react';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  title: {},
}));

function Toast() {
  const classes = useStyles();
  return <div className={classes.title}></div>;
}

export default Toast;
