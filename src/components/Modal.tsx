import React from 'react';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  title: {},
}));

function Modal() {
  const classes = useStyles();
  return <div className={classes.title}></div>;
}

export default Modal;
