import React from 'react';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material';

type Props = {
  children: JSX.Element | JSX.Element[];
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

const useStyles = makeStyles((theme: Theme) => ({
  input: {
    width: '100%',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: `${theme.palette.card.background}`,
    boxShadow: `${theme.palette.card.elevation}`,
  },
}));

function InputContainer(props: Props) {
  const classes = useStyles();
  return (
    <div
      className={classes.input}
      onClick={props.onClick}
      style={{ cursor: !!props.onClick ? 'pointer' : 'default' }}
    >
      {props.children}
    </div>
  );
}

export default InputContainer;
