import React from 'react';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  title: {},
}));

function Expandable() {
  const classes = useStyles();
  return <div className={classes.title}></div>;
}

export default Expandable;
