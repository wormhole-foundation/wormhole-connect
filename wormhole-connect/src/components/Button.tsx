import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { joinClass } from '../utils/style';

const useStyles = makeStyles()((theme) => ({
  button: {
    width: '100%',
    backgroundColor: theme.palette.button.primary,
    color: theme.palette.button.primaryText,
    borderRadius: '8px',
    border: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px 64px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  disabled: {
    cursor: 'not-allowed',
    clickEvents: 'none',
    backgroundColor: theme.palette.button.disabled + ' !important',
    color: theme.palette.button.disabledText + ' !important',
  },
  elevated: {
    boxShadow: theme.palette.card.elevation,
  },
  action: {
    backgroundColor: theme.palette.button.action,
    color: theme.palette.button.actionText,
    border: 'none',
  },
}));

type Props = {
  action?: boolean;
  elevated?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

function Button(props: Props) {
  const { classes } = useStyles();
  const click = (e) => {
    if (props.onClick && !props.disabled) {
      props.onClick(e);
    }
  };
  return (
    <div
      className={joinClass([
        classes.button,
        !!props.elevated && classes.elevated,
        !!props.action && classes.action,
        !!props.disabled && classes.disabled,
      ])}
      onClick={click}
    >
      {props.children}
    </div>
  );
}

export default Button;
