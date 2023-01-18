import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { OPACITY } from '../utils/style';

const useStyles = makeStyles()((theme) => ({
  button: {
    width: '100%',
    backgroundColor: `${theme.palette.primary[50] + OPACITY[5]}`,
    borderRadius: '8px',
    border: `1px solid ${theme.palette.primary[50] + OPACITY[30]}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px 64px',
    cursor: 'pointer',
  },
}));

type Props = {
  text?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

function Button(props: Props) {
  const { classes } = useStyles();
  return (
    <div className={classes.button} onClick={props.onClick}>
      {props.text}
    </div>
  );
}

export default Button;
