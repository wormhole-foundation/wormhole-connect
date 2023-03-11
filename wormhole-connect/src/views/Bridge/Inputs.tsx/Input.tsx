import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { ERROR_BORDER, joinClass } from '../../../utils/style';

const useStyles = makeStyles()((theme) => ({
  inputField: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: '8px',
    width: '100%',
    padding: '12px',
  },
  editable: {
    backgroundColor: theme.palette.card.secondary,
    cursor: 'pointer',
  },
  label: {
    fontSize: '14px',
    color: theme.palette.text.secondary,
    marginBottom: '4px',
  },
  content: {
    overflow: 'hidden',
  },
  error: ERROR_BORDER(theme),
}));

type Props = {
  label: string;
  error?: boolean;
  editable?: boolean;
  onClick?: any;
  children: any;
};

function Input(props: Props) {
  const { classes } = useStyles();

  const inputClasses = [
    classes.inputField,
    !!props.error && classes.error,
    !!props.editable && classes.editable,
  ];

  return (
    <div className={joinClass(inputClasses)} onClick={props.onClick}>
      <div className={classes.label}>{props.label}</div>
      <div className={classes.content}>{props.children}</div>
    </div>
  );
}

export default Input;
