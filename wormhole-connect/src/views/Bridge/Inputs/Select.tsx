import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { Icon } from 'config/types';
import { NO_INPUT } from 'utils/style';
import TokenIcon from 'icons/TokenIcons';
import Input from './Input';

const useStyles = makeStyles()((theme) => ({
  select: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  secondaryText: {
    opacity: '0.6',
    fontSize: '13px',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
}));

type Selected = {
  icon: Icon | string;
  text: string;
  secondaryText?: string;
};

type Props = {
  label: string;
  selected: Selected | undefined;
  error?: boolean;
  editable?: boolean;
  disabled?: boolean;
  onClick?: any;
};

function Select(props: Props) {
  const { classes } = useStyles();
  const { selected } = props;
  const handleClick = () => {
    if (props.editable && !props.disabled) {
      props.onClick();
    }
  };

  return (
    <Input
      label={props.label}
      error={props.error}
      editable={props.editable}
      disabled={props.disabled}
      onClick={handleClick}
    >
      {selected ? (
        <div className={classes.select}>
          <TokenIcon icon={selected.icon} height={24} />
          {selected.text}
          {selected.secondaryText && (
            <div className={classes.secondaryText}>
              {selected.secondaryText}
            </div>
          )}
        </div>
      ) : props.disabled ? (
        NO_INPUT
      ) : (
        <div className={classes.select}>
          <TokenIcon height={24} />
          Select
        </div>
      )}
    </Input>
  );
}

export default Select;
