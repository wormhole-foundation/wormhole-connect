import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { ERROR_BORDER, joinClass } from 'utils/style';

type StyleProps = { cursorStyle?: string };
const useStyles = makeStyles<StyleProps>()((theme: any, { cursorStyle }) => ({
  inputField: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: '8px',
    width: '100%',
    padding: '12px',
    cursor: 'default',
  },
  editable: {
    backgroundColor: theme.palette.card.secondary,
  },
  enabled: {
    cursor: cursorStyle || 'pointer',
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
  disabled?: boolean;
  onClick?: any;
  children: any;
  cursor?: string;
};

function Input(props: Props) {
  const { classes } = useStyles({ cursorStyle: props.cursor });

  const inputClasses = [
    classes.inputField,
    !!props.error && classes.error,
    !!props.editable && classes.editable,
    !props.disabled && classes.enabled,
  ];

  return (
    <div className={joinClass(inputClasses)} onClick={props.onClick}>
      <div className={classes.label}>{props.label}</div>
      <div className={classes.content}>{props.children}</div>
    </div>
  );
}

export default Input;
