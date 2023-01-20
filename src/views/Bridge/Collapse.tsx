import React from 'react';
import { makeStyles } from 'tss-react/mui';
import Collapse from '@mui/material/Collapse';
import Down from '../../icons/components/Down';
import { joinClass } from '../../utils/style';

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px 8px 16px',
    cursor: 'pointer',
  },
  disabled: {
    opacity: '70%',
    cursor: 'not-allowed',
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
}));

type Props = {
  text: string;
  children: JSX.Element | JSX.Element[];
  close?: boolean;
  disabled?: boolean;
};

function BridgeCollapse(props: Props) {
  const { classes } = useStyles();
  const [collapsed, setCollapsed] = React.useState(props.close || false);
  const toggleCollapsed = () =>
    !props.disabled && setCollapsed((prev) => !prev);
  return (
    <div
      className={`${classes.container} ${props.disabled && classes.disabled}`}
    >
      <div className={classes.header} onClick={toggleCollapsed}>
        <div className={classes.title}>{props.text}</div>
        <Down
          className={joinClass([classes.arrow, !collapsed && classes.invert])}
        />
      </div>
      <Collapse in={!collapsed}>{props.children}</Collapse>
    </div>
  );
}

export default BridgeCollapse;
