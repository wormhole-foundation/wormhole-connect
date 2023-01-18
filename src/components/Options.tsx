import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { OPACITY } from '../utils/style';

const useStyles = makeStyles()((theme) => ({
  option: {
    position: 'relative',
    width: '100%',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: `${theme.palette.primary[50] + OPACITY[5]}`,
    '&:last-child': {
      borderTopLeftRadius: '0',
      borderTopRightRadius: '0',
    },
    '&:first-of-type': {
      borderBottomLeftRadius: '0',
      borderBottomRightRadius: '0',
    },
    '&:not(:last-child)': {
      borderBottom: `0.5px solid ${theme.palette.primary[500] + OPACITY[40]}`,
    },
    '&:hover': {
      backgroundColor: `${theme.palette.primary[50] + OPACITY[7]}`,
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
    backgroundColor: `${theme.palette.primary[50] + OPACITY[10]} !important`,
  },
}));

type Props = {
  children: JSX.Element[];
  active?: number;
};

function Options(props: Props) {
  const { classes } = useStyles();
  // dispatch selectOption event
  const emitSelectOption = (key: number) => {
    const event = new CustomEvent('selectOption', { detail: key });
    document.dispatchEvent(event);
  };

  return (
    <div>
      {props.children.map((child, i) => {
        return (
          <div
            className={`${classes.option} ${
              props.active === i && classes.active
            }`}
            onClick={() => emitSelectOption(i + 1)}
            style={{
              cursor: props.children.length > 0 ? 'pointer' : 'default',
            }}
            key={i}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

export default Options;
