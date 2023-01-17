import React from 'react';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material';

const useStyles = makeStyles((theme: Theme) => ({
  input: {
    width: '100%',
    border: 'none',
    backgroundImage: 'none',
    backgroundColor: 'transparent',
    background: 'transparent',
    fontSize: 'inherit',
    boxShadow: 'none',
    webkitBoxShadow: 'none',
    moxBoxShadow: 'none',
    outline: 'none',
  },
}));

type Props = {
  placeholder?: string;
  type?: 'string' | 'number';
};

function InputTransparent(props: Props) {
  const classes = useStyles();
  return (
    <input
      className={classes.input}
      placeholder={props.placeholder}
      type={props.type}
    />
  );
}

export default InputTransparent;
