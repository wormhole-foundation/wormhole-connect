import React from 'react';
import { makeStyles } from 'tss-react/mui';
import InputTransparent from './InputTransparent';
import InputContainer from './InputContainer';

type Props = {
  left?: JSX.Element;
  right?: JSX.Element;
};

const useStyles = makeStyles()((theme) => ({
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
  const { classes } = useStyles();
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
