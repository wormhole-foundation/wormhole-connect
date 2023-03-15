import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { joinClass } from '../utils/style';

const useStyles = makeStyles()((theme) => ({
  options: {
    backgroundColor: theme.palette.card.background,
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
  },
  option: {
    position: 'relative',
    width: '100%',
    padding: '16px',
    borderRadius: '0',
    backgroundColor: theme.palette.card.background,
    '&:last-child': {
      borderBottomLeftRadius: '8px',
      borderBottomRightRadius: '8px',
    },
    '&:not(:last-child)': {
      borderBottom: `0.5px solid ${theme.palette.divider}`,
    },
    '&:hover': {
      backgroundColor: theme.palette.options.hover,
    },
  },
  arrow: {
    position: 'absolute',
    right: '0',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  invert: {
    transform: 'rotate(180deg)',
  },
  active: {
    backgroundColor: `${theme.palette.options.select} !important`,
  },
}));

type Option = {
  key: any;
  child: any;
};
type Props = {
  children: Option[];
  active?: number;
};

function Options(props: Props) {
  const { classes } = useStyles();
  // dispatch selectOption event
  const emitSelectOption = (key: any) => {
    const event = new CustomEvent('selectOption', { detail: key });
    document.dispatchEvent(event);
  };

  return (
    <div className={classes.options}>
      {props.children.map((option, i) => {
        return (
          <div
            className={joinClass([
              classes.option,
              props.active === option.key && classes.active,
            ])}
            onClick={() => emitSelectOption(option.key)}
            style={{
              cursor: props.children.length > 0 ? 'pointer' : 'default',
            }}
            key={i}
          >
            {option.child}
          </div>
        );
      })}
    </div>
  );
}

export default Options;
