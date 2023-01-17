import React from 'react';
import { makeStyles } from '@mui/styles';

type Alignment = 'center' | 'left' | 'right';

const useStyles = makeStyles<{ align: Alignment }>(({ align }) => ({
  title: {
    fontSize: '32px',
    width: '100%',
    // TODO: fix issue with props
    textAlign: 'center',
  },
}));

function Header(props: { text: string; align?: Alignment }) {
  const styleProps = {
    align: props.align || 'left',
  };
  const classes = useStyles(styleProps);
  return <div className={classes.title}>{props.text}</div>;
}

export default Header;
