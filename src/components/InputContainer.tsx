import React from 'react';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material';

type Props = {
  children: JSX.Element;
};

const useStyles = makeStyles((theme: Theme) => ({
  input: {
    width: '100%',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: `${theme.palette.primary[50] + '0f'}`,
    cursor: 'pointer',
  },
}));

function InputContainer({ children }: Props) {
  const classes = useStyles();
  return <div className={classes.input}>{children}</div>;
}

export default InputContainer;
