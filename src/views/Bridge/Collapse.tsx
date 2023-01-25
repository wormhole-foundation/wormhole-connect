import React from 'react';
import { makeStyles } from 'tss-react/mui';
import Collapse from '@mui/material/Collapse';
import Down from '../../icons/components/Down';
import { joinClass, OPACITY } from '../../utils/style';

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    borderRadius: '8px',
    boxShadow: theme.palette.card.elevation,
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
    backgroundColor: theme.palette.card.background + OPACITY[80],
    borderRadius: '8px',
    transition: 'border-radius 0.4s',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  invert: {
    transform: 'rotate(180deg)',
  },
  arrow: {
    width: '32px',
    height: '32px',
    transition: 'transform 0.4s',
  },
  controlled: {
    cursor: 'default !important',
  },
  banner: {
    borderBottomRightRadius: '8px',
    borderBottomLeftRadius: '8px',
    backgroundColor: theme.palette.info[200],
    padding: '8px 16px',
    transition: 'border-radius 0.4s',
  },
  open: {
    borderBottomLeftRadius: '0 !important',
    borderBottomRightRadius: '0 !important',
  },
  disabled: {
    opacity: '70%',
    cursor: 'not-allowed !important',
  },
}));

type Props = {
  text: string;
  children: JSX.Element | JSX.Element[];
  close?: boolean;
  disabled?: boolean;
  banner?: boolean;
  controlled?: boolean; // control the open/closed state
  value?: boolean; // open/closed value
};

function BridgeCollapse(props: Props) {
  const { classes } = useStyles();
  const [collapsed, setCollapsed] = React.useState(props.close || false);
  const toggleCollapsed = () =>
    !props.disabled && setCollapsed((prev) => !prev);
  const collapsedState = props.controlled ? props.value : collapsed;
  return (
    <div className={classes.container}>
      <div
        className={joinClass([
          classes.header,
          (!!props.banner || !collapsedState) && classes.open,
          !!props.disabled && classes.disabled,
          !!props.controlled && classes.controlled,
        ])}
        onClick={toggleCollapsed}
      >
        <div className={classes.title}>{props.text}</div>
        {!props.controlled && (
          <Down
            className={joinClass([classes.arrow, !collapsed && classes.invert])}
          />
        )}
      </div>
      {props.banner && (
        <div
          className={joinClass([
            classes.banner,
            !collapsedState && classes.open,
          ])}
        >
          This feature provided by xLabs
        </div>
      )}
      <Collapse in={!collapsedState}>{props.children}</Collapse>
    </div>
  );
}

export default BridgeCollapse;
