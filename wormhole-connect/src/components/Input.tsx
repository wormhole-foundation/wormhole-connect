import React from 'react';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material';
import InputTransparent from './InputTransparent';
import InputContainer from './InputContainer';

type Props = {
  left?: JSX.Element;
  right?: JSX.Element;
};

const useStyles = makeStyles((theme: Theme) => ({
  inputContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flexGrow: 1,
  },
}));

function Input({ left, right }: Props) {
  const classes = useStyles();
  return (
    <InputContainer>
      <div className={classes.inputContent}>
        {left}
        <div className={classes.input}>
          <InputTransparent />
        </div>
        {right}
      </div>
    </InputContainer>
  );
}

export default Input;
