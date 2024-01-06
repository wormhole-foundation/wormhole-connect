import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { joinClass } from 'utils/style';
import { Collapse } from '@mui/material';

const useStyles = makeStyles()((theme: any) => ({
  options: {
    backgroundColor: theme.palette.card.background,
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
  },
  option: {
    width: '100%',
    borderRadius: '0',
    backgroundColor: theme.palette.card.background,
    '&:last-child': {
      borderBottomLeftRadius: '8px',
      borderBottomRightRadius: '8px',
    },
    '&:not(:last-child)': {
      borderBottom: `0.5px solid ${theme.palette.divider}`,
    },
  },
  optionContent: {
    padding: '16px',
  },
  optionContentEnabled: {
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

export type Option = {
  key: any;
  child: any;
  disabled?: boolean;
};
type Props = {
  children: Option[];
  onSelect: (value: any) => void;
  active?: number | string;
  collapsable?: boolean;
  collapsed?: boolean;
};

function Options(props: Props) {
  const { classes } = useStyles();

  const isCollapsed = (key: any) => {
    return props.collapsable && props.collapsed && props.active !== key;
  };

  return (
    <div className={classes.options}>
      {props.children.map((option, i) => {
        return (
          <Collapse
            in={!isCollapsed(option.key)}
            key={i}
            className={joinClass([
              classes.option,
              props.active === option.key && classes.active,
            ])}
            unmountOnExit
          >
            <div
              className={joinClass([
                classes.optionContent,
                !option.disabled && classes.optionContentEnabled,
              ])}
              onClick={() => props.onSelect(option.key)}
              style={{
                cursor: props.children.length > 0 ? 'pointer' : 'default',
              }}
            >
              {option.child}
            </div>
          </Collapse>
        );
      })}
    </div>
  );
}

export default Options;
