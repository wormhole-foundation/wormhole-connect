import React from 'react';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  title: {},
}));

function Header(props: { title: string }) {
  const classes = useStyles();
  return <div className={classes.title}>{props.title}</div>;
}

export default Header;
