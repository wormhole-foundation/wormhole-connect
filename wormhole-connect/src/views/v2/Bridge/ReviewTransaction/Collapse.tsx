import React, { useCallback, useEffect } from 'react';
import { makeStyles } from 'tss-react/mui';
import Collapse from '@mui/material/Collapse';
import { LINK, joinClass } from 'utils/style';
import Switch from 'components/Switch';

const useStyles = makeStyles()((theme: any) => ({
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
    backgroundColor: theme.palette.card.background,
    backgroundOpacity: '80%',
    borderRadius: '8px',
    transition: 'border-radius 0.4s',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  description: {
    fontSize: '14px',
    opacity: '80%',
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
    backgroundColor: theme.palette.info[500],
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'row',
    transition: 'border-radius 0.1s 0.3s',
  },
  open: {
    transition: 'border-radius 0s 0s',
    borderBottomLeftRadius: '0 !important',
    borderBottomRightRadius: '0 !important',
  },
  disabled: {
    opacity: '70%',
    cursor: 'not-allowed !important',
  },
  link: {
    ...LINK(theme),
    margin: '0 0 0 4px',
  },
  collapseControl: {
    cursor: 'pointer',
  },
}));

type Props = {
  title: string;
  description?: string;
  children: JSX.Element | JSX.Element[];
  startClosed?: boolean;
  disabled?: boolean;
  controlled?: boolean; // control the open/closed state
  value?: boolean; // open/closed value
  onCollapseChange?: (value: boolean) => void;
  disableCollapse?: boolean;
};

function BridgeCollapse(props: Props) {
  const { classes } = useStyles();
  const { onCollapseChange, disabled, startClosed } = props;
  const [collapsed, setCollapsed] = React.useState(startClosed || false);

  const toggleCollapsed = useCallback(() => {
    if (disabled) return;
    setCollapsed((prev) => {
      if (onCollapseChange) {
        onCollapseChange(!prev);
      }
      return !prev;
    });
  }, [disabled, onCollapseChange]);

  useEffect(() => {
    setCollapsed(startClosed || false);
  }, [startClosed]);

  const collapsedState = props.controlled ? props.value || false : collapsed;

  return (
    <div className={classes.container}>
      <div
        className={joinClass([
          classes.header,
          !collapsedState && classes.open,
          !!disabled && classes.disabled,
        ])}
      >
        <div>
          <div className={classes.title}>{props.title}</div>
          {props.description && (
            <div className={classes.description}>{props.description}</div>
          )}
        </div>
        <div onClick={toggleCollapsed} className={classes.collapseControl}>
          <Switch checked={!collapsed} />
        </div>
      </div>
      <Collapse in={props.disableCollapse || !collapsedState} unmountOnExit>
        {props.children}
      </Collapse>
    </div>
  );
}

export default BridgeCollapse;
